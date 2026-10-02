begin;
-- Directory review is distinct from authorization to publish property listings.
alter table public.professionals
 add column directory_documents jsonb not null default '{}',
 add column directory_review jsonb,
 add column directory_reviewed_at timestamptz,
 add column directory_valid_until timestamptz,
 add constraint directory_documents_object check(jsonb_typeof(directory_documents)='object' and octet_length(directory_documents::text)<=20000),
 add constraint directory_review_object check(directory_review is null or (jsonb_typeof(directory_review)='object' and octet_length(directory_review::text)<=20000));

create table sokile_private.directory_review_audit(
 id bigint generated always as identity primary key,
 professional_id bigint not null,
 actor_id uuid,
 changed_at timestamptz not null default now(),
 status text not null,
 review jsonb,
 valid_until timestamptz
);
alter table sokile_private.directory_review_audit enable row level security;
revoke all on sokile_private.directory_review_audit from public,anon,authenticated;
grant select,delete on sokile_private.directory_review_audit to service_role;
create index directory_review_audit_retention on sokile_private.directory_review_audit(changed_at);

create or replace function sokile_private.guard_directory_review()
returns trigger language plpgsql security invoker set search_path='' as $$
declare item record;path text;must_check boolean;approving boolean;owner_submission boolean;
begin
 perform pg_advisory_xact_lock(2061001);
 -- The service-only retention function may erase expired private evidence.
 if current_user='service_role' and tg_op='UPDATE'
  and greatest(old.updated_at,old.directory_valid_until)<now()-interval '12 months'
  and new.directory_documents='{}'::jsonb and new.directory_review is null
  and new.directory_reviewed_at is null and new.directory_valid_until is null
  and new.status='en_attente' and not new.active
  and (to_jsonb(new)-array['directory_documents','directory_review','directory_reviewed_at','directory_valid_until','status','active','updated_at'])
    =(to_jsonb(old)-array['directory_documents','directory_review','directory_reviewed_at','directory_valid_until','status','active','updated_at']) then return new;end if;
 if tg_op='UPDATE' and new.owner_id is distinct from old.owner_id then raise exception 'Le titulaire du compte ne peut pas être changé.';end if;
 owner_submission:=not coalesce(public.sokile_is_admin(),false);
 if owner_submission then
  if auth.uid() is null or new.owner_id is distinct from auth.uid() then raise exception 'Compte non autorisé.';end if;
  new.status:='en_attente';new.active:=false;new.directory_review:=null;new.directory_reviewed_at:=null;new.directory_valid_until:=null;
 end if;
 approving:=new.status='validee' or new.active;
 if approving and not coalesce(public.sokile_is_admin(),false) then raise exception 'Validation réservée à Sokilé.';end if;
 if new.active and new.status<>'validee' then raise exception 'Une fiche active doit être validée.';end if;
 if owner_submission or approving then
  if nullif(trim(new.business_name),'') is null or nullif(trim(new.description),'') is null
   or nullif(trim(new.email),'') is null or nullif(trim(new.phone),'') is null or new.consent_at is null
   or coalesce(cardinality(new.countries),0)=0 or cardinality(new.countries)>12
   or new.specialty is null or new.specialty not in('Agence immobilière','Courtier immobilier','Promoteur immobilier','Géomètre','Notaire','Architecte','BTP / Construction','Vérification terrain','Juridique','Financement','Déménagement')
   or exists(select 1 from unnest(new.countries) c where c is null or c not in('Bénin','Burkina Faso','Côte d''Ivoire','Mali','Niger','Sénégal','Togo','Cameroun','Centrafrique','Congo','Gabon','Tchad')) then
   raise exception 'Complétez la fiche : nom, activité, pays, coordonnées, présentation et confirmation.';
  end if;
  if coalesce(new.directory_documents->'registration'->>'path','')='' then raise exception 'Ajoutez votre justificatif professionnel.';end if;
 end if;
 for item in select * from jsonb_each(new.directory_documents) loop
  path:=item.value->>'path';
  if item.key not in('registration','authority','mandate') or jsonb_typeof(item.value)<>'object'
   or coalesce(path,'')='' or length(coalesce(item.value->>'name',''))>500
   or path !~ ('^'||new.owner_id::text||'/[0-9a-f-]{36}\.(pdf|jpg|png)$')
   or not exists(select 1 from storage.objects where bucket_id='pro-verification-documents' and name=path) then raise exception 'Justificatif privé absent ou inaccessible.';end if;
  if not exists(select 1 from storage.objects where bucket_id='pro-verification-documents' and name=path and created_at>now()-interval '30 days')
   and not exists(select 1 from public.pro_verifications v,lateral jsonb_each(v.documents) d where v.owner_id=new.owner_id and d.value->>'path'=path)
   and not exists(select 1 from public.professionals p,lateral jsonb_each(p.directory_documents) d where p.owner_id=new.owner_id and d.value->>'path'=path)
   then raise exception 'Cette pièce ancienne n’est plus rattachée. Déposez-la à nouveau.';end if;
 end loop;
 if approving then
  must_check:=new.specialty in('Agence immobilière','Courtier immobilier','Promoteur immobilier','Géomètre','Notaire','Architecte','Vérification terrain','Juridique','Financement');
  if coalesce(new.directory_review->>'identity','')<>'true' or coalesce(new.directory_review->>'content','')<>'true'
   or coalesce(new.directory_review->>'title','') not in('checked','not_applicable')
   or (must_check and (new.directory_review->>'title'<>'checked' or nullif(trim(new.verification_reference),'') is null))
   or coalesce(length(trim(new.directory_review->>'notes')),0)<30 or length(new.directory_review->>'notes')>4000
   then raise exception 'Consignez le contrôle de la fiche et, si nécessaire, les sources recoupées pour les pays annoncés.';end if;
  if new.directory_valid_until is null or new.directory_valid_until<=now() or new.directory_valid_until>now()+interval '1 year' then raise exception 'Choisissez une échéance future, dans douze mois au maximum, sans dépasser la validité des pièces.';end if;
  new.directory_reviewed_at:=now();
 elsif new.status<>'validee' then
  new.active:=false;
 end if;
 return new;
end $$;
revoke all on function sokile_private.guard_directory_review() from public,anon,authenticated;
drop trigger zzzz_professional_verification on public.professionals;
create trigger zzzz_directory_review before insert or update on public.professionals for each row execute function sokile_private.guard_directory_review();

create or replace function sokile_private.audit_directory_review()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status or new.directory_review is distinct from old.directory_review or new.directory_valid_until is distinct from old.directory_valid_until then
  insert into sokile_private.directory_review_audit(professional_id,actor_id,status,review,valid_until) values(new.id,auth.uid(),new.status,new.directory_review,new.directory_valid_until);
 end if;
 return new;
end $$;
revoke all on function sokile_private.audit_directory_review() from public,anon,authenticated;
create trigger audit_directory_review after insert or update on public.professionals for each row execute function sokile_private.audit_directory_review();

-- Deliberately curated owner view: raw table RLS remains owner/admin only.
-- No documents, review notes, owner IDs, email or private references are exposed.
create or replace view public.public_professionals as
 select id,business_name,specialty,countries,zones,phone,website,pricing,description,true as professional_verified
 from public.professionals
 where active=true and status='validee' and directory_reviewed_at is not null and directory_valid_until>now()
 and coalesce(directory_documents->'registration'->>'path','')<>'';
revoke all on public.professionals from anon;
revoke truncate,references,trigger on public.professionals from authenticated;
grant select on public.public_professionals to anon,authenticated;
grant select,update on public.professionals to service_role;

create or replace function public.sokile_pro_retention(p_dry_run boolean default true)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare dossiers bigint;audits bigint;directories bigint;directory_audits bigint;paths jsonb;
begin
 perform pg_advisory_xact_lock(2061001);
 select count(*) into dossiers from public.pro_verifications where greatest(updated_at,valid_until)<now()-interval '12 months';
 select count(*) into audits from sokile_private.pro_verification_audit where changed_at<now()-interval '12 months';
 select count(*) into directories from public.professionals where greatest(updated_at,directory_valid_until)<now()-interval '12 months' and (directory_documents<>'{}'::jsonb or directory_review is not null);
 select count(*) into directory_audits from sokile_private.directory_review_audit where changed_at<now()-interval '12 months';
 if not p_dry_run then
  delete from public.pro_verifications where greatest(updated_at,valid_until)<now()-interval '12 months';
  delete from sokile_private.pro_verification_audit where changed_at<now()-interval '12 months';
  update public.professionals set directory_documents='{}',directory_review=null,directory_reviewed_at=null,directory_valid_until=null,status='en_attente',active=false
   where greatest(updated_at,directory_valid_until)<now()-interval '12 months' and (directory_documents<>'{}'::jsonb or directory_review is not null);
  delete from sokile_private.directory_review_audit where changed_at<now()-interval '12 months';
 end if;
 select coalesce(jsonb_agg(name),'[]') into paths from (
  select o.name from storage.objects o where o.bucket_id='pro-verification-documents' and o.created_at<now()-interval '30 days'
  and not exists(select 1 from public.pro_verifications v,lateral jsonb_each(v.documents) d where d.value->>'path'=o.name)
  and not exists(select 1 from public.professionals p,lateral jsonb_each(p.directory_documents) d where d.value->>'path'=o.name)
  order by o.created_at limit 100
 ) candidates;
 return jsonb_build_object('dossiers',dossiers,'audit_rows',audits,'directory_dossiers',directories,'directory_audit_rows',directory_audits,'orphan_paths',paths,'dry_run',p_dry_run);
end $$;
revoke all on function public.sokile_pro_retention(boolean) from public,anon,authenticated;
grant execute on function public.sokile_pro_retention(boolean) to service_role;
notify pgrst,'reload schema';
commit;

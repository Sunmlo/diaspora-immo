begin;
alter table public.properties add column evidence_revision bigint not null default 0;
create table public.individual_verifications(
 id uuid primary key default gen_random_uuid(),property_id bigint not null unique references public.properties(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,revision bigint not null default 0,
 holder_name text not null check(length(trim(holder_name)) between 2 and 200),basis text not null check(length(trim(basis)) between 10 and 3000),
 situation text not null check(situation in('sole','shared','estate','other')),documents jsonb not null check(jsonb_typeof(documents)='object' and octet_length(documents::text)<50000),
 consent_at timestamptz not null,updated_at timestamptz not null default now(),status text not null default 'en_attente' check(status in('en_attente','complement','verified','suspended')),
 review_checks jsonb,review_evidence text,response text,verified_at timestamptz,verified_by uuid references auth.users(id) on delete set null,valid_until timestamptz
);
alter table public.individual_verifications enable row level security;
revoke all on public.individual_verifications from public,anon,authenticated;
grant select,insert,update on public.individual_verifications to authenticated;
create policy individual_read on public.individual_verifications for select to authenticated using(owner_id=(select auth.uid()) or public.sokile_is_admin());
create policy individual_insert on public.individual_verifications for insert to authenticated with check(owner_id=(select auth.uid()));
create policy individual_update on public.individual_verifications for update to authenticated using(owner_id=(select auth.uid()) or public.sokile_is_admin()) with check(owner_id=(select auth.uid()) or public.sokile_is_admin());
create index individual_owner on public.individual_verifications(owner_id);
create index individual_reviewer on public.individual_verifications(verified_by);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('individual-verification-documents','individual-verification-documents',false,5242880,array['application/pdf','image/jpeg','image/png']);
create policy individual_documents_insert on storage.objects for insert to authenticated with check(bucket_id='individual-verification-documents' and (storage.foldername(name))[1]=(select auth.uid())::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png)$');
create policy individual_documents_read on storage.objects for select to authenticated using(bucket_id='individual-verification-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.sokile_is_admin()));
create policy individual_documents_guard on storage.objects as restrictive for all to authenticated using(bucket_id<>'individual-verification-documents' or ((storage.foldername(name))[1]=(select auth.uid())::text or public.sokile_is_admin())) with check(bucket_id<>'individual-verification-documents' or (storage.foldername(name))[1]=(select auth.uid())::text);
create or replace function sokile_private.guard_individual_verification() returns trigger language plpgsql security invoker set search_path='' as $$
declare p public.properties;code text;d jsonb;path text;expiry date;earliest date;
begin
 perform pg_advisory_xact_lock(2061002);
 if auth.uid() is null then raise exception 'Authentification requise.';end if;
 select * into p from public.properties where id=new.property_id;
 if p.id is null or p.owner_id<>new.owner_id or p.advertiser_type='pro' then raise exception 'Annonce particulière introuvable ou non autorisée.';end if;
 if tg_op='UPDATE' and (new.owner_id,new.property_id) is distinct from (old.owner_id,old.property_id) then raise exception 'Dossier non réaffectable.';end if;
 if not public.sokile_is_admin() then
  if auth.uid()<>new.owner_id then raise exception 'Dossier non autorisé.';end if;
  new.status:='en_attente';new.review_checks:=null;new.review_evidence:=null;new.response:=null;new.verified_at:=null;new.verified_by:=null;new.valid_until:=null;new.consent_at:=now();new.revision:=p.evidence_revision;
 elsif tg_op='UPDATE' and (new.holder_name,new.basis,new.situation,new.documents,new.revision) is distinct from (old.holder_name,old.basis,old.situation,old.documents,old.revision) then raise exception 'Le déposant doit modifier ses propres pièces.';
 end if;
 if new.status in('en_attente','verified') then
  if coalesce(p.details->>'advertiser_role','') not in('Propriétaire','Représentant du propriétaire') then raise exception 'Rôle du déposant à compléter dans l’annonce.';end if;
  foreach code in array array['right','mandate','extra'] loop
   d:=new.documents->code;path:=d->>'path';
   if coalesce(path,'')='' and (code='extra' or (code='mandate' and p.details->>'advertiser_role'='Propriétaire')) then continue;end if;
   if coalesce(path,'')='' or coalesce(length(trim(d->>'reference')),0)=0 or coalesce(length(trim(d->>'issuer')),0)=0 or length(d->>'reference')>200 or length(d->>'issuer')>200 then raise exception 'Pièce incomplète : %.',code;end if;
   if path !~ ('^'||new.owner_id::text||'/[0-9a-f-]{36}\.(pdf|jpg|png)$') or not exists(select 1 from storage.objects where bucket_id='individual-verification-documents' and name=path) then raise exception 'Justificatif privé absent ou inaccessible.';end if;
   if not exists(select 1 from storage.objects where bucket_id='individual-verification-documents' and name=path and created_at>now()-interval '30 days') and not exists(select 1 from public.individual_verifications v,lateral jsonb_each(v.documents) e where v.owner_id=new.owner_id and e.value->>'path'=path) then raise exception 'Fichier non rattaché trop ancien. Téléversez-le à nouveau.';end if;
   if coalesce(d->>'no_expiry','false')='true' then
    if coalesce(d->>'expires_on','')<>'' then raise exception 'Validité contradictoire.';end if;
   else
    if coalesce(d->>'expires_on','')!~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Échéance du justificatif requise.';end if;
    expiry:=(d->>'expires_on')::date;if expiry<current_date then raise exception 'Justificatif expiré.';end if;earliest:=least(earliest,expiry);
   end if;
  end loop;
 end if;
 if new.status='verified' then
  if not public.sokile_is_admin() or new.revision<>p.evidence_revision then raise exception 'Dossier à renouveler après modification de l’annonce.';end if;
  if coalesce(new.review_checks->>'identity','false')<>'true' or coalesce(new.review_checks->>'right','false')<>'true' or coalesce(new.review_checks->>'authority','false')<>'true' or coalesce(new.review_checks->>'risk','false')<>'true' or coalesce(length(trim(new.review_evidence)),0)<80 then raise exception 'Consignez les quatre contrôles et leur résultat (80 caractères minimum).';end if;
  if new.valid_until is null or new.valid_until<=now() or new.valid_until>now()+interval '1 year' or (earliest is not null and new.valid_until>(earliest+1)::timestamptz) then raise exception 'Échéance invalide : 12 mois maximum, sans dépasser la validité des pièces.';end if;
  new.verified_at:=now();new.verified_by:=auth.uid();
 elsif new.status in('complement','suspended') then
  if coalesce(length(trim(new.response)),0)<30 then raise exception 'Précisez les compléments ou la raison de suspension (30 caractères minimum).';end if;
  new.valid_until:=null;new.verified_at:=null;new.verified_by:=null;
 end if;
 new.updated_at:=now();return new;
end $$;
revoke all on function sokile_private.guard_individual_verification() from public;
create trigger guard_individual_verification before insert or update on public.individual_verifications for each row execute function sokile_private.guard_individual_verification();
create table sokile_private.individual_verification_audit(id bigint generated always as identity primary key,dossier_id uuid,owner_id uuid,actor_id uuid,property_id bigint,status text,evidence text,checks jsonb,changed_at timestamptz not null default now());
alter table sokile_private.individual_verification_audit enable row level security;
revoke all on sokile_private.individual_verification_audit from public,anon,authenticated;
create or replace function sokile_private.audit_individual_verification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentification requise.';end if;
 insert into sokile_private.individual_verification_audit(dossier_id,owner_id,actor_id,property_id,status,evidence,checks) values(new.id,new.owner_id,auth.uid(),new.property_id,new.status,new.review_evidence,new.review_checks);return new;
end $$;
revoke all on function sokile_private.audit_individual_verification() from public,anon,authenticated;
create trigger audit_individual_verification after insert or update on public.individual_verifications for each row execute function sokile_private.audit_individual_verification();
create or replace function public.sokile_review_individual(p_id uuid,p_status text,p_checks jsonb,p_evidence text,p_response text,p_until date) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not public.sokile_is_admin() then raise exception 'Accès réservé à Sokilé.';end if;
 if p_status not in('verified','complement','suspended') or length(p_evidence)>5000 or length(p_response)>4000 then raise exception 'Décision invalide.';end if;
 update public.individual_verifications set status=p_status,review_checks=p_checks,review_evidence=trim(p_evidence),response=nullif(trim(p_response),''),valid_until=case when p_status='verified' then p_until::timestamptz else null end where id=p_id;
 if not found then raise exception 'Dossier introuvable.';end if;
end $$;
revoke all on function public.sokile_review_individual(uuid,text,jsonb,text,text,date) from public,anon;
grant execute on function public.sokile_review_individual(uuid,text,jsonb,text,text,date) to authenticated;
create or replace function sokile_private.require_individual_verification() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.evidence_revision:=0;
 else
  new.evidence_revision:=old.evidence_revision;
  if jsonb_build_array(to_jsonb(new)->'owner_id',to_jsonb(new)->'advertiser_type',to_jsonb(new)->'agency_name',to_jsonb(new)->'professional_activity',to_jsonb(new)->'title',to_jsonb(new)->'country',to_jsonb(new)->'city',to_jsonb(new)->'neighborhood',to_jsonb(new)->'type',to_jsonb(new)->'transaction',to_jsonb(new)->'nature',to_jsonb(new)->'surface',to_jsonb(new)->'details',to_jsonb(new)->'user_name',to_jsonb(new)->'user_email',to_jsonb(new)->'user_phone',to_jsonb(new)->'photos',to_jsonb(new)->'description') is distinct from jsonb_build_array(to_jsonb(old)->'owner_id',to_jsonb(old)->'advertiser_type',to_jsonb(old)->'agency_name',to_jsonb(old)->'professional_activity',to_jsonb(old)->'title',to_jsonb(old)->'country',to_jsonb(old)->'city',to_jsonb(old)->'neighborhood',to_jsonb(old)->'type',to_jsonb(old)->'transaction',to_jsonb(old)->'nature',to_jsonb(old)->'surface',to_jsonb(old)->'details',to_jsonb(old)->'user_name',to_jsonb(old)->'user_email',to_jsonb(old)->'user_phone',to_jsonb(old)->'photos',to_jsonb(old)->'description') then new.evidence_revision:=old.evidence_revision+1;end if;
 end if;
 if coalesce(new.advertiser_type,'particulier')<>'pro' then
  if new.details->>'advertiser_role'='Agence immobilière' then raise exception 'Choisissez le parcours professionnel pour publier en tant qu’agence.';end if;
  if new.status='validee' and not exists(select 1 from public.individual_verifications v where v.property_id=new.id and v.owner_id=new.owner_id and v.revision=new.evidence_revision and v.status='verified' and v.valid_until>now()) then raise exception 'Validez d’abord le lien du déposant avec le bien dans Examiner → Justificatifs privés.';end if;
 end if;
 return new;
end $$;
revoke all on function sokile_private.require_individual_verification() from public;
create trigger zzzzz_individual_verification before insert or update on public.properties for each row execute function sokile_private.require_individual_verification();
do $$ declare definition text;begin
 definition:=rtrim(pg_get_viewdef('public.public_properties'::regclass,true),';'||chr(10));
 execute 'create or replace view public.public_properties with (security_barrier=true) as select original.* from ('||definition||') original join public.properties source on source.id=original.id where source.advertiser_type=''pro'' or exists(select 1 from public.individual_verifications v where v.property_id=source.id and v.owner_id=source.owner_id and v.revision=source.evidence_revision and v.status=''verified'' and v.valid_until>now())';
end $$;
create or replace function public.sokile_individual_retention(p_dry_run boolean default true) returns jsonb language plpgsql security invoker set search_path='' as $$
declare dossiers bigint;audits bigint;paths jsonb;
begin
 perform pg_advisory_xact_lock(2061002);
 select count(*) into dossiers from public.individual_verifications where greatest(updated_at,valid_until)<now()-interval '12 months';
 select count(*) into audits from sokile_private.individual_verification_audit where changed_at<now()-interval '12 months';
 if not p_dry_run then
 delete from public.individual_verifications where greatest(updated_at,valid_until)<now()-interval '12 months';
 delete from sokile_private.individual_verification_audit where changed_at<now()-interval '12 months';end if;
 select coalesce(jsonb_agg(name),'[]') into paths from(select o.name from storage.objects o where o.bucket_id='individual-verification-documents' and o.created_at<now()-interval '30 days' and not exists(select 1 from public.individual_verifications v,lateral jsonb_each(v.documents) e where e.value->>'path'=o.name) order by o.created_at limit 100) candidates;
 return jsonb_build_object('dossiers',dossiers,'audit_rows',audits,'orphan_paths',paths,'dry_run',p_dry_run);
end $$;
revoke all on function public.sokile_individual_retention(boolean) from public,anon,authenticated;
grant execute on function public.sokile_individual_retention(boolean) to service_role;
grant select,delete on public.individual_verifications,sokile_private.individual_verification_audit to service_role;
notify pgrst,'reload schema';
commit;

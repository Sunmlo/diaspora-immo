-- Professional verification, private evidence and enforceable publication gates.
-- Existing public projections remain curated; no raw dossier/document is exposed.
begin;
create schema if not exists sokile_private;
create table if not exists public.pro_verification_rules(
 country text not null,activity text not null,rule_version text not null,
 review_required boolean not null default true,required_documents jsonb not null,
 description text not null,sources jsonb not null default '[]',primary key(country,activity)
);
alter table public.pro_verification_rules enable row level security;
grant select on public.pro_verification_rules to anon,authenticated;
revoke insert,update,delete,truncate,references,trigger on public.pro_verification_rules from anon,authenticated;
create policy pro_rules_read on public.pro_verification_rules for select to anon,authenticated using(true);
create table if not exists public.pro_verifications(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 country text not null,activity text not null,rule_version text not null,
 business_name text not null check(length(trim(business_name)) between 2 and 200),
 representative_name text not null check(length(trim(representative_name)) between 2 and 200),
 registration_number text not null check(length(trim(registration_number)) between 1 and 200),
 documents jsonb not null default '{}' check(jsonb_typeof(documents)='object' and octet_length(documents::text)<50000),
 consent_at timestamptz not null,submitted_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 status text not null default 'en_attente' check(status in('en_attente','complement','verified','suspended')),
 response text,review_evidence text,review_checks jsonb,verified_at timestamptz,verified_by uuid references auth.users(id) on delete set null,valid_until timestamptz,
 unique(owner_id,country,activity),foreign key(country,activity) references public.pro_verification_rules(country,activity)
);
create index pro_verification_queue on public.pro_verifications(status,submitted_at desc);
create index pro_verification_reviewer on public.pro_verifications(verified_by);
alter table public.pro_verifications enable row level security;
revoke all on public.pro_verifications from public,anon,authenticated;
grant select,insert,update on public.pro_verifications to authenticated;
create policy pro_dossier_read on public.pro_verifications for select to authenticated using(owner_id=(select auth.uid()) or public.sokile_is_admin());
create policy pro_dossier_insert on public.pro_verifications for insert to authenticated with check(owner_id=(select auth.uid()));
create policy pro_dossier_update on public.pro_verifications for update to authenticated using(owner_id=(select auth.uid()) or public.sokile_is_admin()) with check(owner_id=(select auth.uid()) or public.sokile_is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('pro-verification-documents','pro-verification-documents',false,5242880,array['application/pdf','image/jpeg','image/png']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
create policy pro_documents_insert on storage.objects for insert to authenticated with check(bucket_id='pro-verification-documents' and (storage.foldername(name))[1]=(select auth.uid())::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png)$');
create policy pro_documents_read on storage.objects for select to authenticated using(bucket_id='pro-verification-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.sokile_is_admin()));
-- No overwrite/update/delete permission: a reviewed object cannot be silently replaced.
-- Deletion/retention uses the authenticated backend Storage API, never SQL object deletion.
create policy pro_documents_guard on storage.objects as restrictive for all to authenticated using(bucket_id<>'pro-verification-documents' or ((storage.foldername(name))[1]=(select auth.uid())::text or public.sokile_is_admin())) with check(bucket_id<>'pro-verification-documents' or (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function sokile_private.check_pro_documents(p_owner uuid,p_country text,p_activity text,p_documents jsonb)
returns date language plpgsql security invoker set search_path='' as $$
declare required_doc jsonb;doc jsonb;expiry date;earliest date;path text;rules jsonb;
begin
 perform pg_advisory_xact_lock(2061001);
 select required_documents into rules from public.pro_verification_rules where country=p_country and activity=p_activity;
 if rules is null then raise exception 'Pays ou activité non pris en charge.';end if;
 for required_doc in select value from jsonb_array_elements(rules) loop
  doc:=p_documents->(required_doc->>'code');path:=doc->>'path';
  if required_doc->>'required'='false' and coalesce(path,'')='' then continue;end if;
  if doc is null or coalesce(length(trim(doc->>'reference')),0)=0 or coalesce(length(trim(doc->>'issuer')),0)=0 or coalesce(path,'')='' then raise exception 'Pièce incomplète : %.',required_doc->>'label';end if;
  if length(doc->>'reference')>200 or length(doc->>'issuer')>200 then raise exception 'Référence trop longue.';end if;
  if path !~ ('^'||p_owner::text||'/[0-9a-f-]{36}\.(pdf|jpg|png)$') or not exists(select 1 from storage.objects where bucket_id='pro-verification-documents' and name=path) then raise exception 'Fichier privé absent ou inaccessible : %.',required_doc->>'label';end if;
  if not exists(select 1 from storage.objects where bucket_id='pro-verification-documents' and name=path and created_at>now()-interval '30 days') and not exists(select 1 from public.pro_verifications v, lateral jsonb_each(v.documents) d where v.owner_id=p_owner and d.value->>'path'=path) then raise exception 'Fichier trop ancien non rattaché. Téléversez-le à nouveau.';end if;
  if coalesce(doc->>'no_expiry','false')='true' then
   if coalesce(doc->>'expires_on','')<>'' then raise exception 'Validité contradictoire.';end if;
  else
   if coalesce(doc->>'expires_on','')!~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Échéance requise : %.',required_doc->>'label';end if;
   expiry:=(doc->>'expires_on')::date;
   if expiry<current_date then raise exception 'Document expiré : %.',required_doc->>'label';end if;
   earliest:=least(earliest,expiry);
  end if;
 end loop;
 return earliest;
end $$;
revoke all on function sokile_private.check_pro_documents(uuid,text,text,jsonb) from public;
grant usage on schema sokile_private to authenticated;
grant execute on function sokile_private.check_pro_documents(uuid,text,text,jsonb) to authenticated;

create or replace function sokile_private.guard_pro_verification()
returns trigger language plpgsql security invoker set search_path='' as $$
declare expected_version text;earliest date;
begin
 if auth.uid() is null then raise exception 'Authentification requise.';end if;
 if tg_op='UPDATE' and (new.owner_id,new.country,new.activity) is distinct from (old.owner_id,old.country,old.activity) then raise exception 'Le titulaire, le pays et l’activité du dossier ne peuvent pas être réaffectés.';end if;
 select rule_version into expected_version from public.pro_verification_rules where country=new.country and activity=new.activity;
 if new.rule_version is distinct from expected_version then raise exception 'Le référentiel a évolué. Rechargez le formulaire.';end if;
 if not public.sokile_is_admin() then
  if new.owner_id<>auth.uid() then raise exception 'Dossier non autorisé.';end if;
  if tg_op='INSERT' and new.status<>'en_attente' then raise exception 'Seul Sokilé peut valider le dossier.';end if;
  new.status:='en_attente';new.response:=null;new.review_evidence:=null;new.review_checks:=null;new.verified_at:=null;new.verified_by:=null;new.valid_until:=null;
  new.submitted_at:=now();new.consent_at:=now();
 elsif tg_op='UPDATE' and (new.business_name,new.representative_name,new.registration_number,new.documents) is distinct from (old.business_name,old.representative_name,old.registration_number,old.documents) then
  raise exception 'Le professionnel doit lui-même modifier ses justificatifs.';
 end if;
 if new.status in('en_attente','verified') then earliest:=sokile_private.check_pro_documents(new.owner_id,new.country,new.activity,new.documents);end if;
 if new.status='verified' then
  if not public.sokile_is_admin() then raise exception 'Validation non autorisée.';end if;
  if coalesce(new.review_checks->>'identity','false')<>'true' or coalesce(new.review_checks->>'documents','false')<>'true' or coalesce(new.review_checks->>'regime','false')<>'true' or coalesce(length(trim(new.review_evidence)),0)<60 then raise exception 'Consignez les trois contrôles et leurs sources (60 caractères minimum).';end if;
  if new.valid_until is null or new.valid_until<=now() or new.valid_until>now()+interval '1 year' then raise exception 'La vérification doit expirer dans les douze prochains mois.';end if;
  if earliest is not null and new.valid_until>(earliest+1)::timestamptz then raise exception 'La vérification ne peut dépasser la première échéance de document : %.',earliest;end if;
  new.verified_at:=now();new.verified_by:=auth.uid();
 elsif new.status in('complement','suspended') then
  if coalesce(length(trim(new.response)),0)<30 then raise exception 'Expliquez les pièces attendues ou la suspension (30 caractères minimum).';end if;
  new.valid_until:=null;new.verified_at:=null;new.verified_by:=null;
 end if;
 new.updated_at:=now();return new;
end $$;
revoke all on function sokile_private.guard_pro_verification() from public;
create trigger guard_pro_verification before insert or update on public.pro_verifications for each row execute function sokile_private.guard_pro_verification();

create table if not exists sokile_private.pro_verification_audit(id bigint generated always as identity primary key,dossier_id uuid,owner_id uuid,actor_id uuid,country text,activity text,status text,rule_version text,evidence text,checks jsonb,valid_until timestamptz,changed_at timestamptz not null default now());
alter table sokile_private.pro_verification_audit enable row level security;
revoke all on sokile_private.pro_verification_audit from public,anon,authenticated;
-- Internal trigger only: records authenticated actors without granting audit writes to users.
create or replace function sokile_private.audit_pro_verification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentification requise.';end if;
 insert into sokile_private.pro_verification_audit(dossier_id,owner_id,actor_id,country,activity,status,rule_version,evidence,checks,valid_until) values(new.id,new.owner_id,auth.uid(),new.country,new.activity,new.status,new.rule_version,new.review_evidence,new.review_checks,new.valid_until);return new;
end $$;
revoke all on function sokile_private.audit_pro_verification() from public,anon,authenticated;
create trigger audit_pro_verification after insert or update on public.pro_verifications for each row execute function sokile_private.audit_pro_verification();

create or replace function public.sokile_review_verification(p_id uuid,p_status text,p_evidence text,p_response text,p_valid_until date,p_checks jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not public.sokile_is_admin() then raise exception 'Accès réservé à Sokilé.';end if;
 if p_status not in('verified','complement','suspended') then raise exception 'Décision invalide.';end if;
 if length(p_evidence)>5000 or length(p_response)>4000 then raise exception 'Texte trop long.';end if;
 update public.pro_verifications set status=p_status,review_evidence=trim(p_evidence),review_checks=p_checks,response=nullif(trim(p_response),''),valid_until=case when p_status='verified' then p_valid_until::timestamptz else null end where id=p_id;
 if not found then raise exception 'Dossier introuvable.';end if;
end $$;
revoke all on function public.sokile_review_verification(uuid,text,text,text,date,jsonb) from public,anon;
grant execute on function public.sokile_review_verification(uuid,text,text,text,date,jsonb) to authenticated;

create or replace function sokile_private.pro_verified(p_owner uuid,p_country text,p_activity text)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.pro_verifications v join public.pro_verification_rules r on r.country=v.country and r.activity=v.activity and r.rule_version=v.rule_version where v.owner_id=p_owner and v.country=p_country and v.activity=p_activity and v.status='verified' and v.valid_until>now());
$$;
revoke all on function sokile_private.pro_verified(uuid,text,text) from public;
grant execute on function sokile_private.pro_verified(uuid,text,text) to authenticated;
create or replace function sokile_private.pro_activity(p_specialty text)
returns text language sql immutable security invoker set search_path='' as $$
 select case p_specialty when 'Agence immobilière' then 'agence' when 'Courtier immobilier' then 'courtier' when 'Promoteur immobilier' then 'promoteur' when 'Géomètre' then 'geometre' when 'Notaire' then 'notaire' when 'Architecte' then 'architecte' when 'BTP / Construction' then 'btp' when 'Vérification terrain' then 'terrain' when 'Juridique' then 'juridique' when 'Financement' then 'financement' when 'Déménagement' then 'demenagement' else null end;
$$;
revoke all on function sokile_private.pro_activity(text) from public;
grant execute on function sokile_private.pro_activity(text) to anon,authenticated;
grant usage on schema sokile_private to anon;
alter table public.properties add column if not exists professional_activity text check(professional_activity in('agence','courtier','promoteur'));

create or replace function sokile_private.require_professional_verification() returns trigger language plpgsql security invoker set search_path='' as $$
declare c text;v_activity text;professional boolean;
begin
 if tg_table_name='properties' then
  professional:=coalesce(new.advertiser_type='pro',false) or nullif(trim(new.agency_name),'') is not null or new.professional_activity is not null;
  if professional then new.advertiser_type:='pro';new.professional_activity:=coalesce(new.professional_activity,'agence');end if;
  if new.status='validee' and professional and not exists(select 1 from public.pro_verifications v where v.owner_id=new.owner_id and v.country=new.country and v.activity=new.professional_activity and lower(trim(v.business_name))=lower(trim(new.agency_name))) then raise exception 'Le nom légal doit correspondre à la structure du dossier professionnel.';end if;
  if new.status='validee' and professional and not sokile_private.pro_verified(new.owner_id,new.country,new.professional_activity) then raise exception 'Validez d’abord le dossier professionnel pour ce pays et cette activité dans Vérifications pro.';end if;
 elsif tg_table_name='professionals' then
  if new.status='validee' then
   v_activity:=sokile_private.pro_activity(new.specialty);
   if v_activity is null or coalesce(cardinality(new.countries),0)=0 then raise exception 'Pays et activité professionnelle requis.';end if;
   foreach c in array new.countries loop
    if not exists(select 1 from public.pro_verifications v where v.owner_id=new.owner_id and v.country=c and v.activity=v_activity and lower(trim(v.business_name))=lower(trim(new.business_name))) then raise exception 'La fiche doit porter le nom légal de la structure vérifiée.';end if;
    if not sokile_private.pro_verified(new.owner_id,c,v_activity) then raise exception 'Dossier professionnel non validé ou expiré pour %.',c;end if;
   end loop;
  end if;
 elsif tg_table_name='development_programs' and new.status='validee' then
  v_activity:=case new.publisher_kind when 'agence' then 'agence' else 'promoteur' end;
  if new.publisher_kind<>'agence' and not exists(select 1 from public.pro_verifications v where v.owner_id=new.owner_id and v.country=new.country and v.activity=v_activity and lower(trim(v.business_name))=lower(trim(new.developer_name))) then raise exception 'Le promoteur doit correspondre au titulaire du dossier vérifié.';end if;
  if not sokile_private.pro_verified(new.owner_id,new.country,v_activity) then raise exception 'Dossier professionnel non validé ou expiré pour ce programme.';end if;
 end if;
 return new;
end $$;
revoke all on function sokile_private.require_professional_verification() from public;
create trigger zzzz_professional_verification before insert or update on public.properties for each row execute function sokile_private.require_professional_verification();
create trigger zzzz_professional_verification before insert or update on public.professionals for each row execute function sokile_private.require_professional_verification();
create trigger zzzz_professional_verification before insert or update on public.development_programs for each row execute function sokile_private.require_professional_verification();

-- Preserve exact public projections; private relations are filtered by the view owner.
-- Explicit owner privileges are needed because anonymous clients must never read dossiers.
do $$ declare definition text;begin
 definition:=rtrim(pg_get_viewdef('public.public_properties'::regclass,true),';'||chr(10));
 execute 'create or replace view public.public_properties with (security_barrier=true) as select original.*, (coalesce(source.advertiser_type=''pro'',false) or nullif(trim(source.agency_name),'''') is not null or source.professional_activity is not null) as professional_verified from ('||definition||') original join public.properties source on source.id=original.id where (not (coalesce(source.advertiser_type=''pro'',false) or nullif(trim(source.agency_name),'''') is not null or source.professional_activity is not null) or exists(select 1 from public.pro_verifications pv join public.pro_verification_rules pr on pr.country=pv.country and pr.activity=pv.activity and pr.rule_version=pv.rule_version where pv.owner_id=source.owner_id and pv.country=source.country and pv.activity=coalesce(source.professional_activity,''agence'') and pv.status=''verified'' and pv.valid_until>now() and lower(trim(pv.business_name))=lower(trim(source.agency_name))))';
 definition:=rtrim(pg_get_viewdef('public.public_professionals'::regclass,true),';'||chr(10));
 execute 'create or replace view public.public_professionals with (security_barrier=true) as select original.*, true as professional_verified from ('||definition||') original join public.professionals source on source.id=original.id where cardinality(source.countries)>0 and not exists(select 1 from unnest(source.countries) c where not exists(select 1 from public.pro_verifications pv join public.pro_verification_rules pr on pr.country=pv.country and pr.activity=pv.activity and pr.rule_version=pv.rule_version where pv.owner_id=source.owner_id and pv.country=c and pv.activity=sokile_private.pro_activity(source.specialty) and pv.status=''verified'' and pv.valid_until>now() and lower(trim(pv.business_name))=lower(trim(source.business_name))))';
 definition:=rtrim(pg_get_viewdef('public.public_programs'::regclass,true),';'||chr(10));
 execute 'create or replace view public.public_programs with (security_barrier=true) as select original.*, true as professional_verified from ('||definition||') original join public.development_programs source on source.id=original.id where exists(select 1 from public.pro_verifications pv join public.pro_verification_rules pr on pr.country=pv.country and pr.activity=pv.activity and pr.rule_version=pv.rule_version where pv.owner_id=source.owner_id and pv.country=source.country and pv.activity=case source.publisher_kind when ''agence'' then ''agence'' else ''promoteur'' end and pv.status=''verified'' and pv.valid_until>now() and (source.publisher_kind=''agence'' or lower(trim(pv.business_name))=lower(trim(source.developer_name))))';
end $$;
notify pgrst,'reload schema';
commit;

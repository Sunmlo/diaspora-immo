-- Agency identity exists before its owner creates a login. No verification badge is inferred.
create table public.assisted_agencies (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 business_name text not null check(length(trim(business_name)) between 2 and 160),
 country text not null,
 phone text, website text, description text,
 owner_id uuid references auth.users(id) on delete set null,
 publication_enabled boolean not null default false,
 consent_at timestamptz, consent_note text,
 claim_email text, claim_evidence text, claimed_at timestamptz,
 created_at timestamptz not null default now(),
 constraint assisted_consent_required check(not publication_enabled or (consent_at is not null and length(trim(coalesce(consent_note,'')))>=30))
);
alter table public.assisted_agencies enable row level security;
revoke all on public.assisted_agencies from anon,authenticated;
grant select,insert,update,delete on public.assisted_agencies to authenticated,service_role;
create policy assisted_agencies_admin on public.assisted_agencies to authenticated using(auth.uid() is not null and public.sokile_is_admin()) with check(auth.uid() is not null and public.sokile_is_admin());
create policy assisted_agencies_owner_read on public.assisted_agencies for select to authenticated using(owner_id=(select auth.uid()));
create index assisted_agencies_owner_idx on public.assisted_agencies(owner_id) where owner_id is not null;
alter table public.properties add column assisted_agency_id uuid references public.assisted_agencies(id);
create index properties_assisted_agency_idx on public.properties(assisted_agency_id) where assisted_agency_id is not null;
create unique index properties_assisted_import_reference on public.properties(assisted_agency_id,(details->>'import_reference')) where assisted_agency_id is not null and details->>'import_reference' is not null;

create function sokile_private.guard_assisted_property() returns trigger language plpgsql security invoker set search_path='' as $$
declare a public.assisted_agencies%rowtype;
begin
 if auth.role()='authenticated' and not public.sokile_is_admin() then
  if tg_op='INSERT' and new.assisted_agency_id is not null then raise exception 'Import accompagné réservé à Sokilé.';end if;
  if tg_op='UPDATE' and new.assisted_agency_id is distinct from old.assisted_agency_id then raise exception 'Rattachement réservé à Sokilé.';end if;
 end if;
 if new.assisted_agency_id is not null then
  select * into a from public.assisted_agencies where id=new.assisted_agency_id;
  if not found or new.owner_id is distinct from a.owner_id or new.country is distinct from a.country or lower(trim(new.agency_name)) is distinct from lower(trim(a.business_name)) or new.advertiser_type is distinct from 'pro' or coalesce(new.professional_activity,'agence')<>'agence' then
   raise exception 'Le bien doit correspondre à son agence accompagnée et à son titulaire.';
  end if;
  if new.status='validee' and not a.publication_enabled then raise exception 'Publication accompagnée non autorisée pour cette agence.';end if;
 end if;
 return new;
end $$;
create trigger zzzz_assisted_agency before insert or update on public.properties for each row execute function sokile_private.guard_assisted_property();

-- Preserve every existing professional-check branch; add only the authorized agency exception.
do $$declare definition text;needle text:='if new.status=''validee'' and professional and not exists';begin
 definition:=pg_get_functiondef('sokile_private.require_professional_verification()'::regprocedure);
 if position(needle in definition)=0 then raise exception 'Unexpected professional guard definition';end if;
 definition:=replace(definition,needle,
 'if new.status=''validee'' and professional and new.assisted_agency_id is not null and exists(select 1 from public.assisted_agencies a where a.id=new.assisted_agency_id and a.publication_enabled and a.owner_id is not distinct from new.owner_id and a.country=new.country and lower(trim(a.business_name))=lower(trim(new.agency_name))) then return new;end if; '||needle);
 execute definition;
end$$;

create or replace view public.public_properties with(security_barrier=true) as
select p.id,p.title,p.type,p.transaction,p.nature,p.details,p.country,p.city,p.neighborhood,p.description,p.price_eur,p.price,p.surface,p.rooms,p.bathrooms,p.tags,p.advertiser_type,p.agency_name,p.agent_name,p.photos,p.user_phone,p.user_name,p.created_at,p.verified,p.publication_started_at,p.expires_at,
 exists(select 1 from public.pro_verifications pv join public.pro_verification_rules pr on pr.country=pv.country and pr.activity=pv.activity and pr.rule_version=pv.rule_version where pv.owner_id=p.owner_id and pv.country=p.country and pv.activity=coalesce(p.professional_activity,'agence') and pv.status='verified' and pv.valid_until>now() and lower(trim(pv.business_name))=lower(trim(p.agency_name))) as professional_verified,
 p.video_path,a.slug as agency_slug
from public.properties p left join public.assisted_agencies a on a.id=p.assisted_agency_id
where p.status='validee' and p.active=true and p.expires_at>now()
and (
 (p.advertiser_type='pro' and (
  exists(select 1 from public.pro_verifications pv join public.pro_verification_rules pr on pr.country=pv.country and pr.activity=pv.activity and pr.rule_version=pv.rule_version where pv.owner_id=p.owner_id and pv.country=p.country and pv.activity=coalesce(p.professional_activity,'agence') and pv.status='verified' and pv.valid_until>now() and lower(trim(pv.business_name))=lower(trim(p.agency_name)))
  or (a.publication_enabled and a.owner_id is not distinct from p.owner_id and a.country=p.country and lower(trim(a.business_name))=lower(trim(p.agency_name)))
 ))
 or (coalesce(p.advertiser_type,'particulier')<>'pro' and nullif(trim(p.agency_name),'') is null and p.professional_activity is null and exists(select 1 from public.individual_verifications iv where iv.property_id=p.id and iv.owner_id=p.owner_id and iv.revision=p.evidence_revision and iv.status='verified' and iv.valid_until>now()))
);
grant select on public.public_properties to anon,authenticated;
create view public.public_assisted_agencies with(security_barrier=true) as select slug,business_name,country,phone,website,description from public.assisted_agencies where publication_enabled;
grant select on public.public_assisted_agencies to anon,authenticated;

-- Only a signed-in administrator can link a confirmed email after checking the agency's request.
create function sokile_private.assign_assisted_agency(p_agency_id uuid,p_email text,p_evidence text) returns integer
language plpgsql security definer set search_path='' as $$
declare a public.assisted_agencies%rowtype;target uuid;total integer;
begin
 if auth.uid() is null or not coalesce(public.sokile_is_admin(),false) then raise exception 'Rattachement réservé à Sokilé.';end if;
 if length(trim(coalesce(p_evidence,'')))<30 then raise exception 'Consignez la confirmation de l’agence (30 caractères minimum).';end if;
 select * into a from public.assisted_agencies where id=p_agency_id for update;
 if not found then raise exception 'Agence introuvable.';end if;
 select id into target from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null and deleted_at is null;
 if target is null then raise exception 'Compte introuvable ou adresse e-mail non confirmée.';end if;
 if a.owner_id is not null and a.owner_id<>target then raise exception 'Cette agence possède déjà un titulaire.';end if;
 if exists(select 1 from public.properties where assisted_agency_id=a.id and video_path is not null and owner_id is distinct from target) then raise exception 'Les vidéos doivent être transférées avant ce rattachement.';end if;
 update public.assisted_agencies set owner_id=target,claim_email=lower(trim(p_email)),claim_evidence=trim(p_evidence),claimed_at=coalesce(claimed_at,now()) where id=a.id;
 update public.properties set owner_id=target,user_email=lower(trim(p_email)) where assisted_agency_id=a.id and owner_id is distinct from target;
 select count(*)::integer into total from public.properties where assisted_agency_id=a.id;
 return total;
end$$;
revoke all on function sokile_private.assign_assisted_agency(uuid,text,text) from public,anon;
grant execute on function sokile_private.assign_assisted_agency(uuid,text,text) to authenticated;
create function public.assign_assisted_agency(p_agency_id uuid,p_email text,p_evidence text) returns integer language sql security invoker set search_path='' as $$select sokile_private.assign_assisted_agency(p_agency_id,p_email,p_evidence)$$;
revoke all on function public.assign_assisted_agency(uuid,text,text) from public,anon;
grant execute on function public.assign_assisted_agency(uuid,text,text) to authenticated;

notify pgrst,'reload schema';

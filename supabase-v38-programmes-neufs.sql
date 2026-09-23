-- Programmes neufs : données privées, projections publiques et écritures contrôlées.
begin;
set local lock_timeout='5s';
create table if not exists public.development_programs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 title text not null, developer_name text not null, publisher_kind text not null default 'promoteur' check(publisher_kind in('promoteur','agence')),
 country text not null,city text not null,neighborhood text not null default '',description text not null,
 stage text not null check(stage in('sur_plan','construction','livre')),
 delivery_quarter integer check(delivery_quarter between 1 and 4),delivery_year integer check(delivery_year between 2020 and 2100),
 amenities text[] not null default '{}',gallery jsonb not null default '[]',brochure_url text not null default '',website text not null default '',
 phone text not null default '',email text not null,verification_reference text not null default '',
 status text not null default 'en_attente' check(status in('en_attente','validee','refusee','modifications_demandees','archive')),
 moderation_note text,publication_started_at timestamptz,expires_at timestamptz,
 inventory_updated_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.program_units (
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.development_programs(id),
 reference text not null,nature text not null check(nature in('appartement','maison')),rooms integer not null check(rooms between 1 and 30),
 surface numeric not null check(surface>0 and surface<=100000),price_fcfa numeric check(price_fcfa>0 and price_fcfa<=1e13),
 floor text not null default '',outdoor text not null default '',plan_url text not null default '',
 availability text not null default 'disponible' check(availability in('disponible','reserve','vendu')),
 active boolean not null default true,updated_at timestamptz not null default now()
);
create unique index if not exists program_unit_reference on public.program_units(program_id,lower(reference)) where active;
create index if not exists development_owner on public.development_programs(owner_id);
create index if not exists program_unit_parent on public.program_units(program_id);
create table if not exists public.program_inquiries (
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.development_programs(id),unit_id uuid references public.program_units(id),
 contact_name text not null,email text not null,phone text not null default '',message text not null,
 title text not null,recipient_email text not null,status text not null default 'nouvelle' check(status in('nouvelle','traitee')),
 consent_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create index if not exists program_inquiry_parent on public.program_inquiries(program_id,created_at desc);
create index if not exists program_inquiry_email on public.program_inquiries(email,created_at desc);
alter table public.development_programs enable row level security;
alter table public.program_units enable row level security;
alter table public.program_inquiries enable row level security;
revoke all on public.development_programs,public.program_units,public.program_inquiries from public,anon,authenticated;
grant select on public.development_programs,public.program_units,public.program_inquiries to authenticated;
grant all on public.development_programs,public.program_units,public.program_inquiries to service_role;
drop policy if exists program_owner_read on public.development_programs;
create policy program_owner_read on public.development_programs for select to authenticated using(owner_id=auth.uid() or public.sokile_is_admin());
drop policy if exists unit_owner_read on public.program_units;
create policy unit_owner_read on public.program_units for select to authenticated using(exists(select 1 from public.development_programs p where p.id=program_id and (p.owner_id=auth.uid() or public.sokile_is_admin())));
drop policy if exists inquiry_owner_read on public.program_inquiries;
create policy inquiry_owner_read on public.program_inquiries for select to authenticated using(exists(select 1 from public.development_programs p where p.id=program_id and (p.owner_id=auth.uid() or public.sokile_is_admin())));

create or replace function public.sokile_program_https(url text) returns boolean language sql immutable set search_path=public as $$
 select coalesce(url,'')='' or (length(url)<=2000 and url ~ '^https://[a-zA-Z0-9][a-zA-Z0-9.-]+(:[0-9]+)?([/?#][^[:space:]]*)?$')
$$;
revoke all on function public.sokile_program_https(text) from public;

create or replace view public.public_programs as
select p.id,p.title,p.developer_name,p.publisher_kind,p.country,p.city,p.neighborhood,p.description,p.stage,p.delivery_quarter,p.delivery_year,
 p.amenities,p.gallery,p.brochure_url,p.website,p.phone,p.inventory_updated_at,p.publication_started_at,p.expires_at,
 (select min(price_fcfa) from public.program_units u where u.program_id=p.id and u.active and u.availability='disponible') as price_from_fcfa,
 (select count(*) from public.program_units u where u.program_id=p.id and u.active and u.availability='disponible') as available_count,
 (select min(rooms) from public.program_units u where u.program_id=p.id and u.active and u.availability<>'vendu') as rooms_min,
 (select max(rooms) from public.program_units u where u.program_id=p.id and u.active and u.availability<>'vendu') as rooms_max
from public.development_programs p where p.status='validee' and p.expires_at>now()
and exists(select 1 from public.program_units u where u.program_id=p.id and u.active and u.availability<>'vendu');
create or replace view public.public_program_units as
select u.id,u.program_id,u.reference,u.nature,u.rooms,u.surface,u.price_fcfa,u.floor,u.outdoor,u.plan_url,u.availability
from public.program_units u join public.public_programs p on p.id=u.program_id where u.active;
revoke all on public.public_programs,public.public_program_units from public;
grant select on public.public_programs,public.public_program_units to anon,authenticated;

create or replace function public.sokile_search_programs(p_country text default '',p_search text default '',p_stage text default '',p_rooms integer default null,p_budget numeric default null,p_offset integer default 0)
returns setof public.public_programs language sql stable security definer set search_path=public as $$
 select p.* from public.public_programs p where (coalesce(p_country,'')='' or p.country=p_country)
 and (coalesce(p_stage,'')='' or p.stage=p_stage)
 and (coalesce(p_search,'')='' or strpos(public.sokile_search_text(p.title||' '||p.city||' '||p.neighborhood),public.sokile_search_text(left(p_search,100)))>0)
 and ((p_rooms is null and p_budget is null) or exists(select 1 from public.program_units u where u.program_id=p.id and u.active and u.availability='disponible' and (p_rooms is null or u.rooms=p_rooms) and (p_budget is null or u.price_fcfa<=p_budget)))
 order by p.publication_started_at desc,p.id limit 13 offset greatest(0,least(coalesce(p_offset,0),100000));
$$;
revoke all on function public.sokile_search_programs(text,text,text,integer,numeric,integer) from public;
grant execute on function public.sokile_search_programs(text,text,text,integer,numeric,integer) to anon,authenticated;

create or replace function public.sokile_save_program(p_id uuid,p_program jsonb,p_units jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid:=coalesce(p_id,gen_random_uuid()); v_owner uuid; v_email text; u jsonb; item jsonb; uid uuid; seen uuid[]:='{}';
begin
 if auth.uid() is null then raise exception 'Connectez-vous pour déposer un programme.';end if;
 select email into v_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if v_email is null then raise exception 'Confirmez votre adresse email avant de déposer un programme.';end if;
 if p_id is not null then
   select owner_id into v_owner from public.development_programs where id=p_id for update;
   if not found or (v_owner<>auth.uid() and not public.sokile_is_admin()) then raise exception 'Programme inaccessible.';end if;
   select email into v_email from auth.users where id=v_owner and email_confirmed_at is not null;
 else v_owner:=auth.uid();end if;
 if jsonb_typeof(p_program)<>'object' or jsonb_typeof(p_units)<>'array' then raise exception 'Dossier incomplet.';end if;
 if char_length(trim(coalesce(p_program->>'title',''))) not between 4 and 160 or char_length(trim(coalesce(p_program->>'developer_name',''))) not between 2 and 160
 or char_length(trim(coalesce(p_program->>'city',''))) not between 2 and 100 or char_length(trim(coalesce(p_program->>'description',''))) not between 80 and 10000 then raise exception 'Renseignez le nom, le promoteur, la ville et une description de 80 à 10 000 caractères.';end if;
 if not coalesce(p_program->>'country','')=any(array['Bénin','Burkina Faso','Côte d''Ivoire','Mali','Niger','Sénégal','Togo','Cameroun','Centrafrique','Congo','Gabon','Tchad']) then raise exception 'Choisissez un pays couvert par Sokilé.';end if;
 if coalesce(p_program->>'stage','') not in('sur_plan','construction','livre') or coalesce(p_program->>'publisher_kind','') not in('promoteur','agence') then raise exception 'Précisez le stade du projet et votre qualité professionnelle.';end if;
 if p_program->>'stage'<>'livre' and (nullif(p_program->>'delivery_quarter','') is null or nullif(p_program->>'delivery_year','') is null) then raise exception 'Précisez la livraison prévisionnelle.';end if;
 if jsonb_typeof(coalesce(p_program->'gallery','[]'))<>'array' or jsonb_array_length(coalesce(p_program->'gallery','[]'))>10 then raise exception 'Ajoutez au maximum 10 visuels.';end if;
 for item in select value from jsonb_array_elements(coalesce(p_program->'gallery','[]')) loop
   if not public.sokile_program_https(item->>'url') or coalesce(item->>'url','')='' or coalesce(item->>'kind','') not in('photo','perspective','chantier') or length(coalesce(item->>'caption',''))>200 then raise exception 'Visuel invalide : utilisez une adresse HTTPS et précisez sa nature.';end if;
 end loop;
 if not public.sokile_program_https(p_program->>'brochure_url') or not public.sokile_program_https(p_program->>'website') then raise exception 'Les documents et sites doivent utiliser une adresse HTTPS.';end if;
 if char_length(coalesce(p_program->>'phone','')) not between 6 and 40 or char_length(coalesce(p_program->>'neighborhood',''))>200 or char_length(coalesce(p_program->>'verification_reference',''))>2000 then raise exception 'Vérifiez le téléphone et les informations du dossier.';end if;
 if jsonb_array_length(p_units) not between 1 and 100 then raise exception 'Ajoutez entre 1 et 100 logements.';end if;
 if jsonb_typeof(coalesce(p_program->'amenities','[]'))<>'array' or jsonb_array_length(coalesce(p_program->'amenities','[]'))>30 then raise exception 'Équipements invalides.';end if;
 insert into public.development_programs(id,owner_id,title,developer_name,publisher_kind,country,city,neighborhood,description,stage,delivery_quarter,delivery_year,amenities,gallery,brochure_url,website,phone,email,verification_reference)
 values(v_id,v_owner,trim(p_program->>'title'),trim(p_program->>'developer_name'),p_program->>'publisher_kind',p_program->>'country',trim(p_program->>'city'),coalesce(p_program->>'neighborhood',''),trim(p_program->>'description'),p_program->>'stage',nullif(p_program->>'delivery_quarter','')::integer,nullif(p_program->>'delivery_year','')::integer,array(select jsonb_array_elements_text(coalesce(p_program->'amenities','[]'))),coalesce(p_program->'gallery','[]'),coalesce(p_program->>'brochure_url',''),coalesce(p_program->>'website',''),p_program->>'phone',v_email,coalesce(p_program->>'verification_reference',''))
 on conflict(id) do update set title=excluded.title,developer_name=excluded.developer_name,publisher_kind=excluded.publisher_kind,country=excluded.country,city=excluded.city,neighborhood=excluded.neighborhood,description=excluded.description,stage=excluded.stage,delivery_quarter=excluded.delivery_quarter,delivery_year=excluded.delivery_year,amenities=excluded.amenities,gallery=excluded.gallery,brochure_url=excluded.brochure_url,website=excluded.website,phone=excluded.phone,email=excluded.email,verification_reference=excluded.verification_reference,status='en_attente',moderation_note=null,inventory_updated_at=now(),updated_at=now();
 -- Masquage provisoire dans cette transaction : références échangeables, ids conservés.
 update public.program_units set active=false where program_id=v_id;
 for u in select value from jsonb_array_elements(p_units) loop
   uid:=coalesce(nullif(u->>'id','')::uuid,gen_random_uuid());
   if uid=any(seen) or exists(select 1 from public.program_units where id=uid and program_id<>v_id) then raise exception 'Identifiant de logement invalide.';end if;
   seen:=array_append(seen,uid);
   if char_length(trim(coalesce(u->>'reference',''))) not between 1 and 50 or char_length(coalesce(u->>'floor',''))>50 or char_length(coalesce(u->>'outdoor',''))>150 or not public.sokile_program_https(u->>'plan_url') then raise exception 'Vérifiez la référence et le plan du logement.';end if;
   insert into public.program_units(id,program_id,reference,nature,rooms,surface,price_fcfa,floor,outdoor,plan_url,availability,active)
   values(uid,v_id,trim(u->>'reference'),u->>'nature',(u->>'rooms')::integer,(u->>'surface')::numeric,nullif(u->>'price_fcfa','')::numeric,coalesce(u->>'floor',''),coalesce(u->>'outdoor',''),coalesce(u->>'plan_url',''),coalesce(u->>'availability','disponible'),true)
   on conflict(id) do update set reference=excluded.reference,nature=excluded.nature,rooms=excluded.rooms,surface=excluded.surface,price_fcfa=excluded.price_fcfa,floor=excluded.floor,outdoor=excluded.outdoor,plan_url=excluded.plan_url,availability=excluded.availability,active=true,updated_at=now();
 end loop;
 return v_id;
end $$;
revoke all on function public.sokile_save_program(uuid,jsonb,jsonb) from public;
grant execute on function public.sokile_save_program(uuid,jsonb,jsonb) to authenticated;

create or replace function public.sokile_moderate_program(p_id uuid,p_status text,p_response text default '') returns boolean
language plpgsql security definer set search_path=public as $$
declare p public.development_programs;
begin
 if auth.uid() is null or not public.sokile_is_admin() then raise exception 'Accès réservé à la gestion.';end if;
 if p_status not in('validee','refusee','modifications_demandees','archive') then raise exception 'Décision invalide.';end if;
 select * into p from public.development_programs where id=p_id for update;
 if not found then raise exception 'Programme introuvable.';end if;
 if p_status in('refusee','modifications_demandees') and char_length(trim(coalesce(p_response,''))) not between 30 and 4000 then raise exception 'Une réponse personnalisée de 30 à 4000 caractères est obligatoire.';end if;
 if p_status='validee' then
   if jsonb_array_length(p.gallery)=0 then raise exception 'Ajoutez au moins une photo ou perspective avant la publication.';end if;
   if not exists(select 1 from public.program_units where program_id=p_id and active and availability<>'vendu') then raise exception 'Aucun logement commercialisable.';end if;
 end if;
 update public.development_programs set status=p_status,moderation_note=case when p_status in('refusee','modifications_demandees') then trim(p_response) else null end,
 publication_started_at=case when p_status='validee' and (p.status<>'validee' or p.expires_at<=now()) then now() else p.publication_started_at end,
 expires_at=case when p_status='validee' and (p.status<>'validee' or p.expires_at<=now()) then now()+interval '1 year' else p.expires_at end,updated_at=now() where id=p_id;
 return true;
end $$;
revoke all on function public.sokile_moderate_program(uuid,text,text) from public;
grant execute on function public.sokile_moderate_program(uuid,text,text) to authenticated;

create or replace function public.sokile_program_inventory(p_id uuid,p_units jsonb,p_archive boolean default false) returns boolean
language plpgsql security definer set search_path=public as $$
declare p public.development_programs; u jsonb; seen uuid[]:='{}';v_unit uuid;
begin
 select * into p from public.development_programs where id=p_id for update;
 if auth.uid() is null or not found or (p.owner_id<>auth.uid() and not public.sokile_is_admin()) then raise exception 'Programme inaccessible.';end if;
 if jsonb_typeof(p_units)<>'array' or jsonb_array_length(p_units)>100 then raise exception 'Disponibilités invalides.';end if;
 for u in select value from jsonb_array_elements(p_units) loop
   v_unit:=(u->>'id')::uuid;
   if v_unit=any(seen) or coalesce(u->>'availability','') not in('disponible','reserve','vendu') then raise exception 'Disponibilité invalide.';end if;
   seen:=array_append(seen,v_unit);
   update public.program_units set availability=u->>'availability',updated_at=now() where id=v_unit and program_id=p_id and active;
   if not found then raise exception 'Logement inaccessible.';end if;
 end loop;
 update public.development_programs set inventory_updated_at=now(),updated_at=now(),status=case when p_archive then 'archive' else status end where id=p_id;
 return true;
end $$;
revoke all on function public.sokile_program_inventory(uuid,jsonb,boolean) from public;
grant execute on function public.sokile_program_inventory(uuid,jsonb,boolean) to authenticated;

create or replace function public.sokile_program_inquiry(p_program_id uuid,p_unit_id uuid,p_name text,p_email text,p_phone text,p_message text,p_consent boolean,p_honeypot text default '') returns uuid
language plpgsql security definer set search_path=public as $$
declare p public.development_programs;u public.program_units;v_id uuid;v_email text:=lower(trim(p_email));
begin
 if coalesce(p_honeypot,'')<>'' then raise exception 'Demande non enregistrée.';end if;
 if p_consent is not true then raise exception 'Autorisez la transmission de votre demande au promoteur.';end if;
 if char_length(trim(coalesce(p_name,''))) not between 2 and 100 or char_length(trim(coalesce(p_message,''))) not between 10 and 3000 or char_length(coalesce(p_phone,''))>40 or length(coalesce(v_email,''))>254 or coalesce(v_email,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Vérifiez votre nom, votre email et votre message.';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_email,38));
 if (select count(*) from public.program_inquiries where email=v_email and created_at>now()-interval '1 day')>=10 or exists(select 1 from public.program_inquiries where email=v_email and program_id=p_program_id and created_at>now()-interval '10 minutes') then raise exception 'Votre demande a déjà été enregistrée récemment. Patientez avant de renouveler l’envoi.';end if;
 select * into p from public.development_programs where id=p_program_id and status='validee' and expires_at>now() for share;
 if not found or not exists(select 1 from public.program_units where program_id=p.id and active and availability='disponible') then raise exception 'Ce programme n’est plus disponible.';end if;
 if p_unit_id is not null then
   select * into u from public.program_units where id=p_unit_id and program_id=p.id and active and availability='disponible' for share;
   if not found then raise exception 'Ce logement n’est plus disponible.';end if;
 end if;
 insert into public.program_inquiries(program_id,unit_id,contact_name,email,phone,message,title,recipient_email)
 values(p.id,p_unit_id,trim(p_name),v_email,coalesce(p_phone,''),trim(p_message),p.title||case when p_unit_id is not null then ' · '||u.reference else '' end,p.email) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.sokile_program_inquiry(uuid,uuid,text,text,text,text,boolean,text) from public;
grant execute on function public.sokile_program_inquiry(uuid,uuid,text,text,text,text,boolean,text) to anon,authenticated;

create or replace function public.sokile_program_inquiry_done(p_id uuid) returns boolean
language plpgsql security definer set search_path=public as $$ begin
 if auth.uid() is null then raise exception 'Connectez-vous.';end if;
 update public.program_inquiries i set status='traitee' from public.development_programs p where i.id=p_id and p.id=i.program_id and (p.owner_id=auth.uid() or public.sokile_is_admin());
 if not found then raise exception 'Demande inaccessible.';end if;return true;
end $$;
revoke all on function public.sokile_program_inquiry_done(uuid) from public;
grant execute on function public.sokile_program_inquiry_done(uuid) to authenticated;
notify pgrst,'reload schema';
commit;

begin;
create schema if not exists sokile_private;
revoke all on schema sokile_private from public, anon, authenticated;
create table if not exists sokile_private.retention_media (
 url text primary key, object_path text not null,
 queued_at timestamptz not null default now(), attempts integer not null default 0,
 deleted_at timestamptz, last_error text
);
create table if not exists sokile_private.retention_runs (
 id bigint generated always as identity primary key, ran_at timestamptz not null default now(),
 properties_deleted integer not null, alerts_deleted integer not null
);
create table if not exists sokile_private.retention_holds (
 property_id bigint primary key references public.properties(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table sokile_private.retention_media enable row level security;
alter table sokile_private.retention_runs enable row level security;
alter table sokile_private.retention_holds enable row level security;
revoke all on all tables in schema sokile_private from public,anon,authenticated;

-- Service-only maintenance; never expose contact data or accept caller-supplied cutoffs.
create or replace function public.sokile_retention_run(p_dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.properties%rowtype; u text; n integer:=0; a integer:=0;
  prefix constant text:='https://nhyejaubfxjmmuvetayw.supabase.co/storage/v1/object/public/photos-verified/';
begin
 if not pg_try_advisory_xact_lock(72429001) then return jsonb_build_object('busy',true); end if;
 for p in select x.* from public.properties x
 where x.status='validee' and x.expires_at < now()-interval '12 months'
 and x.id not in (34,35)
 and concat_ws(' ',x.title,x.description,x.details::text) !~* '(QA-|ne pas publier|ficti|test)'
 and not exists(select 1 from public.reports r where r.property_id=x.id)
 and not exists(select 1 from public.leads l where l.property_id=x.id)
 and not exists(select 1 from sokile_private.retention_holds h where h.property_id=x.id)
 order by x.id limit 50 for update skip locked
 loop
   n:=n+1;
   if not p_dry_run then
     -- Only known uploads in the owner's namespace, never remote URLs or arbitrary paths.
     foreach u in array coalesce(p.photos,array[]::text[]) loop
       if p.owner_id is not null and u ~ ('^'||replace(prefix,'.','\.')||'annonces/'||p.owner_id::text||'/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$') then
         insert into sokile_private.retention_media(url,object_path) values(u,substr(u,length(prefix)+1)) on conflict(url) do nothing;
       end if;
     end loop;
     delete from public.saved_properties where property_id=p.id;
     delete from public.properties where id=p.id;
   end if;
 end loop;
 if p_dry_run then
   select count(*) into a from (select id from public.search_alerts where least(cancelled_at,expires_at)<now()-interval '30 days' limit 500) s;
 else
   with gone as (delete from public.search_alerts where id in (
     select id from public.search_alerts where least(cancelled_at,expires_at)<now()-interval '30 days' order by id limit 500 for update skip locked
   ) returning id) select count(*) into a from gone;
   insert into sokile_private.retention_runs(properties_deleted,alerts_deleted) values(n,a);
   delete from sokile_private.retention_runs where ran_at<now()-interval '90 days';
   delete from sokile_private.retention_media where deleted_at<now()-interval '30 days';
 end if;
 return jsonb_build_object('dry_run',p_dry_run,'properties',n,'alerts',a);
end $$;

-- Check all application rows for shared images, including JSON fields and arrays.
create or replace function sokile_private.media_referenced(p_url text)
returns boolean language plpgsql security definer set search_path='' as $$
declare t record; found boolean;
begin
 for t in select tablename from pg_catalog.pg_tables where schemaname='public' loop
   execute format('select exists(select 1 from public.%I r where strpos(to_jsonb(r)::text,$1)>0)',t.tablename) into found using p_url;
   if found then return true; end if;
 end loop;
 return false;
end $$;

create or replace function public.sokile_retention_media_pending()
returns table(url text,object_path text) language sql security definer set search_path='' as $$
 select m.url,m.object_path from sokile_private.retention_media m
 where m.deleted_at is null and m.queued_at<now()-interval '1 day'
 and not sokile_private.media_referenced(m.url)
 order by m.queued_at limit 50;
$$;
create or replace function public.sokile_retention_media_check(p_url text)
returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from sokile_private.retention_media m where m.url=p_url and m.deleted_at is null and m.queued_at<now()-interval '1 day')
 and not sokile_private.media_referenced(p_url);
$$;
create or replace function public.sokile_retention_media_done(p_url text,p_success boolean)
returns void language sql security definer set search_path='' as $$
 update sokile_private.retention_media set attempts=attempts+1,
 deleted_at=case when p_success then now() else null end,
 last_error=case when p_success then null else 'Storage deletion failed; retry next run' end
 where url=p_url and deleted_at is null;
$$;

-- Prevent a purged image being attached again while the storage worker deletes it.
create or replace function sokile_private.guard_retired_media()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from sokile_private.retention_media m where strpos(to_jsonb(new)::text,m.url)>0
 and (tg_op='INSERT' or strpos(to_jsonb(old)::text,m.url)=0)) then
   raise exception 'Cette photo appartient à une annonce supprimée. Veuillez la charger à nouveau.';
 end if;
 return new;
end $$;
create trigger sokile_guard_retired_media before insert or update of photos on public.properties
for each row execute function sokile_private.guard_retired_media();
revoke all on function sokile_private.media_referenced(text),sokile_private.guard_retired_media() from public,anon,authenticated;
revoke all on function public.sokile_retention_run(boolean),public.sokile_retention_media_pending(),public.sokile_retention_media_check(text),public.sokile_retention_media_done(text,boolean) from public,anon,authenticated;
grant execute on function public.sokile_retention_run(boolean),public.sokile_retention_media_pending(),public.sokile_retention_media_check(text),public.sokile_retention_media_done(text,boolean) to service_role;
commit;

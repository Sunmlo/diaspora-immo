begin;
alter table public.properties add column if not exists video_path text;
alter table public.properties add column if not exists video_reviewed_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-videos','listing-videos',false,52428800,array['video/mp4','video/quicktime','video/webm'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Preserve the existing curated public projection and all verification filters.
-- It intentionally runs as the view owner: anonymous users cannot read the
-- underlying properties table, which also contains private contact details.
do $$declare definition text;begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='public_properties' and column_name='video_path') then
  definition:=rtrim(pg_get_viewdef('public.public_properties'::regclass,true),';'||chr(10));
  execute 'create or replace view public.public_properties with (security_barrier=true) as select original.*,source.video_path from ('||definition||') original join public.properties source on source.id=original.id';
 end if;
end$$;

create policy listing_video_insert on storage.objects for insert to authenticated
with check(bucket_id='listing-videos' and (storage.foldername(name))[1]=(select auth.uid())::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](mp4|mov|webm)$');
create policy listing_video_owner_read on storage.objects for select to authenticated
using(bucket_id='listing-videos' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.sokile_is_admin()));
create policy listing_video_public_read on storage.objects for select to anon,authenticated
using(bucket_id='listing-videos' and exists(select 1 from public.public_properties p where p.video_path=name));
-- Uploaded objects are immutable, so a previously checked video cannot be
-- overwritten behind a published announcement. A replacement gets a new path.
create policy listing_video_no_update on storage.objects as restrictive for update to public
using(bucket_id<>'listing-videos') with check(bucket_id<>'listing-videos');
create policy listing_video_delete_unused on storage.objects for delete to authenticated
using(bucket_id='listing-videos' and (storage.foldername(name))[1]=(select auth.uid())::text
 and not exists(select 1 from public.properties p where p.video_path=name));

create or replace function sokile_private.guard_listing_video() returns trigger
language plpgsql security invoker set search_path='' as $$
declare changed boolean;begin
 changed:=tg_op='INSERT';
 if tg_op='UPDATE' then changed:=new.video_path is distinct from old.video_path;end if;
 if new.video_path is not null then
  if new.video_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](mp4|mov|webm)$'
     or split_part(new.video_path,'/',1) is distinct from new.owner_id::text then
   raise exception 'La vidéo doit appartenir au déposant de cette annonce.';
  end if;
  if changed and not exists(select 1 from storage.objects o where o.bucket_id='listing-videos' and o.name=new.video_path
    and (o.metadata->>'size')::bigint between 1 and 52428800
    and o.metadata->>'mimetype' in ('video/mp4','video/quicktime','video/webm')) then
   raise exception 'Vidéo absente ou non conforme. Chargez-la à nouveau.';
  end if;
 end if;
 if changed then
  new.video_reviewed_path:=null;
  if new.video_path is not null or tg_op='UPDATE' then
   new.status:='en_attente';new.active:=false;new.verified:=false;new.validated_at:=null;
  end if;
 elsif not public.sokile_is_admin() then
  new.video_reviewed_path:=old.video_reviewed_path;
 end if;
 if new.video_path is null then new.video_reviewed_path:=null;end if;
 if new.status='validee' and new.video_path is not null and new.video_reviewed_path is distinct from new.video_path then
  raise exception 'Visionnez et validez la vidéo avant de publier cette annonce.';
 end if;
 return new;
end$$;
-- After the existing owner/workflow guard, before publication/verification.
create trigger zz_listing_video before insert or update on public.properties
for each row execute function sokile_private.guard_listing_video();
revoke all on function sokile_private.guard_listing_video() from public;
create index if not exists properties_video_path_idx on public.properties(video_path) where video_path is not null;
notify pgrst,'reload schema';
commit;

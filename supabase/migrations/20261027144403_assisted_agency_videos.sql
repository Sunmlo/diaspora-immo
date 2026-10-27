-- Agency-scoped videos remain private until reviewed and the listing is published.
-- Assisted-agency assignment is independently protected by guard_assisted_property.
begin;
create or replace function sokile_private.guard_listing_video() returns trigger
language plpgsql security invoker set search_path='' as $$
declare changed boolean;begin
 changed:=tg_op='INSERT';
 if tg_op='UPDATE' then changed:=new.video_path is distinct from old.video_path;end if;
 if new.video_path is not null then
  if new.video_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](mp4|mov|webm)$'
     or (split_part(new.video_path,'/',1) is distinct from new.owner_id::text
       and (new.assisted_agency_id is null or split_part(new.video_path,'/',1) is distinct from new.assisted_agency_id::text)) then
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
 elsif not public.sokile_is_admin() and coalesce(auth.role(),'') <> 'service_role' then
  new.video_reviewed_path:=old.video_reviewed_path;
 end if;
 if new.video_path is null then new.video_reviewed_path:=null;end if;
 if new.status='validee' and new.video_path is not null and new.video_reviewed_path is distinct from new.video_path then
  raise exception 'Visionnez et validez la vidéo avant de publier cette annonce.';
 end if;
 return new;
end$$;

commit;

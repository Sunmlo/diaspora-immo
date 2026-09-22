-- Chaque nouvelle décision de refus / demande de précisions exige une réponse.
-- Les dossiers historiques et les permissions existantes restent inchangés.
begin;
set local lock_timeout = '5s';
create or replace function public.sokile_require_moderation_response()
returns trigger language plpgsql security invoker set search_path=public as $$
declare
  current_row jsonb := to_jsonb(new);
  previous_row jsonb;
  response_key text := case when tg_table_name='properties' then 'motif_rejet' else 'moderation_note' end;
  response_text text;
begin
  if tg_op='UPDATE' then previous_row := to_jsonb(old); end if;
  if new.status in ('rejetee','refusee','modifications_demandees') then
    if tg_op='INSERT' or new.status is distinct from old.status
       or current_row->>response_key is distinct from previous_row->>response_key then
      response_text := regexp_replace(coalesce(current_row->>response_key,''),'^[[:space:]]+|[[:space:]]+$','','g');
      if char_length(response_text) < 30 or char_length(response_text) > 4000 then
        raise exception using errcode='23514', message='Une réponse personnalisée de 30 à 4000 caractères est obligatoire pour justifier cette décision.';
      end if;
    end if;
  end if;
  return new;
end $$;
-- Le nom place ce contrôle après les protections existantes du workflow.
drop trigger if exists zz_sokile_require_response on public.properties;
create trigger zz_sokile_require_response before insert or update on public.properties
for each row execute function public.sokile_require_moderation_response();
drop trigger if exists zz_sokile_require_response on public.professionals;
create trigger zz_sokile_require_response before insert or update on public.professionals
for each row execute function public.sokile_require_moderation_response();
drop trigger if exists zz_sokile_require_response on public.advertising_requests;
create trigger zz_sokile_require_response before insert or update on public.advertising_requests
for each row execute function public.sokile_require_moderation_response();
commit;

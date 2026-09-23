-- Après déploiement de search-alerts et vérification de WEBHOOK_SECRET / RESEND_API_KEY.
-- Réutilise le secret déjà conservé dans Vault, sans l'afficher ni le dupliquer.
begin;
create extension if not exists pg_cron;
do $$ begin
  if not exists(select 1 from vault.secrets where name='sokile_webhook_secret') then
    raise exception 'Le secret du webhook est absent de Vault : activation annulée.';
  end if;
end $$;
select cron.schedule('sokile-search-alerts','*/5 * * * *',$job$
  select net.http_post(
    url := 'https://nhyejaubfxjmmuvetayw.supabase.co/functions/v1/search-alerts',
    headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',(select decrypted_secret from vault.decrypted_secrets where name='sokile_webhook_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 100000
  ) where public.sokile_alerts_available();
$job$);
commit;
-- Activer uniquement après un appel de contrôle authentifié accepté :
-- update public.sokile_features set enabled=true where name='search_alerts';

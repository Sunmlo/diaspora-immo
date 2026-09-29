select cron.schedule('sokile-retention-cleanup','20 3 * * *',$job$
select net.http_post(
 url:='https://nhyejaubfxjmmuvetayw.supabase.co/functions/v1/retention-cleanup',
 headers:=jsonb_build_object('Content-Type','application/json','x-webhook-secret',(select decrypted_secret from vault.decrypted_secrets where name='sokile_webhook_secret')),
 body:='{}'::jsonb,timeout_milliseconds:=100000);
$job$);
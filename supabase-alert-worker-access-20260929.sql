-- Applied on 2026-09-29 after checking search-alerts/handler.mjs.
-- Delivery workers use service_role; browser callers must not claim or read deliveries.
REVOKE EXECUTE ON FUNCTION public.sokile_claim_alert_deliveries(), public.sokile_alert_delivery_payload(uuid,uuid), public.sokile_finish_alert_delivery(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sokile_claim_alert_deliveries(), public.sokile_alert_delivery_payload(uuid,uuid), public.sokile_finish_alert_delivery(uuid,uuid,text,text) TO service_role;

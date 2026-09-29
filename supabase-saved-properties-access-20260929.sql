-- Applied and verified on 2026-09-29.
-- Legacy table is empty and unused by the current application.
-- Current favorites are stored locally in the browser.
-- Preserve backend access and RLS; do not delete data.
REVOKE ALL PRIVILEGES ON TABLE public.saved_properties FROM PUBLIC, anon, authenticated;

-- Verification: anon/authenticated must return false; service_role stays true.
SELECT r AS role, has_table_privilege(r,'public.saved_properties','SELECT') AS can_read,
  has_table_privilege(r,'public.saved_properties','INSERT') AS can_insert
FROM unnest(ARRAY['anon','authenticated','service_role']) r;

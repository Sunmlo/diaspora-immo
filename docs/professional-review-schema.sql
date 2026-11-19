-- Apply only after review in a Supabase staging project.
-- Private invitation storage: no browser-side access and no public RLS policies.
create table if not exists public.professional_review_invites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.assisted_agencies(id) on delete set null,
  token_hash text not null unique,
  recipient_email text not null,
  draft jsonb not null,
  original jsonb not null,
  status text not null default 'pending'
    check (status in ('pending','submitted','revoked')),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_review_invites_draft_object check (jsonb_typeof(draft) = 'object'),
  constraint professional_review_invites_original_object check (jsonb_typeof(original) = 'object')
);
create index if not exists professional_review_invites_agency_idx
  on public.professional_review_invites(agency_id, created_at desc);
alter table public.professional_review_invites enable row level security;
revoke all on public.professional_review_invites from anon, authenticated;
-- Intentionally no anon/authenticated policies; server uses a secret service role.
comment on table public.professional_review_invites is
  'Private invitation drafts and confirmations; submission never publishes agency details automatically.';

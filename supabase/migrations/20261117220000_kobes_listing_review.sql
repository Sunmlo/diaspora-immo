create table public.kobes_listing_reviews (id uuid primary key, agency text not null check (agency = 'kobes-group'), payload jsonb not null check (jsonb_typeof(payload) = 'object'), created_at timestamptz not null default now());
alter table public.kobes_listing_reviews enable row level security;
revoke all on public.kobes_listing_reviews from public,anon,authenticated;
grant select,insert on public.kobes_listing_reviews to service_role;
comment on table public.kobes_listing_reviews is 'Private Kobes Group corrections and validation; no automatic publication.';

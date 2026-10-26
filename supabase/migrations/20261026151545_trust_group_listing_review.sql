create table public.trust_group_listing_reviews (id uuid primary key, agency text not null check (agency = 'trust-group'), payload jsonb not null check (jsonb_typeof(payload) = 'object'), created_at timestamptz not null default now());
alter table public.trust_group_listing_reviews enable row level security;
revoke all on public.trust_group_listing_reviews from public,anon,authenticated;
grant select,insert on public.trust_group_listing_reviews to service_role;

# Trust Group listing review

Prepared on 2026-10-26 from the agency Facebook page supplied by Trust Group. The dossier contains 22 distinct property fiches; repeated posts are merged. Multi-property offers remain grouped and explicitly require availability clarification. 44 photographs are retained privately in the deployed Edge Function package; illustrative images are excluded. Agency listing data and photos are deliberately excluded from the public Git repository. The token-authenticated API returns image data only after verifying access. Missing prices remain null (XOF on the form); unavailable photos have a labeled placeholder. Video sources are noted rather than substituted with generated content.

## Access and response handling

Page: `/validation/trust-group/index.html#cle=<private-token>`. The token is shared privately, is not stored in Git, and expires on 2026-11-26. The page is noindex and sends no referrer. The API verifies a SHA-256 token hash, enforces origin and field constraints, and rate limits submissions. Deploy the `trust-group-listing-review` Edge Function with JWT verification disabled because its custom token is validated inside the handler.

Responses are written only to `public.trust_group_listing_reviews` through the service role. The table has RLS enabled and no anon/authenticated grants or policies. No property or account is created, no announcement is published, and no message is sent by this form. Review the selected statuses and photos before any later publication.

To retrieve agency responses, use an authorized server-side database session:

```sql
select id, created_at, payload
from public.trust_group_listing_reviews
where agency = 'trust-group'
order by created_at desc;
```

An approved fiche requires explicit representation consent. Unreviewed fiches remain pending; the agency can explicitly authorize publication without a photograph. Idempotent request IDs prevent retry duplicates. Draft edits remain on the device, but consent is not persisted.

## Verification

`node --test supabase/functions/trust-group-listing-review/handler.test.mjs` covers authentication, expiry, validation, storage errors, explicit no-photo approval, and idempotent retries with JSONB key reordering. The live endpoint was tested for authenticated GET, denial without or with an invalid token, a synthetic POST, and an idempotent replay. The synthetic database row was deleted afterward.

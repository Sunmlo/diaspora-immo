# Kobes Group programme review

The existing `/validation/kobes-group.html` link now opens a programme review form. The fragment key and access expiry are unchanged. The HTML is encrypted; never commit its decryption key or a complete private link. The module `/validation/kobes-programmes-v3.js` only contains rendering and form logic, not private responses.

Each programme has general details, construction stage, delivery, total unit count, media and payment terms. Its editable typology rows hold separate prices in XOF, price qualifiers, habitable/land area ranges, availability and available lot counts. Unknown numbers remain null. Total project size is never treated as available stock. No construction stage, price or current availability is inferred from source images.

Returns use version `kobes-programmes-20261117-v3` and are stored in the existing restricted `public.kobes_listing_reviews` table, with `payload.category = programmes_neufs`. The endpoint validates identifiers, consent, ranges, stock consistency, available typology prices and construction stage/delivery. Corrections may be saved while information is still unknown. The same submission UUID is reused after an uncertain network outcome. Existing v2 forms remain supported by `legacy-handler.mjs`; existing responses are not rewritten.

Only the service role can read/insert responses. No catalogue records or accounts are created and no publication or email is triggered by a return. Review the stored payload before any later publication.

Validation: `node --test supabase/functions/kobes-listing-review/*.test.mjs`.

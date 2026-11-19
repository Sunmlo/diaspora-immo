export const REVIEW_FIELDS = Object.freeze({
  business_name: 180,
  country: 100,
  phone: 40,
  website: 400,
  description: 2000
});
export const REVIEW_FIELD_NAMES = Object.keys(REVIEW_FIELDS);

export function cleanReviewDraft(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Informations invalides.');
  const result = {};
  for (const field of REVIEW_FIELD_NAMES) {
    if (input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string') throw Error('Format de champ invalide.');
    const value = String(input[field] || '').trim();
    if (value.length > REVIEW_FIELDS[field]) throw Error('Champ trop long : ' + field);
    result[field] = value;
  }
  return result;
}

export function reviewDraftError(draft) {
  if (!draft.business_name || !draft.country || !draft.description)
    return 'Complétez au minimum le nom de la structure, le pays et la description.';
  if (draft.website && !/^https?:\/\/[^\s]+$/i.test(draft.website))
    return 'Indiquez une adresse de site complète (https://...).';
  if (draft.phone && !/^\+[1-9][0-9\s().-]{5,30}$/.test(draft.phone))
    return 'Indiquez un téléphone avec indicatif international (+...).';
  return '';
}

export function invitationStatus(invitation, now = Date.now()) {
  if (!invitation || invitation.status === 'revoked') return 'revoked';
  if (invitation.status === 'submitted') return 'submitted';
  if (Date.parse(invitation.expires_at) <= now) return 'expired';
  return 'pending';
}

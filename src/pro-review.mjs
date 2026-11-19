export const REVIEW_FIELDS = Object.freeze({
  business_name: 180,
  country: 100,
  phone: 40,
  website: 400,
  description: 2000
});
export const REVIEW_FIELD_NAMES = Object.keys(REVIEW_FIELDS);
const LISTING_FIELDS=Object.freeze({reference:80,title:220,transaction:40,location:200,price:120,surface:140,description:2500,questions:1700,source_url:700,comment:2000});
export const LISTING_STATUSES=Object.freeze(['a_confirmer','disponible','indisponible','a_corriger']);
export function cleanReviewListings(rows){
  if(!Array.isArray(rows)||rows.length<1||rows.length>50)throw Error('Nombre de biens incorrect.');
  const refs=new Set();
  return rows.map((row,i)=>{
    if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Bien invalide.');
    const clean={};
    for(const [key,max] of Object.entries(LISTING_FIELDS)){
      if(row[key]!=null&&typeof row[key]!=='string')throw Error('Champ du bien invalide : '+key);
      clean[key]=String(row[key]||'').trim();
      if(clean[key].length>max)throw Error('Champ du bien trop long : '+key);
    }
    if(!clean.reference||!clean.title)throw Error('Référence et titre nécessaires pour chaque bien.');
    if(refs.has(clean.reference))throw Error('Références de biens en doublon.');
    refs.add(clean.reference);
    if(clean.source_url&&!/^https:\/\/[^\s]+$/i.test(clean.source_url))throw Error('Lien de source invalide.');
    clean.status=String(row.status||'a_confirmer');
    if(!LISTING_STATUSES.includes(clean.status))throw Error('État de disponibilité invalide.');
    return clean;
  });
}

export function cleanReviewDraft(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Informations invalides.');
  const result = {};
  for (const field of REVIEW_FIELD_NAMES) {
    if (input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string') throw Error('Format de champ invalide.');
    const value = String(input[field] || '').trim();
    if (value.length > REVIEW_FIELDS[field]) throw Error('Champ trop long : ' + field);
    result[field] = value;
  }
  if(input.listings!==undefined){
    result.listings=cleanReviewListings(input.listings);
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
  if(draft.listings){
    const missing=draft.listings.filter(r=>r.status==='a_confirmer');
    if(missing.length)return 'Précisez la situation de chaque bien : disponible, indisponible ou à corriger ('+missing.length+' restant(s)).';
    const uncertain=draft.listings.filter(r=>r.status==='a_corriger'&&!r.comment.trim());
    if(uncertain.length)return 'Indiquez les corrections nécessaires pour les biens marqués « À corriger ».';
    const missingPrice=draft.listings.filter(r=>r.status==='disponible'&&!r.price.trim());
    if(missingPrice.length)return 'Précisez le prix des biens disponibles ('+missingPrice.length+' restant(s)).';
  }
  return '';
}

export function invitationStatus(invitation, now = Date.now()) {
  if (!invitation || invitation.status === 'revoked') return 'revoked';
  if (invitation.status === 'submitted') return 'submitted';
  if (Date.parse(invitation.expires_at) <= now) return 'expired';
  return 'pending';
}

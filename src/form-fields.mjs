// Shared form rules, kept independent of React for regression checks.
export function splitPhone(value, codes, fallback = '+221') {
  const phone = String(value || '').trim();
  const compact = phone.replace(/[\s().-]/g, '');
  const code = [...new Set(codes.map(x => x.code))].sort((a,b) => b.length-a.length).find(x => compact.startsWith(x));
  return code ? {phoneCode:code, phone:compact.slice(code.length)} : {phoneCode:fallback, phone};
}
export const propertyTransaction = p => p?.transaction || (/location/i.test(p?.type || '') ? 'location' : 'vente');
export const propertyNature = p => p?.nature || (/agricole|exploitation/i.test(`${p?.type || ''} ${p?.title || ''}`) ? 'agricole' : /terrain/i.test(`${p?.type || ''} ${p?.title || ''}`) ? 'terrain' : /commercial/i.test(p?.type || '') ? 'commerce' : /appartement|studio/i.test(p?.title || '') ? 'appartement' : 'maison');
export function listingForm(existing, user, codes) {
  return {
    agency:existing?.agency_name || user?.agency || '', name:existing?.user_name || user?.name || '',
    email:existing?.user_email || user?.email || '', ...splitPhone(existing?.user_phone || user?.phone, codes, '+33'),
    country:existing?.country || 'Sénégal', type:existing?.type || '', title:existing?.title || '',
    transaction:existing ? propertyTransaction(existing) : '', nature:existing ? propertyNature(existing) : '',
    details:{...(existing?.details || {})}, city:existing?.city || '', neighborhood:existing?.neighborhood || '',
    price_eur:existing?.price_eur ?? '', price_xof:existing?.price ?? '', surface:existing?.surface ?? '',
    rooms:existing?.rooms ?? '', bathrooms:existing?.bathrooms ?? '', features:[...(existing?.tags || [])], description:existing?.description || '',
  };
}
export function websiteUrl(value) {
  const raw=String(value || '').trim();
  if (!raw) return '';
  try {
    const url=new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (!['http:','https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
export function contactError(name,email,url) {
  if (!String(name || '').trim()) return 'Indiquez votre nom ou celui de votre société.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(email || '').trim())) return 'Indiquez une adresse email valide pour recevoir notre réponse.';
  if (websiteUrl(url) === null) return 'Indiquez une adresse de site valide commençant par https:// ou http://.';
  return '';
}
export function photoUrlsInOrder(photos, uploaded) {
  if (uploaded.length !== photos.filter(p => p.file).length) throw new Error('Certaines photos n’ont pas pu être envoyées. Vérifiez votre connexion puis réessayez : votre formulaire est conservé.');
  let next=0;
  return photos.map(p => p.file ? uploaded[next++] : p.url);
}
export async function readAllProperties(read, active = () => true) {
  const rows=[];
  for (let offset=0; active(); offset+=100) {
    const result=await read('public_properties',`select=*&order=created_at.desc,id.desc&limit=100&offset=${offset}`);
    if (!result.ok || !Array.isArray(result.data)) throw new Error('Lecture des annonces impossible');
    rows.push(...result.data);
    if (result.data.length < 100) return rows;
  }
  return [];
}

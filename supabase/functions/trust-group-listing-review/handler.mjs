const ORIGINS=new Set(['https://www.sokile.com','https://sokile.com']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
export function createHandler({tokenHash,listings,store,version='trust-20261026-v1',now=()=>new Date()}){
 return async req=>{
  const origin=req.headers.get('origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(ORIGINS.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'content-type, x-review-token'});
  const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers});
  if(origin&&!ORIGINS.has(origin))return json({error:'Origine non autorisée.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  const token=req.headers.get('x-review-token')||'';
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))return json({error:'Ouvrez le lien complet transmis par Sokilé.'},401);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==tokenHash)return json({error:'Lien privé invalide.'},403);
  if(now().getTime()>Date.parse('2026-11-26T23:59:59Z'))return json({error:'Ce lien a expiré. Contactez Sokilé.'},410);
  if(req.method==='GET')return json({version,listings});
  if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format invalide.'},415);
  let raw='',size=0;
  if(!req.body)return json({error:'Retour vide.'},400);
  const reader=req.body.getReader(),decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>240000){await reader.cancel();return json({error:'Votre retour est trop long.'},413);}raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();let data;try{data=JSON.parse(raw);}catch{return json({error:'Format invalide.'},400);}
  if(!data||!UUID.test(data.id)||data.version!==version||data.consent!==true||!Array.isArray(data.entries)||data.entries.length!==listings.length)return json({error:'Vérifiez les fiches et votre autorisation finale.'},400);
  const str=(x,max)=>typeof x==='string'&&x.length<=max;
  if(!data.contact||!str(data.contact.name,150)||!data.contact.name.trim()||!str(data.contact.email,254)||!/^\S+@\S+\.\S+$/.test(data.contact.email)||!str(data.contact.phone,100)||!data.contact.phone.trim())return json({error:'Vérifiez vos coordonnées.'},400);
  const entries=[];
  for(let i=0;i<listings.length;i++){
   const e=data.entries[i],d=listings[i];
   if(!e||e.id!==d.id||!['approved','corrections','unavailable','pending'].includes(e.status)||!['confirmed','replace','none'].includes(e.mediaChoice))return json({error:'Vérifiez le choix de chaque fiche.'},400);
   const cleaned={id:e.id,status:e.status,mediaChoice:e.mediaChoice};
   for(const [k,max] of Object.entries({title:250,location:250,description:6000,notes:3000,mediaLinks:12000,videoLink:2000})){
    if(!str(e[k],max))return json({error:'Un champ est invalide ou trop long.'},400);cleaned[k]=e[k].trim();
   }
   if(!cleaned.title||!cleaned.location)return json({error:'Indiquez le titre et la localisation.'},400);
   for(const k of ['price','area','bedrooms','bathrooms']){
    const v=e[k];if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<0||(['price','area'].includes(k)&&v===0)||v>1e12||(['bedrooms','bathrooms'].includes(k)&&(!Number.isInteger(v)||v>1000))))return json({error:'Une valeur numérique est invalide.'},400);cleaned[k]=v;
   }
   const urls=[...cleaned.mediaLinks.split(/\n/).filter(Boolean),...(cleaned.videoLink?[cleaned.videoLink]:[])];
   if(urls.length>21||urls.some(u=>{try{return new URL(u).protocol!=='https:';}catch{return true;}}))return json({error:'Indiquez des liens HTTPS valides pour vos médias.'},400);
   if(e.status==='approved'&&e.mediaChoice==='confirmed'&&!d.images.length)return json({error:'Choisissez une publication sans photo ou fournissez vos photos.'},400);
   if(e.status==='approved'&&e.mediaChoice==='replace'&&!cleaned.mediaLinks&&!cleaned.notes)return json({error:'Indiquez les nouvelles photos ou précisez leur mode de transmission.'},400);
   entries.push(cleaned);
  }
  if(entries.every(e=>e.status==='pending'))return json({error:'Indiquez votre choix pour au moins une fiche.'},400);
  const payload={version,consent:true,contact:{name:data.contact.name.trim(),email:data.contact.email.trim(),phone:data.contact.phone.trim()},entries};
  const result=row=>row?.agency==='trust-group'&&stable(row.payload)===stable(payload)?json({saved:true,reference:'TRUST-'+data.id.slice(0,8).toUpperCase()}):json({error:'Ce retour possède déjà un autre contenu. Modifiez une réponse avant de réessayer.'},409);
  try{
   const previous=await store.get(data.id);if(previous)return result(previous);
   if(await store.countSince(now().toISOString().slice(0,10))>=20)return json({error:'Plusieurs retours ont déjà été enregistrés. Contactez Sokilé pour une autre correction.'},429);
   await store.insert({id:data.id,agency:'trust-group',payload});
   const row=await store.get(data.id);if(!row)throw Error('unconfirmed');
   return result(row);
  }catch{return json({error:'L’enregistrement n’a pas pu être confirmé. Vos réponses restent affichées ; réessayez.'},503);}
 };
}

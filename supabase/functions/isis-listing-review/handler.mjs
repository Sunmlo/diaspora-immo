const STATUSES = new Set(['Disponible — fiche conforme','Disponible — corrections à apporter','Indisponible — ne pas publier','À vérifier de notre côté']);
const ORIGINS = new Set(['https://www.sokile.com','https://sokile.com']);
export function createHandler({tokenHash, expiresAt, store, getDossierUrl, listings, now=()=>new Date()}) {
 return async function handle(req) {
  const origin=req.headers.get('origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(origin && ORIGINS.has(origin)) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'content-type, x-review-token'});
  const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin && !ORIGINS.has(origin))return json({error:'Origine non autorisée.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  const token=req.headers.get('x-review-token')||'';
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))return json({error:'Utilisez le lien privé transmis par Sokilé.'},401);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==tokenHash)return json({error:'Ce lien privé est invalide.'},403);
  if(now().getTime()>Date.parse(expiresAt))return json({error:'Ce lien a expiré. Contactez Sokilé dans notre échange pour obtenir un nouvel accès.'},410);
  if(req.method==='GET'){
   if(new URL(req.url).searchParams.get('asset')==='dossier'){
    try{return json({url:await getDossierUrl(),expiresIn:120});}
    catch{return json({error:'Le dossier est momentanément indisponible. Réessayez dans quelques instants.'},503);}
   }
   return json({ready:true,listings});
  }
  if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format invalide.'},415);
  let raw='',size=0;
  if(!req.body)return json({error:'Retour vide.'},400);
  const reader=req.body.getReader(),decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>30000){await reader.cancel();return json({error:'Votre retour est trop long.'},413);}raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();
  let data;try{data=JSON.parse(raw);}catch{return json({error:'Format invalide.'},400);}
  if(!data || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)||!Array.isArray(data.entries)||data.entries.length!==10)return json({error:'Vérifiez les dix fiches.'},400);
  const entries=[];
  for(let i=0;i<10;i++){
   const e=data.entries[i];
   if(!e || e.number!==String(i+1).padStart(2,'0')||!STATUSES.has(e.status)||typeof e.notes!=='string'||e.notes.length>3000)return json({error:'Un statut ou une précision est invalide.'},400);
   entries.push({number:e.number,status:e.status,notes:e.notes.trim()});
  }
  const result=row=>row?.agency==='isis' && Array.isArray(row.entries) && row.entries.length===10 && row.entries.every((e,i)=>e.number===entries[i].number && e.status===entries[i].status && e.notes===entries[i].notes)
   ? json({saved:true,reference:'ISIS-'+data.id.slice(0,8).toUpperCase()})
   : json({error:'Ce retour possède déjà un autre contenu. Rechargez la page avant une correction.'},409);
  try {
   const previous=await store.get(data.id);
   if(previous)return result(previous);
   if(await store.countSince(now().toISOString().slice(0,10))>=20)return json({error:'Plusieurs retours ont déjà été enregistrés aujourd’hui. Contactez Sokilé pour une autre correction.'},429);
   await store.insert({id:data.id,agency:'isis',entries});
   const row=await store.get(data.id);
   if(!row)throw new Error('insert_unconfirmed');
   return result(row);
  }catch{return json({error:'L’enregistrement n’a pas pu être confirmé. Vos réponses restent affichées ; réessayez avec le même formulaire.'},503);}
 };
}

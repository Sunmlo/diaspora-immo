import {createHandler as createLegacyHandler} from './legacy-handler.mjs';
import {validateProgrammesPayload} from './programmes-schema.mjs';
const ORIGINS=new Set(['https://www.sokile.com','https://sokile.com']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
export function createHandler({tokenHash,listings,store,version='kobes-programmes-20261117-v3',now=()=>new Date()}){
 const legacy=createLegacyHandler({tokenHash,listings,store,now});
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
  if(now().getTime()>Date.parse('2027-02-17T23:59:59Z'))return json({error:'Ce lien a expiré. Contactez Sokilé.'},410);
  if(req.method==='GET')return json({version,listings});
  if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format invalide.'},415);
  let raw='',size=0;
  if(!req.body)return json({error:'Retour vide.'},400);
  const reader=req.body.getReader(),decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>240000){await reader.cancel();return json({error:'Votre retour est trop long.'},413);}raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();let data;try{data=JSON.parse(raw);}catch{return json({error:'Format invalide.'},400);}
  if(data?.version==='kobes-20261117-v2')return legacy(new Request(req.url,{method:'POST',headers:req.headers,body:raw}));
  let payload;
  try{payload=validateProgrammesPayload(data,listings,version);}catch(error){return json({error:error.message,field:error.field},400);}
  const result=row=>row?.agency==='kobes-group'&&stable(row.payload)===stable(payload)?json({saved:true,reference:'KOBES-'+data.id.slice(0,8).toUpperCase()}):json({error:'Ce retour possède déjà un autre contenu. Modifiez une réponse avant de réessayer.'},409);
  try{
   const previous=await store.get(data.id);if(previous)return result(previous);
   if(await store.countSince(now().toISOString().slice(0,10))>=20)return json({error:'Plusieurs retours ont déjà été enregistrés. Contactez Sokilé pour une autre correction.'},429);
   await store.insert({id:data.id,agency:'kobes-group',payload});
   const row=await store.get(data.id);if(!row)throw Error('unconfirmed');
   return result(row);
  }catch{return json({error:'L’enregistrement n’a pas pu être confirmé. Vos réponses restent affichées ; réessayez.'},503);}
 };
}

export function photoVerdict(r){
 if(r?.status!=='success'||!r.nudity||!r.offensive)return 'manual_review';
 const scores=[r.nudity.sexual_activity,r.nudity.sexual_display,r.nudity.erotica,r.offensive.prob];
 if(scores.some(s=>typeof s!=='number'||!Number.isFinite(s)))return 'manual_review';
 if(scores.some(s=>s>=0.5))return 'flagged';
 return 'checked';
}
const cors={'Access-Control-Allow-Origin':'https://www.sokile.com','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
export function createReviewHandler({env,send=fetch,digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('')}){
 const running=new Set();
 return async req=>{
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
  if(req.method==='OPTIONS')return new Response(null,{headers:cors});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  const base=env('SUPABASE_URL'),key=env('SUPABASE_SERVICE_ROLE_KEY')||env('SERVICE_ROLE_KEY');
  const auth=req.headers.get('authorization');if(!auth?.startsWith('Bearer '))return json({error:'Unauthorized'},401);
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  let lock;
  try{
   const a=await send(base+'/auth/v1/user',{headers:{apikey:key,Authorization:auth},signal:AbortSignal.timeout(10000)});const user=await a.json();if(!a.ok||!user.id)return json({error:'Unauthorized'},401);
   const body=await req.json();if(!/^\d{1,18}$/.test(String(body.id)))return json({error:'Invalid id'},400);
   const path=`${base}/rest/v1/properties?id=eq.${body.id}&owner_id=eq.${user.id}`;
   const r=await send(path+'&select=id,owner_id,photos,status,details,moderation_note,updated_at',{headers,signal:AbortSignal.timeout(10000)});
   const rows=await r.json();const p=r.ok&&rows[0];if(!p||p.details?.import_method!=='website')return json({error:'Not found'},404);
   if(p.status!=='en_attente')return json({error:'Already reviewed'},409);
   const fingerprint=await digest(JSON.stringify(p.photos));
   if(p.moderation_note?.includes(`[import-ia:${fingerprint}]`))return json({status:'already_checked'});
   if(running.has(String(p.id)))return json({error:'Review in progress'},409);lock=String(p.id);running.add(lock);
   let checked=0,flagged=0,pending=0;
   const photos=Array.isArray(p.photos)?p.photos:[];
   if(photos.length>20)return json({error:'Invalid photos'},422);
   const apiUser=env('SIGHTENGINE_API_USER'),apiSecret=env('SIGHTENGINE_API_SECRET');
   for(const [photoIndex,photo] of photos.entries()){
    // Only process this owner's uploaded photos, never arbitrary URLs submitted to the endpoint.
    let u;try{u=new URL(photo);}catch{pending++;continue;}
    const prefix=`/storage/v1/object/public/photos/annonces/${user.id}/`;
    const verifiedPrefix=`/storage/v1/object/public/photos-verified/annonces/${user.id}/`;
    if(u.origin!==base||(!u.pathname.startsWith(prefix)&&!u.pathname.startsWith(verifiedPrefix))||!apiUser||!apiSecret){pending++;continue;}
    try{
     const form=new URLSearchParams({url:photo,models:'nudity-2.1,offensive',api_user:apiUser,api_secret:apiSecret});
     const result=await send('https://api.sightengine.com/1.0/check.json',{method:'POST',body:form,signal:AbortSignal.timeout(8000)});
     const verdict=photoVerdict(result.ok?await result.json():null);
     if(verdict==='checked')checked++;else if(verdict==='flagged')flagged++;else {pending+=photos.length-photoIndex;break;}
    }catch{pending+=photos.length-photoIndex;break;}
   }
   const note=photos.length?`Contrôle IA des photos importées : ${checked}/${photos.length} contrôlée(s) sans signalement, ${flagged} à examiner, ${pending} contrôle(s) indisponible(s). Vérification humaine du bien, du texte et du professionnel requise avant publication.\n[${pending?'import-ia-pending':'import-ia'}:${fingerprint}]`:`Annonce sans photo : visuel « Photo non disponible ». Aucun contrôle d’image à effectuer. Vérification du bien, du texte et du professionnel requise avant publication.\n[import-ia:${fingerprint}]`;
   // Do not overwrite an administrator's concurrent decision or an edited listing.
   const saved=await send(path+'&status=eq.en_attente&updated_at=eq.'+encodeURIComponent(p.updated_at),{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({moderation_note:note}),signal:AbortSignal.timeout(10000)});
   const changed=await saved.json().catch(()=>[]);if(!saved.ok||!changed.length)return json({error:'Listing changed during review'},409);
   return json({status:!photos.length?'no_photos':pending?'manual_review':flagged?'flagged':'checked',checked,flagged,pending});
  }catch{return json({error:'Contrôle indisponible. L’annonce reste en attente de vérification.'},503);}finally{if(lock)running.delete(lock);}
 };
}

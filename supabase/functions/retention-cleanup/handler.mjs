export function createRetentionHandler({env,send=fetch}) {
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
 return async req=>{
  if(req.method!=='POST') return reply({error:'Method not allowed'},405);
  if(!env('WEBHOOK_SECRET')||req.headers.get('x-webhook-secret')!==env('WEBHOOK_SECRET')) return reply({error:'Unauthorized'},401);
  const base=env('SUPABASE_URL'),key=env('SUPABASE_SERVICE_ROLE_KEY');
  if(!base||!key) return reply({error:'Configuration incomplete'},503);
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  const rpc=async(name,body={})=>{
   const r=await send(`${base}/rest/v1/rpc/${name}`,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
   if(!r.ok) throw new Error('Database maintenance failed');
   const text=await r.text(); return text?JSON.parse(text):null;
  };
  let deleted=0,failed=0;
  try {
   const body=await req.json().catch(()=>({}));
   const dry=body.dry_run===true;
   const result=await rpc('sokile_retention_run',{p_dry_run:dry});
   if(dry) return reply(result);
   const candidates=await rpc('sokile_retention_media_pending');
   const start=Date.now();
   for(const media of candidates){
    if(Date.now()-start>50000) break;
    if(!/^annonces\/[0-9a-f-]{36}\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(media.object_path)) {failed++;continue;}
    if(!await rpc('sokile_retention_media_check',{p_url:media.url})) continue;
    let ok=false;
    try {
     const r=await send(`${base}/storage/v1/object/photos-verified`,{method:'DELETE',headers,body:JSON.stringify({prefixes:[media.object_path]}),signal:AbortSignal.timeout(10000)});
     ok=r.ok;
    } catch {}
    await rpc('sokile_retention_media_done',{p_url:media.url,p_success:ok});
    if(ok)deleted++;else failed++;
   }
   return reply({...result,photos_deleted:deleted,photos_failed:failed},failed?502:200);
  }catch{return reply({error:'Retention maintenance incomplete',photos_deleted:deleted,photos_failed:failed},503);}
 };
}

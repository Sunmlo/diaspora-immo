import {createHandler} from './handler.mjs';
const base=Deno.env.get('SUPABASE_URL')!;
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
async function rows(query:string,init:RequestInit={}){
 const res=await fetch(base+'/rest/v1/kobes_listing_reviews'+query,{...init,headers:{...headers,...init.headers},signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw Error('storage_unavailable');return await res.json();
}
const store={
 get:async(id:string)=>(await rows('?select=agency,payload&id=eq.'+encodeURIComponent(id)))[0]||null,
 countSince:async(date:string)=>(await rows('?select=id&created_at=gte.'+date+'&limit=20')).length,
 insert:async(row:unknown)=>{await rows('?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(row)});}
};
Deno.serve(createHandler({tokenHash:'26d0916b147193e608500c37c62ced6a99876599ca6860c4644c58cc3354a4aa',listings:[{"id": "KOB-01", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Les-terrasses.jpg"]}, {"id": "KOB-02", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Jean-paul-2.jpg"]}, {"id": "KOB-03", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Dalhia.jpg"]}, {"id": "KOB-04", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Kinda-residence.jpg"]}, {"id": "KOB-05", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Green-village.jpg"]}, {"id": "KOB-06", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Green-city.jpg"]}, {"id": "KOB-07", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Cite-california.jpg"]}, {"id": "KOB-08", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Cite-baobab.jpg"]}, {"id": "KOB-09", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/05/Villa-palmera.jpg"]}, {"id": "KOB-10", "images": ["https://kobesgroup.ci/wp-content/uploads/2026/09/MACADY-1.jpg"]}],store}));

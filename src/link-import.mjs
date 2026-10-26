export function linkImportApi(base,key){
 const request=async(action,url,user)=>{
  const r=await fetch('/api/import-link',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${user.token}`,apikey:key},body:JSON.stringify({action,url})});
  if(!r.ok){const b=await r.json().catch(()=>({}));throw Error(b.error||'L’import est momentanément indisponible.');}
  return action==='photo'?r.blob():r.json();
 };
 return {read:(action,url,user)=>request(action,url,user),photo:async(url,user)=>{const b=await request('photo',url,user);return new File([b],'photo-importee.'+(b.type==='image/png'?'png':b.type==='image/webp'?'webp':'jpg'),{type:b.type});},review:async(id,user)=>{const r=await fetch(base+'/functions/v1/listing-import-review',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${user.token}`,apikey:key},body:JSON.stringify({id})});if(!r.ok)throw Error('Le contrôle IA reste à effectuer ; l’annonce reste en attente.');return r.json();}};
}

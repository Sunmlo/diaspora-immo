export function verificationApi(base,key,bucket='pro-verification-documents') {
 const headers=token=>({apikey:key,Authorization:`Bearer ${token||key}`});
 async function request(path,token,options={}){const r=await fetch(`${base}/${path}`,{...options,headers:{...headers(token),...options.headers}});const data=await r.json().catch(()=>null);if(!r.ok)throw Error(data?.message||data?.error||'Le dossier n’a pas pu être enregistré. Réessayez.');return data;}
 return {
  load:(user,query='')=>request(`rest/v1/pro_verifications?select=*&${query}`,user.token),
  async reusable(user){
   const [dossiers,profiles]=await Promise.all([request(`rest/v1/pro_verifications?select=business_name,documents&owner_id=eq.${encodeURIComponent(user.id)}`,user.token),request(`rest/v1/professionals?select=business_name,directory_documents&owner_id=eq.${encodeURIComponent(user.id)}`,user.token)]);
   const seen=new Set();return [...dossiers.map(d=>({business_name:d.business_name,doc:d.documents?.registration})),...profiles.map(d=>({business_name:d.business_name,doc:d.directory_documents?.registration}))].filter(d=>{if(!d.doc?.path||seen.has(d.doc.path))return false;seen.add(d.doc.path);return true;}).map(d=>({...d.doc,label:`${d.business_name} — ${d.doc.name||'Justificatif professionnel'}`}));
  },
  save:(user,d)=>request(`rest/v1/pro_verifications${d.id?`?id=eq.${encodeURIComponent(d.id)}`:''}`,user.token,{method:d.id?'PATCH':'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({owner_id:user.id,country:d.country,activity:d.activity,business_name:d.business_name.trim(),representative_name:d.representative_name.trim(),registration_number:d.registration_number.trim(),documents:d.documents,consent_at:new Date().toISOString(),rule_version:d.rule_version,status:'en_attente'})}),
  review:(user,id,decision)=>request('rest/v1/rpc/sokile_review_verification',user.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p_id:id,...decision})}),
  async upload(user,file){
   if(!file||!['application/pdf','image/jpeg','image/png'].includes(file.type)||file.size>5*1024*1024||file.size===0)throw Error('Choisissez un PDF, JPG ou PNG de 5 Mo maximum.');
   const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
   const valid=file.type==='application/pdf'?String.fromCharCode(...bytes.slice(0,5))==='%PDF-':file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes[0]===137&&String.fromCharCode(...bytes.slice(1,4))==='PNG';
   if(!valid)throw Error('Le contenu du fichier ne correspond pas au format annoncé.');
   const ext={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png'}[file.type];const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
   await request(`storage/v1/object/${bucket}/${path}`,user.token,{method:'POST',headers:{'Content-Type':file.type},body:file});return {path,name:file.name};
  },
  async open(user,path){const r=await fetch(`${base}/storage/v1/object/authenticated/${bucket}/${path}`,{headers:headers(user.token)});if(!r.ok)throw Error('Document inaccessible. Réessayez.');return URL.createObjectURL(await r.blob());}
 };
}

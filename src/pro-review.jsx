import {useEffect,useRef,useState} from 'react';
import {cleanReviewDraft,reviewDraftError} from './pro-review.mjs';
const names={business_name:'Nom de la structure',country:"Pays d’activité",phone:'Téléphone / WhatsApp',website:'Site internet',description:'Présentation de votre activité'};
const input={width:'100%',boxSizing:'border-box',padding:12,border:'1px solid #D8CDBD',borderRadius:8,font:'inherit',marginTop:6};
async function request(action,token,extra={}){
 const response=await fetch('/api/pro-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token,...extra})});
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(json.error||'Le serveur ne répond pas.');
 return json;
}
export function ProfessionalReviewPage(){
 const token=window.location.hash.slice(1);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[record,setRecord]=useState(null),[draft,setDraft]=useState(null),[consent,setConsent]=useState(false);
 const [saved,setSaved]=useState(false);
 const current=useRef(null);
 useEffect(()=>{
   document.title='Vérification de votre fiche professionnelle — Sokilé';
   const meta=document.createElement('meta');meta.name='robots';meta.content='noindex,nofollow,noarchive';document.head.appendChild(meta);
   let active=true;
   if(!/^[a-f0-9]{64}$/.test(token)){setError('Ce lien est invalide. Contactez Sokilé pour en recevoir un nouveau.');setLoading(false);return()=>meta.remove();}
   request('read',token).then(data=>{if(active){setRecord(data);setDraft(data.draft);current.current=JSON.stringify(data.draft);}})
    .catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
   return()=>{active=false;meta.remove();};
 },[token]);
 const update=(field,value)=>{setSaved(false);setDraft(d=>({...d,[field]:value}));};
 const save=async(final=false)=>{
  if(busy||!draft)return;
  setBusy(true);setError('');
  try{
   const clean=cleanReviewDraft(draft);
   if(final){
    const validation=reviewDraftError(clean);
    if(validation)throw Error(validation);
    if(!consent)throw Error("Confirmez être autorisé à représenter cette structure.");
   }
   const updated=await request(final?'submit':'save',token,{draft:clean,...(final?{consent:true}:{})});
   current.current=JSON.stringify(clean);setRecord(updated);setDraft(updated.draft);setSaved(!final);
  }catch(e){setError(e.message);}finally{setBusy(false);}
 };
 const changed=draft&&JSON.stringify(cleanReviewDraft(draft))!==current.current;
 return <main style={{fontFamily:"'DM Sans',sans-serif",background:'#F5F0E8',color:'#1C1A17',minHeight:'100vh',padding:'30px 16px'}}>
  <section style={{maxWidth:640,margin:'0 auto',background:'#fff',padding:'clamp(18px,4vw,38px)',borderRadius:16,boxShadow:'0 8px 30px #1a3c2e10'}}>
   <a href="/" style={{fontSize:26,fontWeight:700,color:'#1A3C2E',textDecoration:'none'}}>Sokilé</a>
   <h1 style={{fontSize:27,fontWeight:500,margin:'18px 0 10px'}}>Vérifiez votre fiche professionnelle</h1>
   <p style={{lineHeight:1.6,color:'#655e53'}}>Nous avons préparé vos informations. Corrigez uniquement ce qui est nécessaire, puis confirmez. Aucun compte à créer et aucun frais.</p>
   {loading&&<p role="status">Chargement de votre fiche…</p>}
   {error&&<p role="alert" style={{color:'#A93226'}}>{error}</p>}
   {record?.status==='submitted'&&<div role="status" style={{padding:18,background:'#E8F5E9',borderRadius:10}}>Votre fiche a bien été transmise. Sokilé vérifiera vos corrections avant toute mise à jour publique.</div>}
   {record?.status==='expired'&&<p>Ce lien a expiré. Contactez Sokilé pour demander un nouveau lien.</p>}
   {record?.status==='revoked'&&<p>Ce lien a été désactivé. Contactez Sokilé.</p>}
   {record?.status==='pending'&&draft&&<form onSubmit={e=>{e.preventDefault();save(true);}}>
    {Object.entries(names).map(([key,label])=><label key={key} style={{display:'block',fontWeight:600,margin:'16px 0'}}>
      {label}{['business_name','country','description'].includes(key)?' *':''}
      {key==='description'?<textarea rows={5} maxLength={2000} style={input} value={draft[key]||''} onChange={e=>update(key,e.target.value)}/>:<input style={input} maxLength={key==='website'?400:key==='phone'?40:key==='business_name'?180:100} value={draft[key]||''} onChange={e=>update(key,e.target.value)}/>}
    </label>)}
    <label style={{display:'flex',gap:10,alignItems:'flex-start',lineHeight:1.5,marginTop:20}}>
      <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
      Je confirme être autorisé à représenter cette structure et l'exactitude des informations soumises à Sokilé.
    </label>
    <p style={{fontSize:13,color:'#655e53'}}>Les modifications sont enregistrables en brouillon. Seule votre confirmation finale les transmet à Sokilé. Les justificatifs éventuellement requis seront vérifiés séparément.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>
      <button type="button" disabled={busy||!changed} onClick={()=>save(false)} style={{padding:'13px 16px',borderRadius:8,border:'1px solid #1A3C2E',background:'#fff',color:'#1A3C2E',fontWeight:700,cursor:'pointer'}}>Enregistrer le brouillon</button>
      <button type="submit" disabled={busy||!consent} style={{padding:'13px 18px',borderRadius:8,border:0,background:'#1A3C2E',color:'#fff',fontWeight:700,cursor:'pointer'}}>{busy?'Enregistrement…':'Confirmer mes informations'}</button>
    </div>
    {saved&&<p role="status">Brouillon enregistré. Vous pourrez reprendre depuis ce même lien.</p>}
   </form>}
   <p style={{marginTop:28,fontSize:13,color:'#655e53'}}>Besoin d’aide ? <a href="mailto:contact@sokile.com">contact@sokile.com</a></p>
  </section>
 </main>;
}

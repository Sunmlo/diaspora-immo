import { useEffect, useState } from "react";
import { alertState, alertSummary } from "./lifecycle.mjs";
const green = "#1A3C2E", terra = "#B85C3A";
const card = { background:"white", border:"1px solid #E8DFD0", borderRadius:12, padding:18, fontFamily:"'DM Sans', sans-serif", color:"#1C1A17" };
const button = { border:0, borderRadius:9, padding:"12px 16px", background:terra, color:"white", fontWeight:700, cursor:"pointer", minHeight:44 };
const date = value => new Date(value).toLocaleDateString("fr-FR", { day:"numeric",month:"long",year:"numeric",timeZone:"UTC" });
const errorText = result => result?.motif || "Impossible d'enregistrer cette action. Réessayez.";
const ErrorMessage = ({message}) => message ? <p role="alert" style={{color:"#9B2C2C",lineHeight:1.6}}>{message}</p> : null;

export function AlertModal({user,filters,onClose,onCreated,rpc}) {
  const [available,setAvailable]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[created,setCreated]=useState(null);
  useEffect(()=>{let active=true;rpc("sokile_alerts_available",{}).then(r=>{if(active)setAvailable(r.ok&&r.data===true);}).catch(()=>{if(active)setAvailable(false);});return()=>{active=false;};},[rpc]);
  const submit=async()=>{
    if(busy)return;setBusy(true);setError("");
    try{const r=await rpc("sokile_create_alert",{p_filters:filters},user.token);if(!r.ok)throw new Error(errorText(r));setCreated(r.data);onCreated?.();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <section role="dialog" aria-modal="true" aria-labelledby="alert-title" onClick={e=>e.stopPropagation()} style={{...card,width:"100%",maxWidth:470,maxHeight:"85vh",overflowY:"auto",boxSizing:"border-box"}}>
      <button aria-label="Fermer l’alerte" onClick={onClose} style={{...button,float:"right",background:green}}>×</button>
      <h2 id="alert-title" style={{fontFamily:"'Fraunces',serif",marginTop:0}}>{created?"Votre alerte est active":"Créer une alerte"}</h2>
      {created?<><p role="status">Les nouvelles annonces correspondant à vos critères seront envoyées à <strong>{created.email}</strong>.</p><p>Expiration : {date(created.expires_at)}.</p><p>Vous pouvez l’annuler dans « Mon compte → Mes alertes » ou depuis un email reçu.</p><button style={button} onClick={onClose}>Terminer</button></>:<>
        <p style={{background:"#F5F0E8",padding:12,borderRadius:8,lineHeight:1.7}}>{alertSummary(filters)}</p>
        <p>Adresse de réception : <strong style={{overflowWrap:"anywhere"}}>{user.email}</strong></p>
        <p style={{lineHeight:1.6}}>Une alerte par nouveau bien correspondant. Valable un an, annulable à tout moment depuis votre compte ou un email reçu.</p>
        {available===null?<p role="status">Vérification de la disponibilité…</p>:available===false?<p role="status">Les alertes email sont en cours de préparation. Réessayez bientôt.</p>:<button style={{...button,width:"100%",opacity:busy?.6:1}} disabled={busy} onClick={submit}>{busy?"Enregistrement…":"Activer mon alerte pendant un an"}</button>}
        <ErrorMessage message={error}/>
      </>}
    </section>
  </div>;
}

export function MesAlertes({user,load,rpc,refreshKey}) {
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(null);
  useEffect(()=>{let active=true;setLoading(true);setError("");load("search_alerts","select=id,filters,email,created_at,expires_at,cancelled_at&order=created_at.desc",user.token).then(r=>{if(!active)return;if(!r.ok)throw new Error("Impossible de charger vos alertes.");setItems(r.data||[]);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[user.token,load,refreshKey]);
  const cancel=async id=>{
    if(busy)return;setBusy(id);setError("");
    try{const r=await rpc("sokile_cancel_alert",{p_id:id},user.token);if(!r.ok||r.data!==true)throw new Error("L’annulation n’a pas été enregistrée. Réessayez.");setItems(rows=>rows.map(a=>a.id===id?{...a,cancelled_at:new Date().toISOString()}:a));}
    catch(e){setError(e.message);}finally{setBusy(null);}
  };
  return <section style={card} aria-label="Mes alertes"><h3 style={{marginTop:0}}>Mes alertes</h3>
    {loading?<p role="status">Chargement…</p>:!error&&!items.length?<p>Vous n’avez pas encore d’alerte. Créez-en une depuis votre recherche de biens.</p>:null}
    <ErrorMessage message={error}/>
    <div style={{display:"grid",gap:12}}>{items.map(a=><article key={a.id} style={{borderTop:"1px solid #E8DFD0",paddingTop:12,overflowWrap:"anywhere"}}>
      <strong>{alertState(a)}</strong><p style={{fontSize:14,lineHeight:1.6}}>{alertSummary(a.filters)}</p>
      <p style={{fontSize:13}}>{a.email}<br/>{a.cancelled_at?`Annulée le ${date(a.cancelled_at)}`:`Expiration le ${date(a.expires_at)}`}</p>
      {alertState(a)==="Active"&&<button disabled={Boolean(busy)} onClick={()=>cancel(a.id)} style={{...button,background:green}}>{busy===a.id?"Annulation…":"Annuler cette alerte"}</button>}
    </article>)}</div>
    <p style={{fontSize:12,color:"#7A7264",lineHeight:1.6}}>Une annulation arrête les prochains envois. Un email déjà en cours d’envoi peut encore arriver.</p>
  </section>;
}

export function CancelAlertPage({token,rpc}) {
  const [done,setDone]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token||"");
  const cancel=async()=>{setBusy(true);setError("");try{const r=await rpc("sokile_cancel_alert_by_token",{p_token:token});if(!r.ok||r.data!==true)throw new Error("Ce lien est invalide. Vous pouvez aussi annuler l’alerte depuis votre compte.");setDone(true);}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <main style={{...card,maxWidth:520,margin:"50px auto",lineHeight:1.7}}><h1 style={{fontFamily:"'Fraunces',serif",fontSize:28}}>Sokilé · Mes alertes</h1>
    {done?<p role="status">Votre alerte est annulée. Aucun nouvel envoi ne sera déclenché pour cette recherche.</p>:valid?<><p>Souhaitez-vous arrêter les emails pour cette recherche ? Vos autres alertes resteront actives.</p><button disabled={busy} style={button} onClick={cancel}>{busy?"Annulation…":"Confirmer l’annulation"}</button></>:<p role="alert">Ce lien d’annulation est invalide.</p>}
    <ErrorMessage message={error}/><p><a style={{color:green}} href="/?tab=compte">Accéder à mon compte</a></p>
  </main>;
}

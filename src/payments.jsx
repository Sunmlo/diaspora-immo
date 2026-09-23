import {useEffect,useRef,useState} from 'react';
import {OFFER_CATEGORIES,BILLING_INTERVALS,ORDER_STATUS,amountToMinor,amountInput,paymentAmount,quotaInput} from './payments.mjs';
import './payments.css';

const initialOffer={name:'',category:'agence',description:'',amount:'',currency:'eur',billing_interval:'month',listing_quota:'',program_quota:'',archived:false};
const date=value=>new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
const ErrorBox=({text})=>text?<p role="alert" className="sp-error">{text}</p>:null;
function OfferEditor({offer,onSave,onClose}){
 const [form,setForm]=useState(offer?{...offer,amount:amountInput(offer),listing_quota:offer.listing_quota??'',program_quota:offer.program_quota??''}:initialOffer);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const title=useRef();
 useEffect(()=>{title.current?.focus();},[]);
 const set=(name,value)=>setForm(old=>({...old,[name]:value}));
 const save=async e=>{
  e.preventDefault();setError('');
  let payload;
  try{
   if(form.name.trim().length<2)throw Error('Donnez un nom à cette offre.');
   payload={name:form.name.trim(),category:form.category,description:form.description,amount_minor:amountToMinor(form.amount,form.currency),currency:form.currency,billing_interval:form.billing_interval,listing_quota:quotaInput(form.listing_quota),program_quota:quotaInput(form.program_quota),archived:form.archived};
  }catch(e){setError(e.message);return;}
  setBusy(true);
  try{const r=await onSave(offer?.id||null,payload);if(!r.ok)setError(r.motif||'Le brouillon n’a pas pu être enregistré.');else onClose();}
  catch{setError('Connexion interrompue. Votre saisie est conservée ici.');}
  finally{setBusy(false);}
 };
 return <form className="sp-panel sp-editor" onSubmit={save} aria-label="Modifier une offre">
  <div className="sp-row"><h3>{offer?'Préparer cette offre':'Nouvelle offre'}</h3><span className="sp-badge">Brouillon privé</span></div>
  <fieldset disabled={busy}><div className="sp-grid">
   <label>Nom de l’offre<input ref={title} value={form.name} maxLength={100} required onChange={e=>set('name',e.target.value)}/></label>
   <label>Type d’offre<select value={form.category} onChange={e=>set('category',e.target.value)}>{Object.entries(OFFER_CATEGORIES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   <label>Tarif envisagé<input inputMode="decimal" value={form.amount} placeholder="À définir" onChange={e=>set('amount',e.target.value)} aria-describedby="sp-price-help"/></label>
   <label>Devise<select value={form.currency} onChange={e=>set('currency',e.target.value)}><option value="eur">Euro (EUR)</option><option value="xof">Franc CFA — Afrique de l’Ouest (XOF)</option><option value="xaf">Franc CFA — Afrique centrale (XAF)</option></select></label>
   <label>Périodicité<select value={form.billing_interval} onChange={e=>set('billing_interval',e.target.value)}>{Object.entries(BILLING_INTERVALS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  </div>
  <p id="sp-price-help" className="sp-small">Laissez le tarif vide tant qu’il n’est pas décidé. Toute somme saisie sert uniquement à préparer l’offre et aux essais.</p>
  <label>Contenu de l’offre et conditions envisagées<textarea value={form.description} maxLength={2000} rows={4} placeholder="Services inclus, durée, conditions à préciser…" onChange={e=>set('description',e.target.value)}/></label>
  <div className="sp-grid">
   <label>Nombre d’annonces prévu (facultatif)<input type="number" min="1" max="100000" step="1" value={form.listing_quota} placeholder="À définir" onChange={e=>set('listing_quota',e.target.value)}/></label>
   <label>Nombre de programmes prévu (facultatif)<input type="number" min="1" max="100000" step="1" value={form.program_quota} placeholder="À définir" onChange={e=>set('program_quota',e.target.value)}/></label>
  </div><p className="sp-small">Ces quotas sont des notes de préparation. Ils ne limitent pas les comptes actuels.</p>
  <label className="sp-check"><input type="checkbox" checked={form.archived} onChange={e=>set('archived',e.target.checked)}/>Mettre cette offre de côté (archiver)</label>
  </fieldset><ErrorBox text={error}/><div className="sp-actions"><button className="sp-primary" disabled={busy}>{busy?'Enregistrement…':'Enregistrer le brouillon'}</button><button type="button" disabled={busy} onClick={onClose}>Annuler</button></div>
 </form>;
}
export function PaymentsAdmin({api,user}){
 const [offers,setOffers]=useState([]),[orders,setOrders]=useState([]),[settings,setSettings]=useState(null),[connection,setConnection]=useState(null);
 const [loading,setLoading]=useState(true),[checking,setChecking]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[connectionError,setConnectionError]=useState('');
 const [edit,setEdit]=useState(undefined),[offset,setOffset]=useState(0),[more,setMore]=useState(false),[refresh,setRefresh]=useState(0),[lastEvent,setLastEvent]=useState(null);
 const requests=useRef({});
 useEffect(()=>{
  let current=true;setLoading(true);setError('');
  Promise.all([
   api.load('billing_offers','select=*&order=archived.asc,name.asc',user.token),
   api.load('billing_settings','select=*',user.token),
   api.load('billing_test_orders',`select=*&order=created_at.desc&limit=21&offset=${offset}`,user.token),
   api.load('billing_test_events','select=received_at&order=received_at.desc&limit=1',user.token),
  ]).then(results=>{
   if(!current)return;
   if(results.some(r=>!r.ok)||!results[1].data?.[0])throw Error('La configuration des paiements ne peut pas être chargée. Réessayez dans quelques instants.');
   setOffers(results[0].data);setSettings(results[1].data[0]);setOrders(results[2].data.slice(0,20));setMore(results[2].data.length>20);setLastEvent(results[3].data?.[0]?.received_at||null);
  }).catch(e=>{if(current)setError(e.message);}).finally(()=>{if(current)setLoading(false);});
  return()=>{current=false;};
 },[api,user.token,offset,refresh]);
 const check=async()=>{setChecking(true);setConnectionError('');const r=await api.gateway(user.token,{action:'status'});setConnection(r.ok?r.data:null);if(!r.ok)setConnectionError(r.motif);setChecking(false);};
 useEffect(()=>{let current=true;setConnection(null);api.gateway(user.token,{action:'status'}).then(r=>{if(current){setConnection(r.ok?r.data:null);setConnectionError(r.ok?'':r.motif);}});return()=>{current=false;};},[api,user.token]);
 const ready=connection?.connected&&connection?.webhook_configured;
 const toggle=async()=>{
  setBusy(true);setError('');setNotice('');
  try{const r=await api.rpc('sokile_billing_settings',{p_enabled:!settings.test_enabled},user.token);if(!r.ok)throw Error('Ce réglage n’a pas pu être enregistré.');setNotice(settings.test_enabled?'Les essais sont désactivés.':'Les essais sont autorisés pour l’administration uniquement.');setRefresh(v=>v+1);}
  catch(e){setError(e.message);}finally{setBusy(false);}
 };
 const checkout=async offer=>{
  setBusy(true);setError('');setNotice('');
  const requestId=requests.current[offer.id]||crypto.randomUUID();requests.current[offer.id]=requestId;
  const r=await api.gateway(user.token,{action:'checkout',offer_id:offer.id,request_id:requestId});
  if(r.ok&&r.data?.test_only&&r.data?.url){
   let safe=false;try{safe=new URL(r.data.url).origin==='https://checkout.stripe.com';}catch{}
   if(safe){delete requests.current[offer.id];window.location.assign(r.data.url);return;}
  }
  setError(r.motif||'La page de paiement de test est indisponible.');setBusy(false);setRefresh(v=>v+1);
 };
 const saveOffer=async(id,payload)=>{
  const r=await api.rpc('sokile_billing_save_offer',{p_id:id,p_offer:payload},user.token);
  if(r.ok){setNotice('Brouillon enregistré. Il reste privé.');setRefresh(v=>v+1);if(id)delete requests.current[id];}
  return r;
 };
 return <section className="sp" aria-label="Gestion des paiements">
  <header className="sp-hero"><div><span className="sp-eyebrow">PRÉPARER LES FORMULES</span><h2>Les paiements, à votre rythme.</h2><p>Préparez vos offres et vérifiez le parcours avant de les proposer à vos clients.</p></div><span className="sp-badge sp-light">Encaissements réels désactivés</span></header>
  <div className="sp-note">Sokilé reste gratuit. Les offres ci-dessous sont privées ; aucun paiement ni abonnement réel ne peut être déclenché ici.</div>
  <ErrorBox text={error}/>{notice&&<p className="sp-success" role="status">{notice}</p>}
  <section className="sp-panel" aria-label="Connexion de paiement"><div className="sp-row"><h3>Connexion Stripe</h3><span className="sp-badge">Mode test uniquement</span></div>
   <div className="sp-grid"><div><strong>{connection?.connected?'Compte de test raccordé':connection?.key_configured?'Connexion à vérifier':connection?'Compte Stripe à raccorder':'Connexion non vérifiée'}</strong><p className="sp-small">{connection?.connected?'Le service Stripe répond en mode test.':'Le raccordement se fait avec le compte Stripe de Sokilé.'}</p></div><div><strong>{lastEvent?'Confirmation Stripe reçue':connection?.webhook_configured?'Confirmation à tester':'Confirmation automatique à raccorder'}</strong><p className="sp-small">{lastEvent?`Dernière notification vérifiée : ${date(lastEvent)}`:'Une réussite est affichée seulement après confirmation de Stripe.'}</p></div></div>
   {connection?.key_configured&&!connection?.key_valid&&<ErrorBox text="La clé configurée n’est pas une clé de test. Les essais sont bloqués."/>}<ErrorBox text={connectionError}/>
   <div className="sp-actions"><button onClick={check} disabled={checking||busy}>{checking?'Vérification…':'Vérifier la connexion Stripe'}</button><button onClick={toggle} disabled={busy||loading||!settings||(!settings.test_enabled&&!ready)}>{settings?.test_enabled?'Désactiver les essais':'Autoriser les essais privés'}</button></div>
   {!ready&&<p className="sp-small">Les essais seront disponibles après le raccordement du compte Stripe de test et des confirmations automatiques.</p>}
  </section>
  <div className="sp-row sp-title"><h3>Futures offres</h3><button onClick={()=>{setEdit(null);setNotice('');}} disabled={busy||loading}>+ Préparer une offre</button></div>
  {edit!==undefined&&<OfferEditor key={edit?.id||'new'} offer={edit} onSave={saveOffer} onClose={()=>setEdit(undefined)}/>}
  {loading?<p role="status">Chargement…</p>:<div className="sp-offers">{offers.map(o=><article key={o.id} className={`sp-panel ${o.archived?'sp-archived':''}`}><div className="sp-row"><span className="sp-eyebrow">{OFFER_CATEGORIES[o.category]}</span><span className="sp-badge">{o.archived?'Archivée':'Brouillon privé'}</span></div><h4>{o.name}</h4><div className="sp-price">{paymentAmount(o.amount_minor,o.currency)}</div><p className="sp-small">{BILLING_INTERVALS[o.billing_interval]}</p><p className="sp-description">{o.description||'Services et conditions à préciser.'}</p>{(o.listing_quota||o.program_quota)&&<p className="sp-small">Prévision : {[o.listing_quota&&`${o.listing_quota} annonces`,o.program_quota&&`${o.program_quota} programmes`].filter(Boolean).join(' · ')}</p>}<div className="sp-actions"><button onClick={()=>{setEdit(o);setNotice('');}} disabled={busy} aria-label={`Modifier ${o.name}`}>Modifier</button><button className="sp-primary" disabled={busy||!ready||!settings?.test_enabled||o.amount_minor==null||o.archived} onClick={()=>checkout(o)} aria-label={`Tester ${o.name}`}>Tester le paiement</button></div></article>)}</div>}
  <section className="sp-panel sp-history" aria-label="Historique des essais"><div className="sp-row"><h3>Historique des essais</h3><button onClick={()=>setRefresh(v=>v+1)} disabled={busy||loading}>Actualiser les essais</button></div><p className="sp-small">Suivi du paiement initial. Le refus d’une carte laisse la session ouverte pour réessayer ; l’abandon apparaît à son expiration. Les renouvellements et remboursements seront configurés avant le lancement commercial.</p>
   {!loading&&!orders.length&&!error?<p className="sp-empty">Aucun essai de paiement pour le moment.</p>:orders.map(o=><article className="sp-order" key={o.id}><div><strong>{o.offer_name}</strong><p className="sp-small">{date(o.created_at)} · {paymentAmount(o.amount_minor,o.currency)} · {BILLING_INTERVALS[o.billing_interval]}</p></div><span className={`sp-badge ${o.status==='paid'?'sp-paid':''}`}>{o.status==='created'&&o.stripe_session_id?'Page de paiement ouverte':ORDER_STATUS[o.status]}</span></article>)}
   <div className="sp-actions">{offset>0&&<button disabled={loading} onClick={()=>setOffset(v=>Math.max(0,v-20))}>Essais précédents</button>}{more&&<button disabled={loading} onClick={()=>setOffset(v=>v+20)}>Essais suivants</button>}</div>
  </section>
 </section>;
}

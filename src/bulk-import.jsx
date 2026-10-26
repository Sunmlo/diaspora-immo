import {useEffect,useRef,useState} from 'react';
import {CORE_COLUMNS,validateRow,rowPayload,ownListings,keyOf} from './bulk-import.mjs';
import {readImportFile,downloadTemplate} from './bulk-import-files.mjs';
import {normalizePhone} from './form-fields.mjs';
import './bulk-import.css';
import {VerificationPanel} from './pro-verification.jsx';
function Photo({file}){const [url,setUrl]=useState('');useEffect(()=>{const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u);},[file]);return <img src={url} alt={file.name}/>;}
export function BulkImport({user,schema,api,onClose,onSaved}){
  const dialog=useRef(null),lock=useRef(false),uploaded=useRef(new Map());
  const [rows,setRows]=useState([]),[existing,setExisting]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState(''),[sent,setSent]=useState([]);
  const [authorityAccepted,setAuthorityAccepted]=useState(false);
  const [source,setSource]=useState('link'),[url,setUrl]=useState(''),[links,setLinks]=useState([]),[linkRights,setLinkRights]=useState(false);
  const inspectLink=async()=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setProgress('Lecture du lien…');
    try{
      const page=await api.link.read('discover',url,user);
      setExisting(await ownListings(api.read,user));setSent([]);uploaded.current.clear();setAuthorityAccepted(false);
      if(page.isDetail){setRows([{...page,photos:[],selected:true}]);setLinks([]);setProgress('Annonce récupérée. Vérifiez les informations et les photos avant de valider.');}
      else if(page.links.length){setRows([]);setLinks(page.links.map(l=>({...l,selected:true})));setProgress(`${page.links.length} liens trouvés sur cette page. Sélectionnez les biens à récupérer.${page.hasMore?' Cette page contient davantage de liens : procédez par lots.':''}`);}
      else throw Error('Aucune annonce identifiable sur cette page. Collez le lien direct d’un bien ou utilisez l’import Excel/CSV.');
    }catch(e){setError(e.message);setProgress('');}finally{lock.current=false;setBusy(false);}
  };
  const retrieveLinks=async()=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');const prepared=[...rows],failed=[];
    try{const chosen=links.filter(l=>l.selected);for(const [i,l] of chosen.entries()){
      setProgress(`Récupération de l’annonce ${i+1}/${chosen.length}…`);
      try{const page=await api.link.read('detail',l.url,user);if(!page.isDetail)throw Error('Page non identifiable');prepared.push({...page,photos:[],selected:true});setRows([...prepared]);}catch{failed.push(l.url);}
    }setLinks(old=>old.filter(l=>failed.includes(l.url)));setProgress(`${prepared.length} annonce(s) récupérée(s). Vérifiez puis validez votre sélection.`);if(failed.length)setError(`${failed.length} page(s) n’ont pas pu être récupérées. Leurs liens restent affichés ci-dessous ; les autres annonces sont disponibles pour vérification.`);
    }finally{lock.current=false;setBusy(false);}
  };
  const photoCount=r=>r.photos.length+(r.remotePhotos?.length||0);
  const [activity,setActivity]=useState('agence');
  const [contact,setContact]=useState({name:user.name||'',agency:user.agency||'',email:user.email||'',phone:user.phone||''});
  useEffect(()=>{dialog.current?.showModal();const d=dialog.current;return()=>d?.close();},[]);
  const setRow=(index,change)=>{uploaded.current.delete(index);setRows(old=>old.map((r,i)=>i===index?{...r,...change}:r));};
  const inspect=async file=>{
    if(!file||lock.current)return;setBusy(true);lock.current=true;setError('');
    try{const parsed=await readImportFile(file,schema.columns);const current=await ownListings(api.read,user);setExisting(current);setRows(parsed.map(data=>({data,photos:[],selected:true})));setAuthorityAccepted(false);setSent([]);uploaded.current.clear();setProgress('Fichier lu. Vérifiez les annonces et ajoutez leurs photos.');}
    catch(e){setError(e.message||'Impossible de lire ce fichier.');}finally{setBusy(false);lock.current=false;}
  };
  const errorsFor=(r,current=existing)=>validateRow(r.data,schema,rows.filter(x=>x.selected).map(x=>x.data),current||[]);
  const selected=rows.map((r,index)=>({...r,index})).filter(r=>r.selected&&!sent.includes(r.index));
  const invalid=selected.some(r=>errorsFor(r).length||!photoCount(r));
  const send=async()=>{
    if(lock.current||!selected.length)return;
    if(!authorityAccepted){setError("Confirmez être propriétaire ou autorisé à proposer chacun des biens sélectionnés.");return;}
    const phone=normalizePhone('',contact.phone);
    if(!contact.name.trim()||!contact.agency.trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)||!phone){setError('Renseignez le nom du contact, l’agence, l’email et un téléphone avec indicatif international (ex. +221…).');return;}
    if(!user.id||!user.token){setError('Reconnectez-vous avant l’envoi.');return;}
    lock.current=true;setBusy(true);setError('');
    try{
      const current=await ownListings(api.read,user);setExisting(current);
      if(selected.some(r=>errorsFor(r,current).length||!photoCount(r)))throw Error('Certaines annonces nécessitent une correction. Vérifiez les lignes signalées.');
      const payload=[];
      for(let i=0;i<selected.length;i++){
        const r=selected[i];setProgress(`Préparation des photos : annonce ${i+1}/${selected.length}`);
        let urls=uploaded.current.get(r.index);
        if(!urls){const remote=[];for(const url of r.remotePhotos||[])remote.push(await api.link.photo(url,user));urls=await api.upload([...remote,...r.photos],user);if(urls.length!==photoCount(r))throw Error(`Photos incomplètes pour ${r.data.reference}. Réessayez : aucune annonce de ce lot n’a été envoyée.`);uploaded.current.set(r.index,urls);}
        const listing=rowPayload(r.data,{...user,...contact,phone},urls,schema);
        listing.professional_activity=activity;
        listing.details={...listing.details,publication_authorized:true,publication_authorized_at:new Date().toISOString(),publication_authorization_version:1,...(r.sourceUrl?{import_source_url:r.sourceUrl,import_method:'website'}:{})};
        payload.push(listing);
      }
      setProgress(`Envoi de ${payload.length} annonces en validation…`);
      let result;try{result=await api.write('properties',payload,user.token);}catch{result=null;}
      if(!result?.ok){
        // A timeout may occur after the server committed the batch. Read before permitting a retry.
        const fresh=await ownListings(api.read,user);setExisting(fresh);
        const found=selected.filter(r=>fresh.some(p=>keyOf(p.details?.import_reference)===keyOf(r.data.reference))).map(r=>r.index);
        if(found.length){setSent(old=>[...old,...found]);onSaved();}
        throw Error(found.length===selected.length?'Vos annonces ont été retrouvées dans votre compte après une interruption de connexion. Ne les renvoyez pas.':'L’envoi n’a pas été confirmé. Les références déjà présentes sont bloquées ; vérifiez votre compte avant de réessayer.');
      }
      setSent(old=>[...old,...selected.map(r=>r.index)]);onSaved();
      let reviewPending=0;
      for(const listing of result.data||[]){if(listing.details?.import_method==='website'){setProgress('Annonces reçues. Contrôle des photos par IA…');try{const review=await api.link.review(listing.id,user);if(review.status==='manual_review')reviewPending++;}catch{reviewPending++;}}}
      if(reviewPending)setError('Vos annonces sont bien reçues. Certains contrôles nécessitent une vérification complémentaire ; les annonces restent en attente de publication.');
      setProgress(`${selected.length} annonce(s) envoyée(s) en validation. Retrouvez-les dans « Mes annonces ».`);
    }catch(e){setError(e.message||'Une erreur est survenue. Vos lignes restent disponibles ici.');}finally{lock.current=false;setBusy(false);}
  };
  const template=async()=>{setBusy(true);setError('');try{await downloadTemplate(schema);}catch{setError('Le modèle n’a pas pu être téléchargé. Réessayez.');}finally{setBusy(false);}};
  return <dialog className="sok-bulk" ref={dialog} onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <header><div><small>ESPACE PROFESSIONNEL · GRATUIT</small><h2>Importer mes annonces</h2></div><button disabled={busy} onClick={onClose} aria-label="Fermer l’import">✕</button></header>
    <div className="sok-bulk-body">
      <p>1. Importez · 2. Vérifiez et complétez · 3. Validez et soumettez.</p>
      <div className="sok-bulk-actions"><button disabled={busy} aria-pressed={source==='link'} onClick={()=>setSource('link')}>Depuis un lien</button><button disabled={busy} aria-pressed={source==='file'} onClick={()=>setSource('file')}>Excel / CSV</button></div>
      {source==='link'?<section className="sok-link-entry">
        <h3>Vos annonces, sans tout ressaisir</h3><p>Collez le lien d’un bien ou de la page de vos annonces. Vous pourrez sélectionner les biens, corriger les informations et retirer des photos avant l’envoi.</p>
        <label>Lien de votre site ou d’une annonce<input type="url" placeholder="https://votre-agence.com/annonces" value={url} disabled={busy} onChange={e=>setUrl(e.target.value)}/></label>
        <label className="sok-bulk-select"><input type="checkbox" checked={linkRights} disabled={busy} onChange={e=>setLinkRights(e.target.checked)}/>Je suis autorisé à reprendre les textes et photos de ces annonces sur Sokilé.</label>
        <button disabled={busy||!url.trim()||!linkRights} onClick={inspectLink}>Récupérer mes annonces</button>
        <p className="sok-bulk-help">Sites publics accessibles, jusqu’à 50 liens par page et 20 photos par bien. Pour les autres pages du site, recommencez avec leur lien. Les réseaux sociaux et certains sites protégés peuvent bloquer l’import.</p>
        {!!links.length&&<fieldset disabled={busy}><legend>Choisissez les annonces à récupérer</legend>{links.map((l,i)=><label className="sok-bulk-select" key={l.url}><input type="checkbox" checked={l.selected} onChange={e=>setLinks(old=>old.map((x,n)=>n===i?{...x,selected:e.target.checked}:x))}/><span>{l.title}<small style={{display:'block',overflowWrap:'anywhere'}}>{l.url}</small></span></label>)}<button disabled={!links.some(l=>l.selected)} onClick={retrieveLinks}>Préparer ma sélection</button></fieldset>}
      </section>:<><p>Excel (.xlsx) ou CSV, 50 annonces et 2 Mo maximum. Loyer mensuel en FCFA pour les locations.</p><div className="sok-bulk-actions"><button disabled={busy} onClick={template}>Télécharger le modèle Excel</button><label>Charger mon fichier<input disabled={busy} type="file" accept=".xlsx,.csv" onChange={e=>{inspect(e.target.files?.[0]);e.target.value='';}}/></label></div></>}
      <p className="sok-bulk-help">Vos annonces existantes sont conservées. Rien n’est publié à cette étape. Gardez cet écran ouvert jusqu’à l’envoi : fermer l’aperçu efface les modifications.</p>
      {error&&<p className="sok-bulk-error" role="alert">{error}</p>}{progress&&<p role="status">{progress}</p>}
      {!!rows.length&&<>
        <fieldset disabled={busy}><legend>Structure et contact pour ce lot</legend><div className="sok-bulk-grid">{[['name','Nom du contact'],['agency','Nom légal de la structure'],['email','Email'],['phone','Téléphone international']].map(([k,l])=><label key={k}>{l}<input type={k==='email'?'email':k==='phone'?'tel':'text'} value={contact[k]} onChange={e=>setContact({...contact,[k]:e.target.value})}/></label>)}</div></fieldset>
        <label>Activité pour ce lot<select disabled={busy} value={activity} onChange={e=>setActivity(e.target.value)}><option value="agence">Agence / agent immobilier</option><option value="courtier">Courtier immobilier</option><option value="promoteur">Promoteur immobilier</option></select></label><p className="pv-note">Chaque pays du lot nécessite un dossier professionnel validé avant publication. Vous pouvez transmettre les annonces pendant son examen.</p>{[...new Set(selected.map(r=>r.data.pays).filter(c=>schema.countries.includes(c)))].map(country=><VerificationPanel key={country} api={api.verification} user={user} country={country} activity={activity} businessName={contact.agency}/>)}
        <h3>{rows.length} annonce(s) dans l’aperçu · {selected.length} sélectionnée(s)</h3>
        {rows.map((r,index)=>{const errors=errorsFor(r),done=sent.includes(index);return <article key={index} className="sok-bulk-row">
          <label className="sok-bulk-select"><input type="checkbox" checked={r.selected&&!done} disabled={busy||done} onChange={e=>setRow(index,{selected:e.target.checked})}/><strong>{r.data.reference||`Ligne ${index+2}`} — {r.data.titre||'Sans titre'}</strong></label>
          <p>{done?'Envoyée en validation':`${r.data.transaction==='location'?'Location':'Vente'} · ${r.data.ville} · ${r.data.prix_fcfa} FCFA${r.data.transaction==='location'?' / mois':''}`}</p>
          {!done&&errors.length>0&&<ul className="sok-bulk-error">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul>}
          {!done&&<><details open={errors.length>0}><summary>Vérifier ou corriger les informations</summary><fieldset disabled={busy}><div className="sok-bulk-grid">{[...CORE_COLUMNS,...schema.fields(r.data.nature,r.data.transaction).map(c=>c.k)].filter((k,i,all)=>all.indexOf(k)===i).map(k=>{const c=schema.fields(r.data.nature,r.data.transaction).find(c=>c.k===k);const options=k==='transaction'?['vente','location']:k==='nature'?schema.natures:k==='pays'?schema.countries:c?.options;return <label key={k}>{c?.l||schema.labels[k]||k}{options?<select value={r.data[k]||''} onChange={e=>setRow(index,{data:{...r.data,[k]:e.target.value}})}><option value="">Choisir</option>{options.map(v=><option key={v}>{v}</option>)}</select>:k==='description'?<textarea rows={4} value={r.data[k]||''} onChange={e=>setRow(index,{data:{...r.data,[k]:e.target.value}})}/>:<input value={r.data[k]||''} onChange={e=>setRow(index,{data:{...r.data,[k]:e.target.value}})}/>}</label>;})}</div></fieldset></details>
          <label>Photos du bien (1 à 20, 8 Mo maximum chacune)<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{const files=[...e.target.files];if(files.reduce((sum,f)=>sum+f.size,0)+rows.reduce((sum,r)=>sum+r.photos.reduce((n,f)=>n+f.size,0),0)>200*1024*1024){setError("Limite de 200 Mo de photos par lot. Importez moins de biens à la fois.");}else if(files.length+photoCount(r)>20||files.some(f=>f.size>8*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))){setError('Choisissez au maximum 20 photos JPG, PNG ou WebP de moins de 8 Mo pour ce bien.');}else{setError('');setRow(index,{photos:[...r.photos,...files]});}e.target.value='';}}/></label>
          {!photoCount(r)&&<p>Ajoutez au moins une photo avant l’envoi.</p>}
          <div className="sok-bulk-photos">{(r.remotePhotos||[]).map((url,i)=><div key={url}><img src={url} alt={`Photo importée ${i+1}`} referrerPolicy="no-referrer"/><small>{i===0?'Couverture':`Photo ${i+1}`}</small><button disabled={busy} onClick={()=>setRow(index,{remotePhotos:r.remotePhotos.filter((_,n)=>n!==i)})}>Retirer</button>{i>0&&<button disabled={busy} onClick={()=>setRow(index,{remotePhotos:[url,...r.remotePhotos.filter((_,n)=>n!==i)]})}>Couverture</button>}</div>)}{r.photos.map((file,i)=><div key={i}><Photo file={file}/><small>{i===0&&!r.remotePhotos?.length?'Couverture':`Photo ${(r.remotePhotos?.length||0)+i+1}`}</small><button disabled={busy} onClick={()=>setRow(index,{photos:r.photos.filter((_,n)=>i!==n)})} aria-label={`Retirer la photo ${i+1} de ${r.data.reference}`}>Retirer</button>{i>0&&!r.remotePhotos?.length&&<button disabled={busy} onClick={()=>setRow(index,{photos:[file,...r.photos.filter((_,n)=>n!==i)]})}>Couverture</button>}</div>)}</div></>}
        </article>;})}
        <label style={{display:"flex",gap:10,alignItems:"flex-start",margin:"16px 0"}}><input type="checkbox" disabled={busy} checked={authorityAccepted} onChange={e=>setAuthorityAccepted(e.target.checked)}/><span>Je confirme être propriétaire de chacun des biens sélectionnés ou autorisé à les proposer à la vente ou à la location. *</span></label>
        <div className="sok-bulk-submit"><p>Les annonces sélectionnées seront soumises à Sokilé. Leurs photos importées seront contrôlées par IA. Elles deviendront publiques après validation par Sokilé.</p><button disabled={busy||invalid||!authorityAccepted||!selected.length||existing===null} onClick={send}>{busy?'Traitement en cours…':`Envoyer ${selected.length} annonce(s) en validation`}</button>{invalid&&<small>Corrigez les erreurs et ajoutez les photos, ou décochez les lignes à traiter plus tard.</small>}</div>
      </>}
    </div>
  </dialog>;
}

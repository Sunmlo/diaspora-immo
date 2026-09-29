import {useEffect,useRef,useState} from 'react';
import {CORE_COLUMNS,validateRow,rowPayload,ownListings,keyOf} from './bulk-import.mjs';
import {readImportFile,downloadTemplate} from './bulk-import-files.mjs';
import {normalizePhone} from './form-fields.mjs';
import './bulk-import.css';
function Photo({file}){const [url,setUrl]=useState('');useEffect(()=>{const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u);},[file]);return <img src={url} alt={file.name}/>;}
export function BulkImport({user,schema,api,onClose,onSaved}){
  const dialog=useRef(null),lock=useRef(false),uploaded=useRef(new Map());
  const [rows,setRows]=useState([]),[existing,setExisting]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState(''),[sent,setSent]=useState([]);
  const [contact,setContact]=useState({name:user.name||'',agency:user.agency||'',email:user.email||'',phone:user.phone||''});
  useEffect(()=>{dialog.current?.showModal();const d=dialog.current;return()=>d?.close();},[]);
  const setRow=(index,change)=>{uploaded.current.delete(index);setRows(old=>old.map((r,i)=>i===index?{...r,...change}:r));};
  const inspect=async file=>{
    if(!file||lock.current)return;setBusy(true);lock.current=true;setError('');
    try{const parsed=await readImportFile(file,schema.columns);const current=await ownListings(api.read,user);setExisting(current);setRows(parsed.map(data=>({data,photos:[],selected:true})));setSent([]);uploaded.current.clear();setProgress('Fichier lu. Vérifiez les annonces et ajoutez leurs photos.');}
    catch(e){setError(e.message||'Impossible de lire ce fichier.');}finally{setBusy(false);lock.current=false;}
  };
  const errorsFor=(r,current=existing)=>validateRow(r.data,schema,rows.filter(x=>x.selected).map(x=>x.data),current||[]);
  const selected=rows.map((r,index)=>({...r,index})).filter(r=>r.selected&&!sent.includes(r.index));
  const invalid=selected.some(r=>errorsFor(r).length||!r.photos.length);
  const send=async()=>{
    if(lock.current||!selected.length)return;
    const phone=normalizePhone('',contact.phone);
    if(!contact.name.trim()||!contact.agency.trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)||!phone){setError('Renseignez le nom du contact, l’agence, l’email et un téléphone avec indicatif international (ex. +221…).');return;}
    if(!user.id||!user.token){setError('Reconnectez-vous avant l’envoi.');return;}
    lock.current=true;setBusy(true);setError('');
    try{
      const current=await ownListings(api.read,user);setExisting(current);
      if(selected.some(r=>errorsFor(r,current).length||!r.photos.length))throw Error('Certaines annonces nécessitent une correction. Vérifiez les lignes signalées.');
      const payload=[];
      for(let i=0;i<selected.length;i++){
        const r=selected[i];setProgress(`Préparation des photos : annonce ${i+1}/${selected.length}`);
        let urls=uploaded.current.get(r.index);
        if(!urls){urls=await api.upload(r.photos,user);if(urls.length!==r.photos.length)throw Error(`Photos incomplètes pour ${r.data.reference}. Réessayez : aucune annonce de ce lot n’a été envoyée.`);uploaded.current.set(r.index,urls);}
        payload.push(rowPayload(r.data,{...user,...contact,phone},urls,schema));
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
      setSent(old=>[...old,...selected.map(r=>r.index)]);onSaved();setProgress(`${selected.length} annonce(s) envoyée(s) en validation. Retrouvez-les dans « Mes annonces ».`);
    }catch(e){setError(e.message||'Une erreur est survenue. Vos lignes restent disponibles ici.');}finally{lock.current=false;setBusy(false);}
  };
  const template=async()=>{setBusy(true);setError('');try{await downloadTemplate(schema);}catch{setError('Le modèle n’a pas pu être téléchargé. Réessayez.');}finally{setBusy(false);}};
  return <dialog className="sok-bulk" ref={dialog} onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <header><div><small>ESPACE PROFESSIONNEL · GRATUIT</small><h2>Importer mes annonces</h2></div><button disabled={busy} onClick={onClose} aria-label="Fermer l’import">✕</button></header>
    <div className="sok-bulk-body">
      <p>1. Complétez le modèle · 2. Vérifiez vos biens et leurs photos · 3. Envoyez-les en validation.</p>
      <p>Excel (.xlsx) ou CSV, 50 annonces et 2 Mo maximum. Loyer mensuel en FCFA pour les locations. Vos annonces existantes ne sont pas remplacées.</p>
      <div className="sok-bulk-actions"><button disabled={busy} onClick={template}>Télécharger le modèle Excel</button><label>Charger mon fichier<input disabled={busy} type="file" accept=".xlsx,.csv" onChange={e=>{inspect(e.target.files?.[0]);e.target.value='';}}/></label></div>
      <p className="sok-bulk-help">Le fichier est lu dans votre navigateur. Les annonces et photos sont envoyées seulement lorsque vous cliquez sur « Envoyer en validation ». Gardez votre fichier : fermer cet écran efface l’aperçu.</p>
      {error&&<p className="sok-bulk-error" role="alert">{error}</p>}{progress&&<p role="status">{progress}</p>}
      {!!rows.length&&<>
        <fieldset disabled={busy}><legend>Contact de l’agence pour ce lot</legend><div className="sok-bulk-grid">{[['name','Nom du contact'],['agency','Agence'],['email','Email'],['phone','Téléphone international']].map(([k,l])=><label key={k}>{l}<input type={k==='email'?'email':k==='phone'?'tel':'text'} value={contact[k]} onChange={e=>setContact({...contact,[k]:e.target.value})}/></label>)}</div></fieldset>
        <h3>{rows.length} annonce(s) dans le fichier · {selected.length} sélectionnée(s)</h3>
        {rows.map((r,index)=>{const errors=errorsFor(r),done=sent.includes(index);return <article key={index} className="sok-bulk-row">
          <label className="sok-bulk-select"><input type="checkbox" checked={r.selected&&!done} disabled={busy||done} onChange={e=>setRow(index,{selected:e.target.checked})}/><strong>{r.data.reference||`Ligne ${index+2}`} — {r.data.titre||'Sans titre'}</strong></label>
          <p>{done?'Envoyée en validation':`${r.data.transaction==='location'?'Location':'Vente'} · ${r.data.ville} · ${r.data.prix_fcfa} FCFA${r.data.transaction==='location'?' / mois':''}`}</p>
          {!done&&errors.length>0&&<ul className="sok-bulk-error">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul>}
          {!done&&<><details open={errors.length>0}><summary>Vérifier ou corriger les informations</summary><fieldset disabled={busy}><div className="sok-bulk-grid">{[...CORE_COLUMNS,...schema.fields(r.data.nature,r.data.transaction).map(c=>c.k)].filter((k,i,all)=>all.indexOf(k)===i).map(k=>{const c=schema.fields(r.data.nature,r.data.transaction).find(c=>c.k===k);const options=k==='transaction'?['vente','location']:k==='nature'?schema.natures:k==='pays'?schema.countries:c?.options;return <label key={k}>{c?.l||schema.labels[k]||k}{options?<select value={r.data[k]||''} onChange={e=>setRow(index,{data:{...r.data,[k]:e.target.value}})}><option value="">Choisir</option>{options.map(v=><option key={v}>{v}</option>)}</select>:k==='description'?<textarea rows={4} value={r.data[k]||''} onChange={e=>setRow(index,{data:{...r.data,[k]:e.target.value}})}/>:<input value={r.data[k]||''} onChange={e=>setRow(index,{data:{...r.data,[k]:e.target.value}})}/>}</label>;})}</div></fieldset></details>
          <label>Photos du bien (1 à 10, 8 Mo maximum chacune)<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{const files=[...e.target.files];if(files.reduce((sum,f)=>sum+f.size,0)+rows.reduce((sum,r)=>sum+r.photos.reduce((n,f)=>n+f.size,0),0)>200*1024*1024){setError("Limite de 200 Mo de photos par lot. Importez moins de biens à la fois.");}else if(files.length+r.photos.length>10||files.some(f=>f.size>8*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))){setError('Choisissez au maximum 10 photos JPG, PNG ou WebP de moins de 8 Mo pour ce bien.');}else{setError('');setRow(index,{photos:[...r.photos,...files]});}e.target.value='';}}/></label>
          {!r.photos.length&&<p>Ajoutez au moins une photo avant l’envoi.</p>}
          <div className="sok-bulk-photos">{r.photos.map((file,i)=><div key={i}><Photo file={file}/><small>{i===0?'Couverture':`Photo ${i+1}`}</small><button disabled={busy} onClick={()=>setRow(index,{photos:r.photos.filter((_,n)=>i!==n)})} aria-label={`Retirer la photo ${i+1} de ${r.data.reference}`}>Retirer</button>{i>0&&<button disabled={busy} onClick={()=>setRow(index,{photos:[file,...r.photos.filter((_,n)=>n!==i)]})}>Couverture</button>}</div>)}</div></>}
        </article>;})}
        <div className="sok-bulk-submit"><p>Les annonces sélectionnées seront soumises à Sokilé. Elles deviendront publiques après validation.</p><button disabled={busy||invalid||!selected.length||existing===null} onClick={send}>{busy?'Traitement en cours…':`Envoyer ${selected.length} annonce(s) en validation`}</button>{invalid&&<small>Corrigez les erreurs et ajoutez les photos, ou décochez les lignes à traiter plus tard.</small>}</div>
      </>}
    </div>
  </dialog>;
}

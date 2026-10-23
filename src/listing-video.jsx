import {useEffect, useRef, useState} from 'react';
import {VIDEO_ACCEPT, videoFileError, videoDurationError} from './listing-video.mjs';
import './listing-video.css';

export function ListingVideo({path, api, token, poster, onPlayed}) {
  const [url,setUrl]=useState(''), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const generation=useRef(0);
  useEffect(()=>{generation.current++;setUrl('');setError('');setBusy(false);return()=>{generation.current++;};},[path,token]);
  async function open(){const current=generation.current;setBusy(true);setError('');try{const next=await api.open(path,token);if(current===generation.current)setUrl(next);}catch(e){if(current===generation.current)setError(e.message);}finally{if(current===generation.current)setBusy(false);}}
  if(!path)return null;
  return <section className="sok-video" aria-label="Vidéo du bien">
    {url?<><video key={url} src={url} poster={poster} controls playsInline preload="none" onPlaying={onPlayed} onError={()=>{setUrl('');setError('Lecture impossible sur cet appareil. Réessayez ou consultez les photos.');}}/><button type="button" onClick={()=>setUrl('')}>Fermer la vidéo</button></>:<button type="button" disabled={busy} onClick={open}>{busy?'Chargement…':'▶ Voir la vidéo'}</button>}
    {error&&<p role="alert">{error}</p>}
  </section>;
}

export function ListingVideoEditor({value,onChange,disabled,api,token,onBusy}) {
  const [error,setError]=useState(''),[checking,setChecking]=useState(false),[preview,setPreview]=useState('');
  const generation=useRef(0);
  useEffect(()=>{if(!value?.file){setPreview('');return;}const url=URL.createObjectURL(value.file);setPreview(url);return()=>URL.revokeObjectURL(url);},[value?.file]);
  useEffect(()=>()=>{generation.current++;},[]);
  async function select(file){
    if(!file)return;
    const invalid=videoFileError(file);setError(invalid);if(invalid)return;
    const current=++generation.current;setChecking(true);onBusy?.(true);
    const video=document.createElement('video'),url=URL.createObjectURL(file);
    try {
      const duration=await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('La vidéo ne peut pas être lue. Exportez-la en MP4 compatible.')),15000);
        video.preload='metadata';video.onloadedmetadata=()=>{clearTimeout(timer);resolve(video.duration);};
        video.onerror=()=>{clearTimeout(timer);reject(Error('Format illisible sur cet appareil. Exportez la vidéo en MP4 compatible.'));};video.src=url;
      });
      const invalidDuration=videoDurationError(duration);if(invalidDuration)throw Error(invalidDuration);
      if(current===generation.current)onChange({file});
    }catch(e){if(current===generation.current)setError(e.message);}
    finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);if(current===generation.current){setChecking(false);onBusy?.(false);}}
  }
  return <section className="sok-video sok-video-editor">
    <label>Vidéo du bien · facultative<input type="file" accept={VIDEO_ACCEPT} disabled={disabled||checking} onChange={e=>{select(e.target.files?.[0]);e.target.value='';}}/></label>
    <p>1 vidéo · 2 minutes maximum · 50 Mo maximum · MP4, MOV ou WebM. Filmez en vertical ou en horizontal. Pour une lecture sur le plus grand nombre d’appareils, privilégiez un MP4 H.264.</p>
    {checking&&<p role="status">Vérification de la vidéo…</p>}
    {preview&&<video src={preview} controls playsInline preload="metadata"/>}
    {!preview&&value?.path&&<ListingVideo path={value.path} api={api} token={token}/>}
    {value&&<button type="button" disabled={disabled||checking} onClick={()=>{onChange(null);setError('');}}>Retirer la vidéo</button>}
    <p>La vidéo sera examinée avec votre annonce avant publication.</p>
    {error&&<p role="alert">{error}</p>}
  </section>;
}

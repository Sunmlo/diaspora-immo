import {useEffect,useRef,useState} from 'react';
import {DEMO_ADS,ROTATION_MS,nextAdIndex,previewHref} from './ad-preview.mjs';
import './ad-preview.css';

export function AdPreviewNotice({offer}){
  return <aside className="ad-demo-notice" aria-label="Mode aperçu publicitaire">
    <div><strong>Aperçu publicitaire · entreprises fictives</strong><p>Rotation de démonstration toutes les 8 secondes. Les achats restent fermés.</p></div>
    <nav aria-label="Emplacements à prévisualiser"><a href={previewHref('reach')}>Bannière d’accueil</a><a href={previewHref('visibility')}>Encart sous les pays</a><a href={previewHref('spotlight')}>Fiche mise en lumière</a><a className="ad-demo-exit" href={offer==='spotlight'?'/?tab=prestataires':'/'}>Quitter l’aperçu</a></nav>
  </aside>;
}

export function AdPreviewSlot({placement='banner'}){
  const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[interacting,setInteracting]=useState(false),[hovered,setHovered]=useState(false);
  const [visible,setVisible]=useState(false),[pageVisible,setPageVisible]=useState(true),[reduced,setReduced]=useState(false);
  const root=useRef(null);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion=()=>setReduced(media.matches),visibility=()=>setPageVisible(!document.hidden);
    motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
    const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:0.2});
    observer.observe(root.current);
    return()=>{observer.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  const playing=!paused&&!interacting&&!hovered&&visible&&pageVisible&&!reduced;
  useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setIndex(i=>nextAdIndex(i,DEMO_ADS.length)),ROTATION_MS);return()=>clearInterval(timer);},[playing]);
  const ad=DEMO_ADS[index],spotlight=placement==='spotlight';
  const id=spotlight?'apercu-fiche':placement==='compact'?'apercu-encart':'apercu-banniere';
  useEffect(()=>{if(window.location.hash!==`#${id}`)return;const frame=requestAnimationFrame(()=>root.current?.scrollIntoView({block:'start'}));return()=>cancelAnimationFrame(frame);},[id]);
  return <section id={id} ref={root} className={`ad-demo-slot ad-demo-${placement}`} aria-label={spotlight?'Aperçu de fiche mise en lumière':placement==='compact'?'Aperçu de l’encart sous les pays':'Aperçu de la bannière d’accueil'}
    onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setInteracting(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setInteracting(false);}}>
    <div className="ad-demo-label">{spotlight?'Fiche sponsorisée':'Publicité'} · Démonstration</div>
    <div className={`ad-demo-creative ad-demo-${ad.theme}`}>
      <div className="ad-demo-copy"><span className="ad-demo-brand">{ad.name} <small>· Exemple fictif</small></span><h2>{spotlight?ad.name:ad.title}</h2><p>{ad.text}</p><span className="ad-demo-cta">{spotlight?'Voir la fiche':'Découvrir'} <span aria-hidden="true">↗</span><small> Aperçu non cliquable</small></span></div>
      <div className="ad-demo-art" aria-hidden="true"><span className="ad-demo-sun"/><span className="ad-demo-building ad-demo-building-back"/><span className="ad-demo-building"/><span className="ad-demo-monogram">{ad.initials}</span></div>
    </div>
    <div className="ad-demo-controls"><span>Exemple {index+1} / {DEMO_ADS.length}</span><div><button type="button" onClick={()=>{setPaused(true);setIndex(i=>(i+DEMO_ADS.length-1)%DEMO_ADS.length);}}>Précédent</button><button type="button" onClick={()=>setPaused(v=>!v)} disabled={reduced}>{reduced?'Défilement manuel':paused?'Reprendre':'Pause'}</button><button type="button" onClick={()=>{setPaused(true);setIndex(i=>nextAdIndex(i,DEMO_ADS.length));}}>Suivant</button></div></div>
    <p className="ad-demo-help">{reduced?'Le défilement automatique est désactivé selon vos préférences d’accessibilité.':'8 secondes par exemple · pause au survol ou pendant la navigation au clavier.'} Aucun annonceur réel ni campagne active.</p>
  </section>;
}

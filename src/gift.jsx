import {useEffect,useRef,useState} from 'react';
import {countries,projects,moods,needs,pages} from './gift-data.mjs';
import {GUIDES} from './guides';
import {cleanGift,giftSimulation,giftTools,downloadBoard,GIFT_DRAFT} from './gift.mjs';
import {Simulateurs} from './simulations.jsx';
import './gift.css';
const blank={project:null,country:'',mood:null,need:null};
function pending(){try{return JSON.parse(sessionStorage.getItem(GIFT_DRAFT))||{}}catch{return {}}}
function draft(){const d=pending();return cleanGift(d.answers||d)||blank}
export function GiftBanner({account=false}){return <aside className="gift-banner"><div><span>Votre cadeau gratuit</span><h2>Mon futur chez-moi</h2><p>{account?'Retrouvez votre inspiration, vos guides et les simulations enregistrées.':'4 questions pour découvrir votre ambiance et recevoir les guides utiles à votre projet.'}</p></div><a href="/cadeau">{account?'Retrouver mon cadeau':'Découvrir mon cadeau gratuit'} →</a></aside>}
export function GiftPage({user,api,onSignup,onFindPro}){
 const [answers,setAnswers]=useState(draft),[step,setStep]=useState(()=>cleanGift(draft())?4:0),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(Boolean(user)),[error,setError]=useState(''),[notice,setNotice]=useState(''),[simOpen,setSimOpen]=useState(false),[simulation,setSimulation]=useState(null),[retry,setRetry]=useState(0);
 const userRef=useRef(user);userRef.current=user;
 const p=projects.find(p=>p.id===answers.project),m=moods.find(m=>m.id===answers.mood),need=p&&needs[p.mode].find(n=>n.id===answers.need);
 useEffect(()=>{
  let active=true;setSaved(false);setError('');setNotice('');setSimOpen(false);setSimulation(null);
  if(!user){setLoading(false);return}
  setLoading(true);
  (async()=>{
   const claiming=draft(),claim=cleanGift(claiming);let row;
   if(claim){row=await api.save(user,claim,pending().simulation);if(active)sessionStorage.removeItem(GIFT_DRAFT)}
   else {row=await api.load(user);if(!row&&cleanGift(user.gift_project))row=await api.save(user,cleanGift(user.gift_project),null)}
   if(!active)return;
   if(row&&cleanGift(row.answers)){setAnswers(cleanGift(row.answers));setStep(4);setSimulation(giftSimulation(row.answers,row.simulation));setSaved(true)}
  })().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[user?.id,retry]);
 const change=(key,value)=>{setAnswers(a=>({...a,[key]:value,...(key==='project'?{need:null}:{})}));setSaved(false);setNotice('');setError('');setSimulation(null)};
 const save=async()=>{
  if(!user){try{sessionStorage.setItem(GIFT_DRAFT,JSON.stringify({answers,simulation}))}catch{}onSignup(answers);return}
  const identity=user.id;setBusy(true);setError('');setNotice('');
  try{await api.save(user,answers,simulation);if(userRef.current?.id===identity){setSaved(true);setNotice('Votre cadeau et vos simulations sont enregistrés dans votre compte.')}}catch(e){if(userRef.current?.id===identity)setError(e.message)}finally{setBusy(false)}
 };
 const progress=<div className="sg-progress" aria-label={`Question ${step+1} sur 4`}>{[0,1,2,3].map(i=><span key={i} className={i<=step?'done':''}/>)}</div>;
 const nextDisabled=step===1?!answers.country:step===2?!answers.mood:!answers.need;
 const footer=<div className="sg-footer"><button className="sg-back" onClick={()=>setStep(s=>s-1)}>← Retour</button><button className="sg-primary" disabled={nextDisabled} onClick={()=>{setStep(s=>s+1);if(step===3)window.sokileAnalytics?.event('gift_preview')}}>{step===3?'Découvrir mon cadeau':'Continuer'} →</button></div>;
 const chosen=need?.guides.map(id=>GUIDES.find(g=>g.id===id))||[];
 return <div className="sok-gift"><div className="sg-app" style={{'--row':p?.kind==='flat'?'50%':p?.kind==='land'?'100%':'0%'}}><header><span className="sg-logo">MON FUTUR CHEZ-MOI</span><span className="sg-demo">Votre cadeau gratuit</span></header><main>
 {loading?<p role="status">Nous retrouvons votre cadeau…</p>:<>
 {error&&<div className="gift-error" role="alert">{error} <button className="sg-back" onClick={()=>user?setRetry(x=>x+1):setError('')}>Réessayer</button></div>}
 {notice&&<p role="status">{notice}</p>}
 {step<4&&progress}
 {step===0&&<><div className="sg-eyebrow">1 / 4 · Votre projet</div><h1>Votre prochain chapitre commence ici.</h1><p>Une planche d’inspiration et un ou deux guides PDF adaptés à votre projet.</p><div className="sg-options">{projects.map(x=><button key={x.id} className="sg-choice" onClick={()=>{change('project',x.id);setStep(1)}}><span><strong>{x.title}</strong><small>{x.sub}</small></span><span className="sg-arrow">→</span></button>)}</div><p className="sg-fine">4 questions courtes · Aucun budget à saisir · Compte gratuit pour récupérer le cadeau</p></>}
 {step===1&&<><div className="sg-eyebrow">2 / 4 · Votre destination</div><h1>Dans quel pays se situe votre projet ?</h1><label className="sg-label" htmlFor="gift-country">Pays recherché</label><select id="gift-country" value={answers.country} onChange={e=>change('country',e.target.value)}><option value="">Choisir un pays</option>{countries.map(c=><option key={c}>{c}</option>)}</select>{footer}</>}
 {step===2&&<><div className="sg-eyebrow">3 / 4 · Votre ambiance</div><h1>Quel univers vous ressemble ?</h1><div className="sg-moods">{moods.map(x=><button key={x.id} className="sg-mood" aria-pressed={answers.mood===x.id} onClick={()=>change('mood',x.id)}><div className="sg-photo" data-image={x.id} role="img" aria-label={`Inspiration ${p.title} : ${x.name}`}/><div className="sg-mood-text"><strong>{x.name}</strong><small>{x.desc}</small></div></button>)}</div><p className="sg-fine">Inspirations générées par IA, adaptées au type de bien.</p>{footer}</>}
 {step===3&&<><div className="sg-eyebrow">4 / 4 · Votre besoin</div><h1>Sur quoi avez-vous besoin d’aide ?</h1><p>Un seul choix pour sélectionner vos guides.</p><div className="sg-options">{needs[p.mode].map(n=><button key={n.id} className="sg-choice" aria-pressed={answers.need===n.id} onClick={()=>change('need',n.id)}><span><strong>{n.label}</strong><small>{n.sub}</small></span><span className="sg-arrow">{answers.need===n.id?'✓':'→'}</span></button>)}</div>{footer}</>}
 {step===4&&p&&m&&need&&<><div className="sg-eyebrow">{saved?'Votre cadeau est disponible':'Votre cadeau Sokilé'}</div><h1>De l’inspiration.<br/>Et de quoi avancer.</h1><div className="sg-board"><div className="sg-board-top"><h2>{m.title}</h2><div className="sg-chips"><span className="sg-chip">{answers.country}</span><span className="sg-chip">{p.tag}</span><span className="sg-chip">{m.name}</span></div></div><div className="sg-photo" data-image={m.id} role="img" aria-label={`${p.title} : ${m.name}`}/><div className="sg-caption">Inspiration générée par IA · Aucun bien disponible représenté</div><div className="sg-board-inside"><div className="sg-palette">{m.colors.map((c,i)=><div key={c}><div className="sg-swatch" style={{background:c}}/><small>{m.materials[i]}</small></div>)}</div><p>{m.text}</p>{p.kind==='land'&&<p>L’accès, l’usage possible et la constructibilité de votre terrain restent à vérifier localement.</p>}{saved&&<button className="sg-primary" onClick={()=>downloadBoard(answers).catch(e=>setError(e.message))}>Télécharger ma planche · PNG</button>}</div></div><div className="sg-gift-heading"><div className="sg-eyebrow">Inclus dans votre cadeau</div><h2>{chosen.length===1?'Votre guide sélectionné':'Vos deux guides sélectionnés'}</h2><p>{need.why}</p></div>{chosen.map((g,i)=><section className="sg-guide" key={g.id}><div className="sg-cover" aria-hidden="true"><span>SOKILÉ</span><strong>0{i+1}</strong><span>PDF</span></div><div><h3>{g.title}</h3><p>{pages[g.id]} pages · Guide pratique</p>{saved?<a className="sg-download" href={`/gifts/Sokile-guide-${g.id}.pdf`} download>Télécharger mon guide PDF →</a>:<span className="sg-fine">Inclus dans votre cadeau gratuit</span>}</div></section>)}
 {!saved&&<><button className="sg-primary sg-full" disabled={busy} onClick={save}>{busy?'Enregistrement…':user?'Enregistrer et récupérer mon cadeau':'Créer mon espace et récupérer mon cadeau'}</button>{!user&&<p className="sg-fine">Email et mot de passe · Déjà inscrit ? Connectez-vous dans la fenêtre suivante.</p>}</>}
 {saved&&<p className="sg-fine">Retrouvez ces téléchargements depuis Mon compte → Mon futur chez-moi.</p>}
 <section className="sg-signup"><div className="sg-eyebrow">Pour aller plus loin · Facultatif</div><h2>Et si on passait aux chiffres ?</h2><p>Les simulateurs Sokilé sont gratuits, même sans compte. Explorez votre budget à votre rythme.</p><button className="sg-back" onClick={()=>{setSimulation(s=>s||giftSimulation(answers));setSimOpen(v=>!v)}}>{simOpen?'Fermer les simulateurs':'Ouvrir mes simulateurs'} →</button></section>
 {simOpen&&<><Simulateurs state={simulation} setState={value=>{setSimulation(value);setNotice('')}} onFindPro={onFindPro} allowedTools={giftTools(answers)} hideLocalSave/>{user?<button className="sg-primary sg-full" disabled={busy} onClick={save}>{busy?'Enregistrement…':'Enregistrer mes simulations dans mon compte'}</button>:<p className="sg-fine">Créez votre espace pour conserver votre projet et vos simulations.</p>}</>}
 <div className="sg-footer"><button className="sg-back" onClick={()=>{setStep(0);setSaved(false);setSimOpen(false);setNotice('')}}>← Modifier mes réponses</button><a className="sg-back" href="/?tab=compte">Mon compte</a></div></>}
 </>}
 </main></div></div>
}

const VERSION='kobes-programmes-20261117-v3';
const API='https://nhyejaubfxjmmuvetayw.supabase.co/functions/v1/kobes-listing-review';
const seed=JSON.parse(document.querySelector('#programme-seed').textContent);
const form=document.querySelector('#reviewForm'),button=document.querySelector('#submit'),result=document.querySelector('#result');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let serial=0;
const options=(values,selected)=>values.map(([v,label])=>`<option value="${v}"${selected===v?' selected':''}>${label}</option>`).join('');
function input(id,key,label,value='',{type='text',area=false,max=250,attrs='',scope='program'}={}){
 const aid=id+'-'+key,data=`data-${scope}-field="${key}"`;
 return `<label for="${aid}">${label}${area?`<textarea id="${aid}" ${data} maxlength="${max}" rows="3">${esc(value)}</textarea>`:`<input id="${aid}" ${data} type="${type}" value="${esc(value)}" ${type==='number'?'':`maxlength="${max}"`} ${attrs}>`}</label>`;
}
function select(id,key,label,values,value,scope='program'){
 return `<label for="${id}-${key}">${label}<select id="${id}-${key}" data-${scope}-field="${key}">${options(values,value)}</select></label>`;
}
function typeRow(program,t={label:'',availability:'unknown',priceType:'unknown'}){
 const id=program+'-row-'+(++serial);
 const f=(key,label,opts={})=>input(id,key,label,t[key]??'',{scope:'type',...opts});
 return `<fieldset class="type-row"><legend>Type de logement</legend><div class="fields">${f('label','Typologie *',{max:150,attrs:'required placeholder="Ex. Appartement F3, villa 6 pièces…"'})}${select(id,'availability','Disponibilité',[['unknown','À confirmer'],['available','Disponible'],['reserved','Entièrement réservé'],['sold_out','Épuisé / vendu']],t.availability,'type')}${f('areaMin','Surface habitable minimale (m²)',{type:'number',attrs:'min="0.01" step="any" max="1000000000000"'})}${f('areaMax','Surface habitable maximale (m²)',{type:'number',attrs:'min="0.01" step="any" max="1000000000000"'})}${f('landMin','Terrain minimal, si concerné (m²)',{type:'number',attrs:'min="0.01" step="any" max="1000000000000"'})}${f('landMax','Terrain maximal, si concerné (m²)',{type:'number',attrs:'min="0.01" step="any" max="1000000000000"'})}${f('price','Prix par logement en FCFA',{type:'number',attrs:'min="1" step="1" max="1000000000000"'})}${select(id,'priceType','Précision du prix',[['unknown','À préciser'],['from','À partir de'],['exact','Prix fixe pour cette typologie']],t.priceType,'type')}${f('availableLots','Lots encore disponibles',{type:'number',attrs:'min="0" step="1" max="1000000" placeholder="Laisser vide si inconnu"'})}</div>${f('notes','Précisions sur les lots / surfaces / prix',{area:true,max:1500})}<button type="button" class="secondary remove-type">Retirer cette typologie</button></fieldset>`;
}
function render(d,index){
 const id=d.id;
 const f=(k,l,v='',opts={})=>input(id,k,l,v,opts);
 return `<details class="programme" data-id="${id}"${index===0?' open':''}><summary><span class="ref">${esc(id)}</span><span><strong>${esc(d.title)}</strong><small>${esc(d.location)}</small></span><span class="badge">À vérifier</span></summary><div class="programme-body"><div class="presentation"><img src="${esc(d.image_url)}" alt="${esc(d.title)}" loading="lazy"><div><p>${esc(d.description)}</p><p class="note">À préciser : ${esc(d.points)}</p><a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Voir votre présentation d’origine ↗</a></div></div><h2>1. Le programme</h2>${select(id,'status','Votre décision',[['pending','À vérifier plus tard'],['corrections','Enregistrer les compléments / corrections'],['approved','Programme disponible, je valide'],['unavailable','Plus de lots à proposer, retirer ce programme']],'pending')}<div class="fields">${f('title','Nom du programme *',d.title,{attrs:'required'})}${f('location','Ville et quartier *',d.location,{attrs:'required'})}${f('developer','Nom du promoteur (si connu)')}${f('totalUnits','Nombre total de logements du programme','',{type:'number',attrs:'min="1" step="1" max="1000000" placeholder="Laisser vide si inconnu"'})}${select(id,'stage','Avancement',[['unknown','À confirmer'],['planned','Sur plan / avant démarrage des travaux'],['under_construction','En cours de construction'],['delivered','Livré / neuf prêt à habiter']],'unknown')}${f('delivery','Livraison prévue ou effective','',{attrs:'placeholder="Ex. 2e trimestre 2027, livré en 2026…"'})}</div><p class="help">Le nombre total concerne l’ensemble du programme. Les lots encore en vente sont à indiquer par typologie ci-dessous. Pour un programme en plusieurs phases, précisez la phase commercialisée.</p>${f('description','Description du programme',d.description,{area:true,max:6000})}${f('equipment','Équipements et parties communes','',{area:true,max:3000,attrs:''})}<h2>2. Les types de logements et les lots</h2><p class="help">Une ligne par typologie : F2, F3, villa… Les libellés proposés sont à vérifier. Indiquez une fourchette de surfaces, ou la même valeur pour une surface unique. Laissez les chiffres inconnus vides.</p><div id="${id}-typologies" class="typologies">${d.types.map(t=>typeRow(id,{label:t,availability:'unknown',priceType:'unknown'})).join('')}</div><button type="button" class="secondary add-type">+ Ajouter une typologie</button><h2>3. Conditions et visuels</h2>${f('terms','Modalités de réservation / échéancier de paiement','',{area:true,max:3000})}${select(id,'mediaChoice','Visuel du programme',[['unconfirmed','À confirmer'],['confirmed','Je confirme le visuel présenté'],['replace','Je souhaite remplacer ou compléter les visuels'],['none','Retirer le visuel']],'unconfirmed')}${f('mediaLinks','Liens des nouvelles photos ou perspectives (HTTPS, un par ligne)','',{area:true,max:12000})}<div class="fields">${f('videoLink','Lien d’une vidéo du programme','',{type:'url',max:2000,attrs:'placeholder="https://…"'})}${f('brochureLink','Lien de la brochure / des plans','',{type:'url',max:2000,attrs:'placeholder="https://…"'})}</div>${f('notes','Autres corrections, phases ou précisions','',{area:true,max:3000})}</div></details>`;
}
document.querySelector('#programmes').innerHTML=seed.map(render).join('');
function touch(){button.disabled=false;result.textContent='';}
form.addEventListener('input',touch);
form.addEventListener('change',event=>{
 touch();if(event.target.dataset.programField==='status')event.target.closest('.programme').querySelector('.badge').textContent=({pending:'À vérifier',corrections:'À compléter',approved:'À valider',unavailable:'À retirer'})[event.target.value];
});
form.addEventListener('click',event=>{
 if(event.target.classList.contains('add-type')){
  const program=event.target.closest('.programme'),container=program.querySelector('.typologies');
  if(container.children.length>=30){result.textContent='Maximum : 30 typologies par programme.';return;}
  container.insertAdjacentHTML('beforeend',typeRow(program.dataset.id));container.lastElementChild.querySelector('input').focus();touch();
 }
 if(event.target.classList.contains('remove-type')){
  const row=event.target.closest('.type-row');
  if(row.parentElement.children.length<=1){result.textContent='Conservez au moins une typologie ; vous pouvez en modifier le nom.';return;}
  row.remove();touch();
 }
});
form.addEventListener('invalid',event=>{const details=event.target.closest('details');if(details)details.open=true;},true);
function values(root,scope){const out={};for(const el of root.querySelectorAll(`[data-${scope}-field]`)){const key=el.getAttribute(`data-${scope}-field`);out[key]=el.type==='number'?(el.value===''?null:Number(el.value)):el.value.trim();}return out;}
function locate(field){
 const m=/^(KOB-\d+)-type-(\d+)-(.+)$/.exec(field||'');
 if(m){const group=[...form.querySelectorAll('.programme')].find(p=>p.dataset.id===m[1]);const row=group?.querySelectorAll('.type-row')[Number(m[2])];return [...(row?.querySelectorAll('[data-type-field]')||[])].find(el=>el.dataset.typeField===m[3]);}
 return document.getElementById(field||'result');
}
let lastSignature='',requestId='';
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const entries=[...form.querySelectorAll('.programme')].map(p=>({id:p.dataset.id,...values(p,'program'),typologies:[...p.querySelectorAll('.type-row')].map(t=>values(t,'type'))}));
 const data={version:VERSION,consent:form.elements.consent.checked,contact:{name:form.elements.contactName.value.trim(),email:form.elements.contactEmail.value.trim(),phone:form.elements.contactPhone.value.trim()},entries};
 if(entries.every(e=>e.status==='pending')){result.textContent='Choisissez votre décision pour au moins un programme.';return;}
 const signature=JSON.stringify(data);if(signature!==lastSignature){requestId=crypto.randomUUID();lastSignature=signature;}
 button.disabled=true;result.textContent='Enregistrement de votre retour…';
 const token=new URLSearchParams(location.hash.slice(1)).get('cle');
 try{
  const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','X-Review-Token':token},body:JSON.stringify({...data,id:requestId}),signal:AbortSignal.timeout(30000)});
  const saved=await response.json();
  if(!response.ok||!saved.saved){const target=locate(saved.field);if(target){const details=target.closest('details');if(details)details.open=true;target.scrollIntoView({block:'center',behavior:'smooth'});target.focus();}throw Error(saved.error||'L’enregistrement n’a pas pu être confirmé.');}
  result.textContent='Merci ! Votre retour sur les programmes neufs a bien été enregistré. Référence : '+saved.reference+'. Sokilé vérifiera les informations avant publication.';
  result.scrollIntoView({behavior:'smooth',block:'center'});
 }catch(error){result.textContent=(error.name==='TimeoutError'?'Connexion interrompue : réessayez avec les mêmes réponses.':error.message)+' Vos réponses restent dans le formulaire.';button.disabled=false;}
});

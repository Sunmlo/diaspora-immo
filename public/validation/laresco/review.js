const endpoint='https://nhyejaubfxjmmuvetayw.supabase.co/functions/v1/laresco-listing-review';
const token=new URLSearchParams(location.hash.slice(1)).get('cle')||'';
const $=s=>document.querySelector(s),form=$('#form'),cards=$('#cards'),result=$('#result');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={pending:'À vérifier de notre côté',approved:'Disponible — je valide',corrections:'Disponible — à corriger',unavailable:'Indisponible — ne pas publier'};
const key='sokile-laresco-draft-'+token.slice(-16);
const field=(i,k)=>form.elements.namedItem(i+'-'+k);
const inp=(i,k,label,value,type='text',extra='')=>`<label for="${i}-${k}">${label}<input id="${i}-${k}" name="${i}-${k}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const select=(i,k,label,items,value)=>`<label for="${i}-${k}">${label}<select id="${i}-${k}" name="${i}-${k}">${items.map(([v,t])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
const area=(i,k,label,value,max=3000)=>`<label class="full" for="${i}-${k}">${label}<textarea id="${i}-${k}" name="${i}-${k}" maxlength="${max}">${esc(value)}</textarea></label>`;
let listings=[],version='',requestId=null,lastBody=null;
$('#finish').addEventListener('click',()=>$('#retour').scrollIntoView({behavior:'smooth',block:'start'}));
form.addEventListener('invalid',e=>{const details=e.target.closest('details');if(details)details.open=true;},true);
function serialize(){return Object.fromEntries([...form.elements].filter(e=>e.name).map(e=>[e.name,e.value]));}
function update(){const count=listings.filter((d,i)=>field(i,'status').value!=='pending').length;$('#progress').textContent=count+' / '+listings.length+' fiches vérifiées';try{localStorage.setItem(key,JSON.stringify(serialize()));}catch{}result.textContent='';}
try{
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('Ouvrez le lien complet transmis par Sokilé. Aucun compte ChatGPT n’est nécessaire.');
 const r=await fetch(endpoint,{headers:{'X-Review-Token':token},cache:'no-store'}),data=await r.json();if(!r.ok)throw Error(data.error||'Dossier indisponible.');
 listings=data.listings;version=data.version;if(!Array.isArray(listings)||!listings.length)throw Error('Dossier indisponible. Contactez Sokilé.');
 $('#count').textContent=listings.length;
 listings.forEach((d,i)=>{
 const article=document.createElement('article');article.className='card';
 article.innerHTML=`<div class="head"><div class="eyebrow">${esc(d.id)} · ${esc(d.country)} · Location</div><h2>${esc(d.title)}</h2><p class="location">${esc(d.location)}</p><div class="features">${d.area!==null?`<span>${d.area.toLocaleString('fr-FR')} m²</span>`:''}${d.bedrooms!==null?`<span>${d.bedrooms} chambres</span>`:''}<span>${d.price!==null?d.price.toLocaleString('fr-FR')+' FCFA / mois':'Loyer non communiqué'}</span></div></div>${d.images.length?`<div class="gallery">${d.images.map((url,j)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${esc(url)}" alt="${esc(d.title)} — photo ${j+1}"></a>`).join('')}</div><p class="gallery-note">${d.images.length} visuels issus de votre publication. Faites défiler pour les consulter, puis confirmez leur correspondance avec le bien.</p>`:`<div class="placeholder"><svg viewBox="0 0 64 64" width="45" height="45" aria-hidden="true"><path d="M8 31L32 12l24 19M15 27v27h34V27M27 54V38h10v16" fill="none" stroke="currentColor" stroke-width="2"/></svg><strong>Photo du bien non communiquée</strong><span>Vous pouvez valider sans photo ou nous en transmettre une.</span></div>`}<div class="body"><p class="desc">${esc(d.description)}</p><a class="source" href="${esc(d.source_url)}" target="_blank" rel="noopener noreferrer">Consulter la publication source ↗</a>${d.illustrationExcluded?'<p class="source-info">Le visuel illustratif n’a pas été repris comme photo du bien.</p>':''}${d.videoNote?`<p class="source-info">${esc(d.videoNote)}</p>`:''}<details><summary>Modifier ou compléter les informations</summary><p class="source-info">${esc(d.reviewNote)}</p><div class="fields">${inp(i,'title','Titre',d.title,'text','required maxlength="250"')}${inp(i,'location','Ville et quartier',d.location,'text','required maxlength="250"')}${inp(i,'price','Loyer mensuel en FCFA (XAF)',d.price,'number','min="1" max="1000000000000" step="1" placeholder="Non communiqué"')}${inp(i,'area','Surface en m²',d.area,'number','min="1" max="1000000000000" step="any"')}${inp(i,'bedrooms','Nombre de chambres',d.bedrooms,'number','min="0" max="1000" step="1"')}${inp(i,'bathrooms','Nombre de salles d’eau',d.bathrooms,'number','min="0" max="1000" step="1"')}${area(i,'description','Description',d.description,6000)}${area(i,'notes','Précisions, corrections ou modalités de transmission des photos','')}${area(i,'mediaLinks','Liens HTTPS des photos (un lien par ligne)','',12000)}${inp(i,'videoLink','Lien HTTPS d’une vidéo (facultatif)','','url','maxlength="2000"')}</div></details><div class="review fields">${select(i,'status','Votre choix pour cette fiche',Object.entries(labels),'pending')}${select(i,'mediaChoice','Photos à utiliser',[...(d.images.length?[['confirmed','Je confirme les photos affichées']]:[]),['none','Publier sans photo du bien'],['replace','Je fournis / corrige les photos']],d.images.length?'confirmed':'none')}</div></div>`;
 cards.append(article);
 });
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved)for(const [k,v] of Object.entries(saved)){const el=form.elements.namedItem(k);if(el)el.value=String(v);}}catch{}
 $('#loading').hidden=true;form.hidden=false;$('#sticky').hidden=false;form.addEventListener('input',update);update();
}catch(e){$('#loading').textContent=e.message||'Connexion interrompue. Rechargez la page.';}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();$(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});}));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const entries=listings.map((d,i)=>{const o={id:d.id};for(const k of ['title','location','description','notes','mediaLinks','videoLink','status','mediaChoice'])o[k]=field(i,k).value.trim();for(const k of ['price','area','bedrooms','bathrooms'])o[k]=field(i,k).value===''?null:Number(field(i,k).value);return o;});
 const payload={version,consent:$('#consent').checked,contact:{name:form.elements.contactName.value.trim(),email:form.elements.contactEmail.value.trim(),phone:form.elements.contactPhone.value.trim()},entries};
 const body=JSON.stringify(payload);if(body!==lastBody){requestId=crypto.randomUUID();lastBody=body;}
 $('#send').disabled=true;result.textContent='Enregistrement de vos vérifications…';
 try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Review-Token':token},body:JSON.stringify({id:requestId,...payload})}),data=await r.json();if(!r.ok||!data.saved)throw Error(data.error||'Enregistrement non confirmé.');result.textContent='Merci ! Votre retour a bien été enregistré. Référence : '+data.reference+'. Sokilé vérifiera les fiches validées avant publication.';try{localStorage.removeItem(key);}catch{}}
 catch(e){result.textContent=e.message+' Vos réponses restent affichées ; vous pouvez réessayer.';}
 finally{$('#send').disabled=false;}
});

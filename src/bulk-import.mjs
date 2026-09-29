export const MAX_IMPORT_ROWS=50;
export const CORE_COLUMNS=['reference','transaction','nature','titre','pays','ville','quartier','prix_fcfa','surface_m2','description','equipements'];
export function parseCSV(text){
  text=String(text).replace(/^\uFEFF/,'');
  const first=text.split(/\r?\n/,1)[0];const delimiter=first.includes(';')?';':first.includes('\t')?'\t':',';
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||cell===''){quoted=!quoted;}else throw Error('Guillemet mal placé dans le fichier CSV.');}
    else if(ch===delimiter&&!quoted){row.push(cell);cell='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
    else cell+=ch;
  }
  if(quoted)throw Error('Une cellule CSV contient des guillemets non fermés.');
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  return rows;
}
export const keyOf=value=>String(value??'').normalize('NFKC').trim().toLocaleLowerCase('fr');
export function matrixToRows(matrix,allowed){
  const lines=matrix.filter(row=>row.some(v=>String(v??'').trim()!==''));
  if(!lines.length)throw Error('Le fichier est vide.');
  const headers=lines.shift().map(v=>String(v??'').trim());
  if(new Set(headers).size!==headers.length)throw Error('Des colonnes portent le même nom.');
  const unknown=headers.filter(h=>!allowed.includes(h));if(unknown.length)throw Error('Colonnes inconnues : '+unknown.join(', ')+'. Utilisez le modèle Sokilé.');
  const required=['reference','transaction','nature','titre','pays','ville','prix_fcfa','description'];
  const missing=required.filter(h=>!headers.includes(h));if(missing.length)throw Error('Colonnes manquantes : '+missing.join(', '));
  if(!lines.length)throw Error('Ajoutez vos annonces dans la première feuille du modèle.');
  if(lines.length>MAX_IMPORT_ROWS)throw Error(`Importez au maximum ${MAX_IMPORT_ROWS} annonces à la fois.`);
  return lines.map((line,index)=>{if(line.length>headers.length)throw Error(`Ligne ${index+2} : trop de colonnes.`);return Object.fromEntries(headers.map((h,i)=>[h,String(line[i]??'').trim()]));});
}
function number(value){const raw=String(value??'').trim();return raw===''?null:Number(raw.replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));}
export function validateRow(row,{countries,fields,natures},allRows=[],existing=[]){
  const errors=[];const ref=keyOf(row.reference);
  for(const k of ['reference','transaction','nature','titre','pays','ville','prix_fcfa','description'])if(!row[k])errors.push(`${k} : obligatoire`);
  if(/^EXEMPLE-/i.test(row.reference||''))errors.push('Remplacez les références et données d’exemple par vos vrais biens');
  if(ref&&!/^[a-z0-9_-]{1,60}$/i.test(row.reference))errors.push('Référence : 1 à 60 lettres, chiffres, tirets ou underscores');
  if(!['vente','location'].includes(row.transaction))errors.push('Transaction : vente ou location');
  if(!natures.includes(row.nature))errors.push('Nature du bien inconnue');
  if(!countries.includes(row.pays))errors.push('Pays non pris en charge');
  if(!(number(row.prix_fcfa)>0)||!Number.isFinite(number(row.prix_fcfa)))errors.push('Prix FCFA : nombre supérieur à zéro');
  if(row.surface_m2&&(!(number(row.surface_m2)>0)||!Number.isFinite(number(row.surface_m2))))errors.push('Surface : nombre supérieur à zéro');
  if((row.description||'').length<30)errors.push('Description : au moins 30 caractères');
  if((row.description||'').length>10000||(row.titre||'').length>200)errors.push('Titre ou description trop long');
  for(const c of fields(row.nature,row.transaction)){
    const v=row[c.k];if(c.requis&&!v)errors.push(`${c.l} : obligatoire`);
    if(v&&c.t==='nombre'&&(!Number.isFinite(number(v))||number(v)<0))errors.push(`${c.l} : nombre positif ou nul`);
    if(v&&c.options&&!c.options.includes(v))errors.push(`${c.l} : choisissez ${c.options.join(' / ')}`);
  }
  if(ref&&allRows.filter(r=>keyOf(r.reference)===ref).length>1)errors.push('Référence répétée dans le fichier');
  if(existing.some(p=>keyOf(p.details?.import_reference)===ref&&ref))errors.push('Référence déjà présente dans vos annonces');
  if(allRows.filter(p=>keyOf(p.titre)===keyOf(row.titre)&&keyOf(p.ville)===keyOf(row.ville)&&keyOf(p.pays)===keyOf(row.pays)).length>1)errors.push('Doublon possible dans le fichier : même titre, ville et pays');
  if(existing.some(p=>keyOf(p.title)===keyOf(row.titre)&&keyOf(p.city)===keyOf(row.ville)&&keyOf(p.country)===keyOf(row.pays)))errors.push('Doublon possible : même titre, ville et pays dans vos annonces');
  return errors;
}
export function rowPayload(row,user,photos,schema){
  const details=Object.fromEntries(schema.fields(row.nature,row.transaction).filter(c=>row[c.k]).map(c=>[c.k,c.t==='nombre'?number(row[c.k]):row[c.k]]));
  return {owner_id:user.id,user_email:user.email,user_name:user.name||user.agency,user_phone:user.phone,agency_name:user.agency||user.name,advertiser_type:'pro',title:row.titre,type:row.transaction==='location'?'Location':'Vente',transaction:row.transaction,nature:row.nature,country:row.pays,city:row.ville,neighborhood:row.quartier||'',price:number(row.prix_fcfa),price_eur:Math.round(number(row.prix_fcfa)/655.957),surface:number(row.surface_m2),description:row.description,tags:(row.equipements||'').split('|').map(s=>s.trim()).filter(Boolean),details:{...details,import_reference:row.reference},photos,status:'en_attente',active:false,verified:false,moderation_note:null,motif_rejet:null};
}
export async function ownListings(read,user){
  const rows=[];
  for(let offset=0;;offset+=100){
    const r=await read('properties',`select=id,title,city,country,details&owner_id=eq.${encodeURIComponent(user.id)}&order=id.asc&limit=100&offset=${offset}`,user.token);
    if(!r.ok||!Array.isArray(r.data))throw Error('Impossible de vérifier vos annonces existantes. Réessayez avant tout envoi.');
    rows.push(...r.data);if(r.data.length<100)return rows;
  }
}

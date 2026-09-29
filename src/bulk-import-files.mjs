import {CORE_COLUMNS,parseCSV,matrixToRows} from './bulk-import.mjs';
const excel=async()=>{const m=await import('exceljs');return m.default||m;};
export async function readImportFile(file,columns){
  if(file.size>2*1024*1024)throw Error('Le fichier doit faire moins de 2 Mo (photos à ajouter séparément).');
  if(/\.csv$/i.test(file.name))return matrixToRows(parseCSV(await file.text()),columns);
  if(!/\.xlsx$/i.test(file.name))throw Error('Choisissez un fichier .xlsx ou .csv.');
  const Excel=await excel();const book=new Excel.Workbook();await book.xlsx.load(await file.arrayBuffer());
  const sheet=book.worksheets[0];if(!sheet)throw Error('Aucune feuille dans ce fichier.');
  if(sheet.rowCount>1000||sheet.columnCount>200)throw Error('Le tableau dépasse les limites du modèle.');
  const matrix=[];sheet.eachRow(row=>{const cells=[];for(let i=1;i<=sheet.columnCount;i++){const value=row.getCell(i).value;if(value!==null&&typeof value==='object')throw Error('Utilisez des valeurs simples : aucune formule, image ou lien dans les cellules.');cells.push(value??'');}matrix.push(cells);});
  return matrixToRows(matrix,columns);
}
export async function templateWorkbook(schema){
  const Excel=await excel(),book=new Excel.Workbook();
  const templateColumns=[...CORE_COLUMNS,...schema.detailFields.filter(c=>c.requis||['charges_loc','caution','avance','frais_agence','disponibilite','negociable','documents_vente','repere'].includes(c.k)).map(c=>c.k)];
  const sheet=book.addWorksheet('Mes annonces');sheet.addRow(templateColumns);sheet.views=[{state:'frozen',ySplit:1}];
  sheet.columns.forEach((col,i)=>{col.width=i===9?55:23;});sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1A3C2E'}};
  const guide=book.addWorksheet('Mode d’emploi');
  guide.addRows([
    ['Import gratuit Sokilé — 50 annonces maximum par fichier'],
    ['Renseignez uniquement la première feuille. Ne changez pas les en-têtes.'],
    ['Les champs facultatifs supplémentaires peuvent être complétés dans l’aperçu avant l’envoi.'],
    ['Une référence unique par bien et par agence. Aucune annonce existante n’est remplacée.'],
    ['Prix en FCFA. Pour une location : loyer mensuel. Pas de formule dans les cellules.'],
    ['Les photos sont ajoutées après lecture du fichier, avant l’envoi en validation.'],
    ['Les exemples ci-dessous sont fictifs : ne les importez pas tels quels.'],
    ['Champs obligatoires : reference, transaction, nature, titre, pays, ville, prix_fcfa, description.'],
    ['Nature',schema.natures.join(', ')],['Pays',schema.countries.join(', ')],
    ['Équipements','Séparez les équipements avec |, par exemple Parking|Climatisation'],
    ['Colonne','Signification / valeurs'],...CORE_COLUMNS.map(k=>[k,{reference:'Votre référence interne (lettres, chiffres, - ou _)',transaction:'vente ou location',titre:'Titre de 200 caractères maximum',description:'30 à 10 000 caractères',prix_fcfa:'Nombre positif, sans devise',surface_m2:'Surface habitable ou utile en m²',quartier:'Quartier ou secteur, sans adresse exacte'}[k]||k]),
    ...schema.detailFields.map(c=>[c.k,c.l+(c.options?' : '+c.options.join(' / '):'')]),
    ['Champs requis selon le bien'],...schema.natures.flatMap(n=>['vente','location'].map(t=>[n+' · '+t,schema.fields(n,t).filter(c=>c.requis).map(c=>c.k).join(', ')||'Aucun champ supplémentaire obligatoire']))
  ]);guide.getColumn(1).width=45;guide.getColumn(2).width=95;guide.eachRow(r=>r.alignment={wrapText:true,vertical:'top'});
  const examples=book.addWorksheet('Exemples fictifs');examples.addRow(schema.columns);
  for(const transaction of ['vente','location']){const r={reference:transaction==='vente'?'EXEMPLE-V01':'EXEMPLE-L01',transaction,nature:'appartement',titre:'EXEMPLE À REMPLACER — appartement 3 pièces',pays:'Sénégal',ville:'Dakar',quartier:'À compléter',prix_fcfa:transaction==='vente'?40000000:200000,surface_m2:75,description:'Exemple fictif : décrivez ici les pièces, l’état, les équipements et les atouts de votre bien.',pieces:3,chambres:2,meuble:transaction==='location'?'Non meublé':''};examples.addRow(schema.columns.map(k=>r[k]??''));}
  return book;
}
export async function downloadTemplate(schema){
  const book=await templateWorkbook(schema);
  const data=await book.xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download='Sokile-modele-import-annonces.xlsx';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

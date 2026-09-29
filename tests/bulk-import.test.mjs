import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,matrixToRows,CORE_COLUMNS,validateRow,rowPayload,ownListings} from '../src/bulk-import.mjs';
import {readImportFile,templateWorkbook} from '../src/bulk-import-files.mjs';
const fields=[{k:'pieces',l:'Pièces',t:'nombre',requis:true},{k:'meuble',l:'Meublé',t:'choix',options:['Meublé','Non meublé']}];
const schema={columns:[...CORE_COLUMNS,...fields.map(x=>x.k)],natures:['appartement'],countries:['Sénégal'],detailFields:fields,fields:()=>fields};
const row={reference:'AG-01',transaction:'location',nature:'appartement',titre:'Appartement test',pays:'Sénégal',ville:'Dakar',prix_fcfa:'200 000',description:'Appartement avec balcon, deux chambres et parking.',pieces:'3',meuble:'Meublé'};
test('CSV handles BOM, quoted separators, newlines and escaped quotes',()=>{
 assert.deepEqual(parseCSV('\uFEFFtitre;description\r\n"Bien; Dakar";"Deux lignes\navec ""balcon"""'),[['titre','description'],['Bien; Dakar','Deux lignes\navec "balcon"']]);
 assert.throws(()=>parseCSV('a;b\n"x;y'),/guillemets/);
});
test('File rejects duplicate/unknown columns and excessive batches',()=>{
 assert.throws(()=>matrixToRows([['reference','reference']],CORE_COLUMNS),/même nom/);
 assert.throws(()=>matrixToRows([['status']],CORE_COLUMNS),/inconnues/);
 assert.throws(()=>matrixToRows([CORE_COLUMNS,...Array.from({length:51},()=>['AG'])],CORE_COLUMNS),/50/);
});
test('Validation distinguishes invalid values, references, possible duplicates and sample data',()=>{
 assert.deepEqual(validateRow(row,schema,[row],[]),[]);
 assert.ok(validateRow({...row,prix_fcfa:'NaN',pieces:'-1'},schema).length>=2);
 assert.ok(validateRow({...row,reference:'EXEMPLE-V01'},schema).some(x=>x.includes('exemple')));
 assert.ok(validateRow(row,schema,[row,{...row,reference:'AG-02'}]).some(x=>x.includes('Doublon')));
 assert.ok(validateRow(row,schema,[row],[{details:{import_reference:'ag-01'}}]).some(x=>x.includes('déjà')));
});
test('Imported payload cannot override ownership, moderation or visibility',()=>{
 const p=rowPayload({...row,owner_id:'attacker',status:'validee',active:true},{id:'owner',email:'owner@example.com',name:'Owner',phone:'+221771234567'},['https://example.com/photo.jpg'],schema);
 assert.equal(p.owner_id,'owner');assert.equal(p.status,'en_attente');assert.equal(p.active,false);assert.equal(p.verified,false);assert.equal(p.price,200000);assert.equal(p.details.import_reference,'AG-01');assert.deepEqual(p.photos,['https://example.com/photo.jpg']);
});
test('Duplicate check paginates and fails closed if account read fails',async()=>{
 let calls=0;const list=await ownListings(async()=>({ok:true,data:++calls===1?Array.from({length:100},(_,id)=>({id})):[]}),{id:'owner',token:'token'});assert.equal(list.length,100);assert.equal(calls,2);
 await assert.rejects(ownListings(async()=>({ok:false}),{id:'owner'}),/Impossible/);
});
test('Excel template contains instructions and separate examples; real sheet round-trips',async()=>{
 const book=await templateWorkbook(schema);assert.equal(book.worksheets[0].name,'Mes annonces');assert.equal(book.worksheets[0].rowCount,1);assert.ok(book.getWorksheet('Mode d’emploi'));assert.equal(book.getWorksheet('Exemples fictifs').rowCount,3);
 const columns=book.worksheets[0].getRow(1).values.slice(1);book.worksheets[0].addRow(columns.map(k=>row[k]||''));const buffer=await book.xlsx.writeBuffer();
 const result=await readImportFile({name:'annonces.xlsx',size:buffer.byteLength,arrayBuffer:async()=>buffer},schema.columns);assert.equal(result.length,1);assert.equal(result[0].reference,'AG-01');assert.equal(result[0].pieces,'3');
 book.worksheets[0].getCell('H2').value={formula:'1+1',result:2};const bad=await book.xlsx.writeBuffer();await assert.rejects(readImportFile({name:'annonces.xlsx',size:bad.byteLength,arrayBuffer:async()=>bad},schema.columns),/aucune formule/);
});

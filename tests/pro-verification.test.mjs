import test from 'node:test';
import assert from 'node:assert/strict';
import {RULES,COUNTRIES,ACTIVITIES,ruleFor,dossierError,verificationValid} from '../src/pro-regulations.mjs';
test('twelve distinct countries and all activities have explicit requirements',()=>{
 assert.equal(COUNTRIES.length,12);assert.equal(new Set(COUNTRIES).size,12);assert.equal(RULES.length,12*Object.keys(ACTIVITIES).length);
 for(const r of RULES){assert.ok(r.docs.length>=2);assert.equal(new Set(r.docs.map(d=>d.code)).size,r.docs.length);if(r.status==='confirmed')assert.ok(r.sources.length);else assert.ok(!r.docs.some(d=>d.code==='scope'));}
 assert.equal(ruleFor('RD Congo','agence'),null);assert.equal(ruleFor('France','agence'),null);
});
test('country and activity change the documents without inventing an exemption',()=>{
 assert.ok(ruleFor('Cameroun','agence').docs.some(d=>d.code==='card'));assert.ok(!ruleFor('Cameroun','promoteur').docs.some(d=>d.code==='card'));
 assert.ok(ruleFor('Congo','agence').docs.some(d=>d.code==='trader_card'));assert.equal(ruleFor('Tchad','agence').status,'review');
});
test('submission checks documents, consent and dates; badge expires',()=>{
 const r=ruleFor('Cameroun','promoteur'),documents=Object.fromEntries(r.docs.map(d=>[d.code,{path:'owner/document.pdf',reference:'REF',issuer:'Ministry',no_expiry:true}]));
 const d={business_name:'Company',representative_name:'Representative',registration_number:'REG',documents,consent:true};
 assert.equal(dossierError(d,r),'');assert.ok(dossierError({...d,consent:false},r));assert.ok(dossierError({...d,documents:{}},r));
 assert.ok(dossierError({...d,documents:{...documents,approval:{...documents.approval,no_expiry:false,expires_on:'2020-01-01'}}},r));
 assert.equal(verificationValid({status:'verified',valid_until:'2020-01-01'}),false);assert.equal(verificationValid({status:'en_attente',valid_until:'2099-01-01'}),false);
});

test('Gabon distinguishes agent and broker; unresolved regimes do not demand an official letter',()=>{
 assert.ok(ruleFor('Gabon','agence').docs.some(d=>d.code==='guarantee'));
 assert.ok(!ruleFor('Gabon','courtier').docs.some(d=>d.code==='guarantee'));
 assert.ok(ruleFor('Gabon','courtier').docs.some(d=>d.code==='authorization'));
 assert.deepEqual(ruleFor('Togo','agence').docs.filter(d=>d.required!==false).map(d=>d.code),['registration','representation']);
 assert.equal(ruleFor('Niger','promoteur').status,'review');
 assert.ok(ruleFor('Niger','promoteur').sources.length);
});

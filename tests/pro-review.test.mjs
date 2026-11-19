import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanReviewDraft,reviewDraftError,invitationStatus} from '../src/pro-review.mjs';

test('prefill keeps only explicitly editable fields',()=>{
 const draft=cleanReviewDraft({business_name:' Kobes ',country:' Cameroun ',description:'Programmes neufs',phone:'+237 650 000 000',website:'https://example.com',owner_id:'another-owner',status:'validee'});
 assert.equal(draft.business_name,'Kobes');
 assert.equal(draft.country,'Cameroun');
 assert.equal(draft.owner_id,undefined);
 assert.equal(draft.status,undefined);
});
test('reject invalid values and field overflow',()=>{
 assert.throws(()=>cleanReviewDraft({business_name:{x:1}}));
 assert.throws(()=>cleanReviewDraft({description:'x'.repeat(2001)}));
 assert.throws(()=>cleanReviewDraft(null));
});
test('final submit requires minimum description, country and business name',()=>{
 assert.match(reviewDraftError(cleanReviewDraft({business_name:'Kobes'})),/Complétez/);
 assert.equal(reviewDraftError(cleanReviewDraft({business_name:'Kobes',country:'Cameroun',description:'Programmes neufs'})),'');
 assert.match(reviewDraftError(cleanReviewDraft({business_name:'Kobes',country:'Cameroun',description:'Programmes neufs',website:'javascript:alert(1)'})),/https/);
});
test('invitation expiry, revocation and submission are distinct',()=>{
 const date='2026-11-26T00:00:00Z';
 assert.equal(invitationStatus({status:'pending',expires_at:date},Date.parse('2026-11-25T00:00:00Z')),'pending');
 assert.equal(invitationStatus({status:'pending',expires_at:date},Date.parse('2026-11-27T00:00:00Z')),'expired');
 assert.equal(invitationStatus({status:'submitted',expires_at:date},Date.parse('2026-11-27T00:00:00Z')),'submitted');
 assert.equal(invitationStatus({status:'revoked',expires_at:date}),'revoked');
});

test('a bundle of ten properties stays intact and excludes unsafe extra fields',()=>{
 const rows=Array.from({length:10},(_,i)=>({reference:'EB-'+(i+1),title:'Annonce '+(i+1),transaction:'Vente',location:'Abidjan',price:'100 FCFA',status:'a_confirmer',questions:'Prix à vérifier',source_url:'https://ebeneimmobilier.com/bien/test',owner_id:'forbidden'}));
 const draft=cleanReviewDraft({business_name:'Ébène',country:'Côte d’Ivoire',description:'Agence immobilière',listings:rows});
 assert.equal(draft.listings.length,10);
 assert.equal(draft.listings[0].owner_id,undefined);
 assert.match(reviewDraftError(draft),/situation de chaque bien/);
 draft.listings.forEach(row=>row.status='disponible');
 assert.equal(reviewDraftError(draft),'');
 draft.listings[0].status='a_corriger';
 assert.match(reviewDraftError(draft),/corrections nécessaires/);
 draft.listings[0].comment='Le prix doit être corrigé.';
 assert.equal(reviewDraftError(draft),'');
});
test('invalid duplicate or unsafe property URLs are blocked',()=>{
 const base={reference:'EB-01',title:'Villa',source_url:'https://ebeneimmobilier.com/bien/test'};
 assert.throws(()=>cleanReviewDraft({business_name:'E',listings:[base,base]}),/doublon/);
 assert.throws(()=>cleanReviewDraft({business_name:'E',listings:[{...base,source_url:'javascript:alert(1)'}]}),/invalide/);
 assert.throws(()=>cleanReviewDraft({business_name:'E',listings:Array(51).fill(base)}),/incorrect/);
});

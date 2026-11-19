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

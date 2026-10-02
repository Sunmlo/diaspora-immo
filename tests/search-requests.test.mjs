import test from 'node:test';
import assert from 'node:assert/strict';
import {requestFilters,requestMatches} from '../src/search-requests.mjs';
test('search form validates criteria and matches cities without accent or case differences',()=>{
 const form={country:'Cameroun',city:' Douala ',transaction:'location',nature:'appartement',budget:'300000',rooms:'3'};
 const f=requestFilters(form);assert.equal(f.city,'Douala');assert.equal(f.priceMax,457);
 const p={...f,city:'DOUALA',price_eur:450,rooms:3};assert.equal(requestMatches(f,p),true);
 for(const change of [{city:'Yaoundé'},{country:'Sénégal'},{price_eur:500},{rooms:2}])assert.equal(requestMatches(f,{...p,...change}),false);
 for(const change of [{city:'mail@example.com'},{budget:0},{budget:1},{rooms:'10'},{country:'France'}])assert.throws(()=>requestFilters({...form,...change}));
});

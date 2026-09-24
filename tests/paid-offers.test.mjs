import test from 'node:test';
import assert from 'node:assert/strict';
import {PAID_SERVICES,offerPrice} from '../src/paid-offers.mjs';
test('published preview stays closed and quotes the agreed durations',()=>{
  assert.equal(PAID_SERVICES.status,'not_open');
  for(const [id,monthly,quarter] of [['spotlight',10000,27000],['visibility',25000,67500],['reach',50000,135000]]){
    assert.equal(offerPrice(id,30),monthly);
    assert.equal(offerPrice(id,90),quarter);
  }
  assert.throws(()=>offerPrice('reach',0));
  assert.throws(()=>offerPrice('unknown',30));
});

import {nextAdIndex,previewOffer,previewHref,ROTATION_MS} from '../src/ad-preview.mjs';
import {formatEuro} from '../src/paid-offers.mjs';
test('demo rotation wraps and preview modes are explicitly selected',()=>{
  assert.equal(ROTATION_MS,8000);
  assert.deepEqual([0,1,2].map(i=>nextAdIndex(i,3)),[1,2,0]);
  assert.equal(nextAdIndex(0,0),0);
  assert.equal(previewOffer(''),null);
  assert.equal(previewOffer('?apercu_pub=unknown'),null);
  assert.equal(previewOffer('?apercu_pub=reach'),'reach');
  assert.match(previewHref('spotlight'),/tab=prestataires/);
  assert.match(formatEuro(10000),/15,24/);
  assert.match(formatEuro(25000),/38,11/);
  assert.match(formatEuro(50000),/76,22/);
});

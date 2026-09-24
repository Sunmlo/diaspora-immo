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

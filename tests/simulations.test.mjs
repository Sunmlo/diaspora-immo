import test from 'node:test';
import assert from 'node:assert/strict';
import { amount, COSTS, CFA_PER_EURO, purchaseBudget, rentalReturn, savingsGoal, goalDate, changeCurrency, restoreSimulation, initialSimulation, simulationFromListing, localCurrency } from '../src/simulations.mjs';

test('empty costs remain unknown while zero means no expense', () => {
  assert.equal(amount(''), null); assert.equal(amount('  '), null); assert.equal(amount('0'), 0);
  assert.equal(amount('1 250,50'), 1250.5);
  for (const value of ['-1', 'Infinity', '1e309', '12abc', 'NaN', '1,2,3']) assert.ok(Number.isNaN(amount(value)));
});
test('purchase subtotal does not pretend unknown fees are zero or complete', () => {
  const costs = Object.fromEntries(COSTS.map(([k]) => [k, null]));
  const partial = purchaseBudget(45000, costs);
  assert.equal(partial.total, 45000); assert.equal(partial.complete, false); assert.equal(partial.missing.length, 6);
  Object.assign(costs, { acquisition: 4500, agency: 0, works: 3000, furniture: 2000, other: 500, reserve: 1000 });
  const full = purchaseBudget(45000, costs);
  assert.equal(full.total, 56000); assert.equal(full.complete, true); assert.equal(full.fees, 11000);
  assert.equal(purchaseBudget(45000, { ...costs, acquisition: NaN }), null);
  assert.equal(purchaseBudget(0, costs), null);
});
const rental = { investment: 100000, rent: 1000, vacancy: 1, management: 10, charges: 1200, maintenance: 600, loan: 400 };
test('rental separates potential return, net operating return and financed cash flow', () => {
  const r = rentalReturn(rental);
  assert.equal(r.potentialRent, 12000); assert.equal(r.collectedRent, 11000);
  assert.equal(r.managementCost, 1100); assert.equal(r.operatingCosts, 2900);
  assert.equal(r.netBeforeFinancing, 8100); assert.equal(r.grossYield, 12); assert.equal(r.netYield, 8.1);
  assert.equal(r.cashAnnual, 3300); assert.equal(r.cashMonthly, 275);
  const noLoan = rentalReturn({ ...rental, loan: 0 });
  assert.equal(noLoan.netYield, r.netYield); assert.equal(noLoan.cashMonthly, 675);
});
test('stress, negative cash flow and a full year without tenants stay visible', () => {
  const stress = rentalReturn({ ...rental, vacancy: 2, charges: 1320, maintenance: 660 });
  assert.equal(stress.cashMonthly, 185);
  const empty = rentalReturn({ ...rental, vacancy: 12 });
  assert.equal(empty.managementCost, 0); assert.equal(empty.collectedRent, 0); assert.equal(empty.cashMonthly, -550);
  assert.ok(empty.netYield < 0);
});
test('rental rejects missing, negative and impossible inputs instead of giving plausible returns', () => {
  for (const change of [{ investment: 0 }, { charges: null }, { vacancy: 12.01 }, { management: 101 }, { loan: -1 }, { rent: Infinity }]) assert.equal(rentalReturn({ ...rental, ...change }), null);
  assert.ok(rentalReturn({ ...rental, vacancy: 0.5 }));
});
test('savings calculates the first attainable month and handles zero contribution', () => {
  assert.equal(savingsGoal({ target: 56000, saved: 8000, monthly: 400, mode: 'duration' }).months, 120);
  assert.equal(savingsGoal({ target: 1000, saved: 0, monthly: 300, mode: 'duration' }).months, 4);
  assert.equal(savingsGoal({ target: 1000, saved: 999.999999, monthly: 1000000, mode: 'duration' }).months, 1);
  assert.equal(savingsGoal({ target: 1000, saved: 0, monthly: 0, mode: 'duration' }).months, null);
  assert.equal(savingsGoal({ target: 1000, saved: 1200, monthly: 0, mode: 'duration' }).months, 0);
  assert.equal(savingsGoal({ target: 1000, saved: -1, monthly: 300, mode: 'duration' }), null);
});
test('target-date savings rounds upwards and has no division by zero or invalid dates', () => {
  const goal = savingsGoal({ target: 1000, saved: 0, horizon: 3, mode: 'monthly' });
  assert.equal(goal.monthly, 333.34); assert.ok(goal.monthly * 3 >= 1000);
  assert.equal(savingsGoal({ target: 56000, saved: 8000, horizon: 36, mode: 'monthly' }).monthly, 1333.34);
  for (const horizon of [0, -1, 2.5, 601]) assert.equal(savingsGoal({ target: 1000, saved: 0, horizon, mode: 'monthly' }), null);
  assert.equal(goalDate(1, new Date(2026, 0, 31)).getMonth(), 1);
  assert.equal(goalDate(null), null); assert.equal(goalDate(1000000), null);
});
test('currency changes convert monetary fields only, preserving unknowns and assumptions', () => {
  const s = initialSimulation(); s.purchase.price = '1000'; s.rental.management = '10'; s.rental.vacancy = '1'; s.construction.surface = '150';
  const cfa = changeCurrency(s, 'XOF');
  assert.equal(amount(cfa.purchase.price), 655957); assert.equal(cfa.purchase.acquisition, '');
  assert.equal(cfa.rental.management, '10'); assert.equal(cfa.rental.vacancy, '1'); assert.equal(cfa.construction.surface, '150');
  assert.equal(amount(changeCurrency(cfa, 'EUR').purchase.price), 1000);
  assert.equal(localCurrency('Cameroun'), 'XAF'); assert.equal(localCurrency('Sénégal'), 'XOF');
  const central = changeCurrency(cfa, 'XAF'); assert.equal(central.purchase.price, cfa.purchase.price);
});
test('a rental scenario has the same yield in euros and CFA', () => {
  const s = initialSimulation(); s.rental = Object.fromEntries(Object.entries(rental).map(([k, v]) => [k, String(v)]));
  const cfa = changeCurrency(s, 'XOF'); const r = rentalReturn(Object.fromEntries(Object.entries(cfa.rental).map(([k, v]) => [k, amount(v)])));
  assert.ok(Math.abs(r.netYield - 8.1) < 1e-9); assert.ok(Math.abs(r.cashMonthly / CFA_PER_EURO - 275) < 1e-6);
});
test('saved simulations restore allowed fields and handle corrupt or unsupported data', () => {
  const s = initialSimulation(); s.purchase.price = '45000'; s.active = 'rental'; s.confirmed.agency = true;
  assert.deepEqual(restoreSimulation(JSON.stringify(s)), s);
  assert.equal(restoreSimulation('{oops'), null); assert.equal(restoreSimulation('null'), null);
  assert.equal(restoreSimulation(JSON.stringify({ ...s, version: 99 })), null);
  assert.equal(restoreSimulation(JSON.stringify({ ...s, currency: 'USD' })), null);
});
test('listing handoff uses original local price and starts a fresh fee estimate', () => {
  const s = simulationFromListing({ title: 'Maison', country: 'Cameroun', price: 45000000, price_eur: 68602 });
  assert.equal(s.country, 'Cameroun'); assert.equal(s.currency, 'XAF'); assert.equal(s.purchase.price, '45000000');
  assert.equal(s.purchase.acquisition, ''); assert.equal(s.rental.rent, '');
  assert.equal(simulationFromListing({ price_eur: 45000, country: 'Sénégal' }).purchase.price, '45000');
});

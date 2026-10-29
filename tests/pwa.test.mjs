import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker(fetchResponse) {
  const handlers = {};
  const cached = [];
  const deleted = [];
  const offline = new Response('offline');
  vm.runInNewContext(source, {
    URL, Response,
    self: { location: { origin: 'https://www.sokile.com' }, clients: { claim: async () => {} }, addEventListener: (name, fn) => { handlers[name] = fn; } },
    fetch: fetchResponse,
    caches: {
      open: async () => ({ add: async url => { cached.push(url); } }),
      match: async () => offline,
      keys: async () => ['sokile-offline-v0', 'sokile-offline-v1', 'another-app'],
      delete: async name => { deleted.push(name); }
    }
  });
  return { handlers, cached, deleted, offline };
}
test('offline installation caches only the neutral page and preserves unrelated caches', async () => {
  const w = worker();
  let pending;
  w.handlers.install({ waitUntil: promise => { pending = promise; } });
  await pending;
  assert.deepEqual(w.cached, ['/offline.html']);
  w.handlers.activate({ waitUntil: promise => { pending = promise; } });
  await pending;
  assert.deepEqual(w.deleted, ['sokile-offline-v0']);
});
test('offline navigation falls back without caching account or listing responses', async () => {
  const w = worker(async () => { throw new Error('offline'); });
  let response;
  w.handlers.fetch({ request: { url: 'https://www.sokile.com/?tab=compte', method: 'GET', mode: 'navigate' }, respondWith: promise => { response = promise; } });
  assert.equal(await response, w.offline);
  assert.deepEqual(w.cached, []);
});
test('online HTTP failures are preserved instead of showing a misleading offline page', async () => {
  const failure = new Response('server error', { status: 500 });
  const w = worker(async () => failure);
  let response;
  w.handlers.fetch({ request: { url: 'https://www.sokile.com/', method: 'GET', mode: 'navigate' }, respondWith: promise => { response = promise; } });
  assert.equal(await response, failure);
});
test('API calls, uploads and other origins are untouched', () => {
  const w = worker(() => assert.fail('fetch interception must not occur'));
  for (const request of [
    { url: 'https://www.sokile.com/api/import-link', method: 'POST', mode: 'navigate' },
    { url: 'https://www.sokile.com/api/private', method: 'GET', mode: 'cors' },
    { url: 'https://another.example/account', method: 'GET', mode: 'navigate' }
  ]) w.handlers.fetch({ request, respondWith: () => assert.fail('must not intercept') });
});

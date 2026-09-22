import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const start = source.indexOf("async function ecrire(");
const end = source.indexOf("\nasync function lire(", start);
assert.ok(start >= 0 && end > start);
const helper = source.slice(start, end);

function setup(response) {
  const calls = [];
  const context = vm.createContext({
    SUPABASE_URL: "https://example.invalid",
    SUPABASE_KEY: "public-test-key",
    fetch: async (url, options) => { calls.push({ url, ...options }); return response; },
  });
  vm.runInContext(helper, context);
  return { write: context.ecrire, calls };
}

for (const table of ["leads", "reports"]) {
  test(table + " demande un accusé de réception sans lecture publique", async () => {
    const { write, calls } = setup({ ok: true, status: 201, json: async () => { throw new SyntaxError("Empty body"); } });
    const result = await write(table, { name: "TEST" });
    assert.equal(result.ok, true);
    assert.equal(result.data, null);
    assert.equal(calls[0].headers.Prefer, "return=minimal");
    assert.equal(calls[0].headers.Authorization, "Bearer public-test-key");
    assert.equal(calls[0].method, "POST");
  });
}
for (const table of ["properties", "professionals", "advertising_requests"]) {
  test(table + " conserve la réponse et le jeton authentifié", async () => {
    const { write, calls } = setup({ ok: true, json: async () => [{ id: 42 }] });
    const result = await write(table, { name: "TEST" }, "session-test-token");
    assert.equal(result.ok, true);
    assert.equal(result.data[0].id, 42);
    assert.equal(calls[0].headers.Prefer, "return=representation");
    assert.equal(calls[0].headers.Authorization, "Bearer session-test-token");
  });
}
test("un refus serveur reste un échec", async () => {
  const { write } = setup({ ok: false, status: 403, json: async () => ({ message: "refus serveur" }) });
  const result = await write("leads", {});
  assert.equal(result.ok, false);
  assert.equal(result.statut, 403);
  assert.equal(result.motif, "refus serveur");
});

import test from "node:test";
import assert from "node:assert/strict";
import { validateModerationResponse, buildDecisionMessage } from "../supabase/functions/notify-admin/moderation.mjs";
import { createNotificationHandler } from "../supabase/functions/notify-admin/handler.mjs";

const response = "Les photos de votre terrain ne permettent pas d'identifier ses limites. Merci d'ajouter un plan lisible et des photos récentes avant de soumettre à nouveau votre annonce.";
const base = { id: 33, title: "Terrain Dakar", business_name: "Cabinet Test", company: "Entreprise Test", user_name: "Marie", contact_name: "Marie", user_email: "deposant@example.test", email: "deposant@example.test", updated_at: "2026-09-22T20:00:00Z" };
const decision = (table, status, text = response) => ({ table, type: "UPDATE", record: { ...base, status, motif_rejet: text, moderation_note: text }, old_record: { ...base, status: "en_attente" } });
function setup(provider = async () => new Response(JSON.stringify({ id: "provider-message-id" }), { status: 200 }), config = {}) {
  const calls = [];
  const env = { WEBHOOK_SECRET: "test-webhook-secret", RESEND_API_KEY: "test-api-key", MAIL_FROM: "Sokilé <test@example.test>", ...config };
  const handle = createNotificationHandler({ env: key => env[key], send: async (url, options) => { calls.push({ url, ...options, message: JSON.parse(options.body) }); return provider(); } });
  const request = (payload, secret = "test-webhook-secret") => handle(new Request("https://example.test/notify", { method: "POST", headers: { "x-webhook-secret": secret }, body: JSON.stringify(payload) }));
  return { calls, request };
}

for (const status of ["rejetee", "refusee", "modifications_demandees"]) {
  test(`${status} exige une explication, y compris pour un texte blanc`, () => {
    for (const text of [null, "", " \t\n ", "Non conforme", "a".repeat(4001)]) assert.ok(validateModerationResponse(status, text));
    assert.equal(validateModerationResponse(status, response), "");
  });
}
for (const [table, status] of [["properties", "rejetee"], ["professionals", "refusee"], ["advertising_requests", "refusee"], ["professionals", "modifications_demandees"], ["advertising_requests", "modifications_demandees"]]) {
  test(`${table}/${status} transmet exactement la réponse prévisualisée au déposant`, async () => {
    const { calls, request } = setup();
    const payload = decision(table, status);
    const preview = buildDecisionMessage(table, payload.record);
    const result = await request(payload);
    assert.equal(result.status, 200);
    assert.equal((await result.json()).accepted, true);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].message.to, ["deposant@example.test"]);
    assert.equal(calls[0].message.text, preview.text);
    assert.ok(calls[0].message.text.includes(response));
    assert.equal(calls[0].message.reply_to, "contact@sokile.com");
    assert.ok(calls[0].message.text.includes("Bonjour Marie,"));
  });
}
test("le serveur email refuse un refus sans explication", async () => {
  const { calls, request } = setup();
  assert.equal((await request(decision("properties", "rejetee", ""))).status, 422);
  assert.equal(calls.length, 0);
});
test("un email invalide ou des en-têtes injectés ne sont pas transmis", async () => {
  const { calls, request } = setup();
  const payload = decision("properties", "rejetee");
  payload.record.user_email = "a@example.test\r\nBcc: x@example.test";
  assert.equal((await request(payload)).status, 422);
  assert.equal(calls.length, 0);
});
for (const [table, status] of [["properties", "validee"], ["professionals", "validee"], ["advertising_requests", "acceptee"]]) {
  test(`${table} confirme aussi la validation sans reprendre un ancien refus`, async () => {
    const { calls, request } = setup();
    assert.equal((await request(decision(table, status))).status, 200);
    assert.match(calls[0].message.subject, /Validation/);
    assert.ok(!calls[0].message.text.includes(response));
  });
}
test("la modification d'un dossier déjà refusé ne renvoie rien si sa réponse reste identique", async () => {
  const { calls, request } = setup();
  const payload = decision("properties", "rejetee");
  payload.old_record = { ...payload.record, updated_at: "2026-09-21T20:00:00Z" };
  assert.equal((await (await request(payload)).json()).ignored, true);
  assert.equal(calls.length, 0);
  payload.record.motif_rejet = response + " Le plan précédent est illisible.";
  assert.equal((await request(payload)).status, 200);
  assert.equal(calls.length, 1);
});
test("un même événement utilise la même clé anti-doublon, une nouvelle décision une autre", async () => {
  const { calls, request } = setup();
  const payload = decision("properties", "rejetee");
  await request(payload); await request(payload);
  assert.equal(calls[0].headers["Idempotency-Key"], calls[1].headers["Idempotency-Key"]);
  payload.record.updated_at = "2026-09-23T20:00:00Z";
  await request(payload);
  assert.notEqual(calls[1].headers["Idempotency-Key"], calls[2].headers["Idempotency-Key"]);
});
test("une erreur du prestataire email n'est jamais annoncée comme un succès", async () => {
  for (const provider of [async () => new Response('{}', { status: 403 }), async () => { throw new Error("network"); }]) {
    const { request } = setup(provider);
    const result = await request(decision("properties", "rejetee"));
    assert.equal(result.status, 502);
    assert.equal((await result.json()).accepted, undefined);
  }
});
test("un appel non autorisé ne déclenche aucun email", async () => {
  const { calls, request } = setup();
  assert.equal((await request(decision("properties", "rejetee"), "bad-secret")).status, 401);
  assert.equal(calls.length, 0);
  const missing = setup(undefined, { WEBHOOK_SECRET: undefined });
  assert.equal((await missing.request(decision("properties", "rejetee"))).status, 401);
});
test("les nouveaux dossiers continuent d'alerter uniquement l'administration", async () => {
  const { calls, request } = setup();
  await request({ ...decision("properties", "en_attente"), type: "INSERT" });
  assert.deepEqual(calls[0].message.to, ["contact@sokile.com"]);
});

test("les décisions négatives gardent un objet accueillant et la réponse personnalisée", () => {
  for (const [table,status] of [["properties","rejetee"],["professionals","refusee"],["advertising_requests","refusee"],["development_programs","refusee"]]) {
    const message=buildDecisionMessage(table,decision(table,status).record);
    assert.match(message.subject,/Suivi/);
    assert.doesNotMatch(message.subject+message.text,/refus|rejet/i);
    assert.ok(message.text.includes(response));
    assert.match(message.text,/nécessite quelques ajustements avant sa publication/);
    assert.match(message.text,/points à revoir et la marche à suivre/);
  }
});

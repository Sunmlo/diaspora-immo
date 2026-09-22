import { test } from "node:test";
import assert from "node:assert/strict";
import { readAuthResponse, userSessionFromAuth, isAdminSession } from "../src/auth-session.mjs";

const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const valid = { user: { id: "synthetic-user", email: " Contact@Sokile.com ", user_metadata: { name: "Test" } }, access_token: "synthetic-access", refresh_token: "synthetic-refresh" };

test("a 400 with error_code and msg never creates a session", async () => {
  const data = await readAuthResponse(reply(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" }));
  assert.match(data.error.message, /incorrect/);
  assert.equal(userSessionFromAuth(data), null);
});
test("any non-2xx response is rejected, even with a session-shaped body", async () => {
  assert.equal(userSessionFromAuth(await readAuthResponse(reply(403, valid))), null);
});
test("legacy error responses and malformed bodies are rejected", async () => {
  for (const body of [{ error: "invalid_grant" }, null, "unexpected"]) {
    assert.ok((await readAuthResponse(reply(200, body))).error);
  }
  assert.ok((await readAuthResponse({ ok: true, json: async () => { throw new Error("json"); } })).error);
});
test("incomplete 200 responses never create a local profile", () => {
  for (const data of [{}, { ...valid, access_token: null }, { ...valid, refresh_token: null }, { ...valid, user: {} }]) {
    assert.equal(userSessionFromAuth(data), null);
  }
});
test("confirmed server identity supplies the normalized account email", async () => {
  const session = userSessionFromAuth(await readAuthResponse(reply(200, valid)));
  assert.equal(session.email, "contact@sokile.com");
  assert.equal(session.id, "synthetic-user");
  assert.equal(session.name, "Test");
  assert.ok(isAdminSession(session, "contact@sokile.com"));
});
test("an email alone never grants admin UI access", () => {
  assert.equal(isAdminSession({ email: "contact@sokile.com" }, "contact@sokile.com"), false);
  assert.equal(isAdminSession({ id: "test", token: "synthetic", email: "other@example.com" }, "contact@sokile.com"), false);
});
test("email confirmation failure has a useful message and no session", async () => {
  const data = await readAuthResponse(reply(400, { error_code: "email_not_confirmed" }));
  assert.match(data.error.message, /Confirmez/);
  assert.equal(userSessionFromAuth(data), null);
});

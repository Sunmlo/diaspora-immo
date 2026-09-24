import { test } from "node:test";
import assert from "node:assert/strict";
import { readAuthResponse, userSessionFromAuth, isAdminSession, applySessionRefresh, authCallbackState, authFormError } from "../src/auth-session.mjs";

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

test("a delayed refresh cannot restore a signed-out session", () => {
  assert.equal(applySessionRefresh(null, valid.refresh_token, valid), null);
});
test("a delayed success or error cannot replace a newer sign-in", () => {
  const current = { ...userSessionFromAuth(valid), refresh_token:"synthetic-newer" };
  assert.equal(applySessionRefresh(current, valid.refresh_token, valid), current);
  assert.equal(applySessionRefresh(current, valid.refresh_token, null), current);
});
test("refresh updates only the session that requested it", () => {
  const current = userSessionFromAuth(valid);
  const refreshed = { ...valid, access_token:"synthetic-rotated-access", refresh_token:"synthetic-rotated-refresh" };
  assert.deepEqual(applySessionRefresh(current, valid.refresh_token, refreshed), userSessionFromAuth(refreshed));
  assert.equal(applySessionRefresh(current, valid.refresh_token, null), null);
});

test("an expired email link offers recovery without reflecting untrusted provider text", () => {
  const state = authCallbackState("#error=access_denied&error_code=otp_expired&error_description=untrusted-provider-text");
  assert.equal(state.mode, "forgot");
  assert.equal(state.token, "");
  assert.match(state.error, /expiré/);
  assert.doesNotMatch(state.error, /untrusted/);
});
test("recovery requires its own token and does not reinterpret signup callbacks", () => {
  assert.deepEqual(authCallbackState("#type=recovery&access_token=synthetic-recovery"), { mode: "reset", token: "synthetic-recovery", error: "" });
  assert.equal(authCallbackState("#type=recovery").mode, "forgot");
  assert.equal(authCallbackState("#type=signup&access_token=synthetic-signup"), null);
  assert.equal(authCallbackState("#guide"), null);
  assert.equal(authCallbackState(""), null);
});
test("registration and recovery reject malformed email and weak passwords before sending", () => {
  assert.match(authFormError("forgot", {email:"   "}), /email/);
  assert.match(authFormError("forgot", {email:"not-an-email"}), /email/);
  assert.equal(authFormError("forgot", {email:" Test@Example.com "}), "");
  assert.match(authFormError("signup", {email:"test@example.com",password:"short"}), /8 caractères/);
  assert.match(authFormError("reset", {password:"short"}), /8 caractères/);
  assert.equal(authFormError("reset", {password:"synthetic-password"}), "");
  assert.match(authFormError("signup", {email:"test@example.com",password:"synthetic-password",accountType:"pro",agency:"  "}), /agence/);
  // Existing accounts retain the server's login policy.
  assert.equal(authFormError("login", {email:"test@example.com",password:"short"}), "");
});

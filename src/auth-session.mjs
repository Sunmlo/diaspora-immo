// A local profile is only created from a successful Supabase auth response.
export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function authFormError(mode, { email, password, agency, accountType }) {
  if (mode !== "reset" && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(normalizeEmail(email))) {
    return "Indiquez une adresse email valide.";
  }
  if ((mode === "signup" || mode === "reset") && String(password || "").length < 8) {
    return "Choisissez un mot de passe d’au moins 8 caractères.";
  }
  if (mode === "signup" && accountType === "pro" && !String(agency || "").trim()) {
    return "Indiquez le nom de votre agence ou société.";
  }
  return "";
}

// Only interpret known auth callback fields. Never render provider-supplied text.
export function authCallbackState(hash = "") {
  const params = new URLSearchParams(String(hash).replace(/^#/, ""));
  if (params.has("error") || params.has("error_code")) {
    return { mode: "forgot", token: "", error: "Ce lien de connexion ou de réinitialisation est invalide ou expiré. Demandez un nouveau lien." };
  }
  if (params.get("type") !== "recovery") return null;
  const token = params.get("access_token") || "";
  return token
    ? { mode: "reset", token, error: "" }
    : { mode: "forgot", token: "", error: "Ce lien de réinitialisation est incomplet. Demandez un nouveau lien." };
}

export async function readAuthResponse(response) {
  let data;
  try { data = await response.json(); }
  catch { return { error: { message: "Réponse du serveur illisible. Réessayez dans un instant." } }; }
  if (!response.ok || !data || typeof data !== "object" || data.error || data.error_code) {
    const code = data?.error_code || data?.code;
    const messages = {
      invalid_credentials: "Email ou mot de passe incorrect.",
      email_not_confirmed: "Confirmez votre adresse email avant de vous connecter.",
      user_banned: "Ce compte est temporairement désactivé.",
      over_request_rate_limit: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
      over_email_send_rate_limit: "Trop de demandes d’email. Patientez quelques minutes avant de réessayer.",
      weak_password: "Choisissez un mot de passe plus long et plus difficile à deviner.",
      same_password: "Choisissez un mot de passe différent de votre ancien mot de passe.",
      otp_expired: "Ce lien est expiré. Demandez un nouveau lien de réinitialisation.",
    };
    return { error: { message: messages[code] || "La demande n’a pas été acceptée par le serveur. Réessayez ou contactez Sokilé.", status: response.status } };
  }
  return data;
}

export function userSessionFromAuth(data, now = Date.now()) {
  if (data?.error || data?.error_code || !data?.user?.id || !data.user.email ||
      !data.access_token || !data.refresh_token) return null;
  const meta = data.user.user_metadata || {};
  const email = normalizeEmail(data.user.email);
  return {
    gift_project: meta.gift_project || null,
    id: data.user.id, email, name: meta.name || email.split("@")[0],
    account_type: meta.account_type || "particulier", agency: meta.agency || "", phone: meta.phone || "",
    token: data.access_token, refresh_token: data.refresh_token,
    expires_at: Number(data.expires_at) || (Number(data.expires_in) > 0 ? Math.floor(now / 1000) + Number(data.expires_in) : 0),
  };
}

// Ignore a delayed refresh after sign-out or a newer sign-in.
export function applySessionRefresh(current, requestedToken, data) {
  if (!current || current.refresh_token !== requestedToken) return current;
  return userSessionFromAuth(data);
}

// UI guard only: actual authorization is enforced by Supabase RLS.
export function isAdminSession(user, adminEmail) {
  return Boolean(user?.id && user?.token && normalizeEmail(user.email) === normalizeEmail(adminEmail));
}

// Professional publishing is separate from administrator moderation.
export function canManagePrograms(user, adminEmail) {
  return Boolean(user?.id && user?.token && user.account_type === 'pro' && !isAdminSession(user, adminEmail));
}

// Refresh before expiry, and recheck after a suspended tab or network recovery.
// Transient failures preserve the session and retry; terminal auth failures clear it.
export function watchSession({session, refresh, onResult, events, page,
  now = Date.now, every = setInterval, cancel = clearInterval}) {
  let stopped = false, busy = false, retryAt = 0, completed = false;
  const tick = async () => {
    if (stopped || completed || busy || now() < retryAt) return;
    if (Number(session.expires_at) * 1000 > now() + 90000) return;
    busy = true;
    try {
      const data = await refresh(session.refresh_token);
      if (stopped) return;
      const status = data?.error?.status;
      if (data?.error && (!status || status === 429 || status >= 500)) {
        retryAt = now() + 30000;
        return;
      }
      completed = true;
      onResult(session.refresh_token, data);
    } catch {
      retryAt = now() + 30000;
    } finally { busy = false; }
  };
  const timer = every(tick, 30000);
  events.addEventListener('focus', tick);
  events.addEventListener('online', tick);
  page.addEventListener('visibilitychange', tick);
  void tick();
  return () => {
    stopped = true;
    cancel(timer);
    events.removeEventListener('focus', tick);
    events.removeEventListener('online', tick);
    page.removeEventListener('visibilitychange', tick);
  };
}

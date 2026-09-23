// A local profile is only created from a successful Supabase auth response.
export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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
    };
    return { error: { message: messages[code] || "La demande n’a pas été acceptée par le serveur. Réessayez ou contactez Sokilé.", status: response.status } };
  }
  return data;
}

export function userSessionFromAuth(data) {
  if (data?.error || data?.error_code || !data?.user?.id || !data.user.email ||
      !data.access_token || !data.refresh_token) return null;
  const meta = data.user.user_metadata || {};
  const email = normalizeEmail(data.user.email);
  return {
    id: data.user.id, email, name: meta.name || email.split("@")[0],
    account_type: meta.account_type || "particulier", agency: meta.agency || "", phone: meta.phone || "",
    token: data.access_token, refresh_token: data.refresh_token,
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

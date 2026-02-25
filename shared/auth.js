// Shared authentication utilities for GTC chat frontends.
// Phase 6 will expand these helpers; initial version only handles /auth/status hydration.

async function authJsonPost(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body ?? {})
  });
  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = { error: 'bad_json' };
  }
  if (data && typeof data === 'object' && !('_status' in data)) {
    data._status = response.status;
  }
  return data;
}

export async function fetchAuthStatus() {
  try {
    const response = await fetch('/auth/status', { credentials: 'include' });
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    const data = await response.json().catch(() => null);
    if (!data?.gtc_user_id) {
      return { ok: false, status: response.status, data };
    }
    const resolvedId = data.id ?? data.user_id ?? data.userId ?? null;
    const emailVerified = typeof data.email_verified === 'boolean'
      ? data.email_verified
      : (typeof data.emailVerified === 'boolean' ? data.emailVerified : undefined);
    return {
      ok: true,
      status: response.status,
      data: {
        gtc_user_id: data.gtc_user_id,
        email: data.email || '',
        full_name: data.full_name || '',
        id: resolvedId,
        email_verified: emailVerified
      }
    };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function checkEmail(email) {
  return authJsonPost('/auth/check_email', { email });
}

export async function login(email, password) {
  return authJsonPost('/auth/login', { email, password });
}

export async function register(payload) {
  return authJsonPost('/auth/register', payload);
}

export async function logout() {
  try {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function requestPasswordReset(email) {
  return authJsonPost('/auth/request_password_reset', { email });
}

import { describe, expect, test } from 'vitest';
import { createTravelGtcApp } from '../src/server/createApp.js';
import type { TravelGtcConfig } from '../src/server/config.js';
import { hashPassword, verifyPassword } from '../src/modules/auth/password.js';
import { MemoryAuthStore } from '../src/modules/auth/stores/memoryAuthStore.js';
import { MemoryLeadStore } from '../src/modules/public-leads/stores/memoryLeadStore.js';

const baseConfig: TravelGtcConfig = {
  appEnv: 'test',
  host: '127.0.0.1',
  port: 0,
  publicLeadCaptureEnabled: false,
  accountLeadCaptureEnabled: true,
  crmAuthMode: 'session',
  agentIntakeMode: 'stub',
  parentNetworkMode: 'none',
  consentVersion: 'travelgtc-consent-v1',
    identityConsentVersion: 'travelgtc-identity-consent-v1',
  sessionCookieName: 'gtc_travelgtc_session',
  sessionTtlDays: 7,
  authSecureCookies: false,
  authEmailVerificationTestMode: true,
  rateLimitWindowSeconds: 60,
  rateLimitMax: 10,
};

function registerPayload(overrides: Record<string, unknown> = {}) {
  return {
    display_name: 'Crew User',
    email: 'crew.user@example.com',
    password: 'StrongPass123',
    primary_channel: 'email',
    phone: '+79180000000',
    consent_version: 'travelgtc-identity-consent-v1',
    account_terms_consent: true,
    privacy_consent: true,
    ...overrides,
  };
}

function loginPayload(overrides: Record<string, unknown> = {}) {
  return {
    email: 'crew.user@example.com',
    password: 'StrongPass123',
    ...overrides,
  };
}

function leadPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Crew User',
    preferred_channel: 'email',
    contact_value: 'crew.user@example.com',
    declared_role: 'traveler',
    primary_interest: 'travel',
    travel_format: ['family'],
    destination_interest: 'Port city family visit',
    audience_type: ['family'],
    business_interest_level: 'none',
    message: 'Хочу понять варианты поездки для семьи во время стоянки судна.',
    personal_data_consent: true,
    communication_consent: true,
    consent_version: 'travelgtc-consent-v1',
    tracking: {
      landing_path: '/',
      client_event_id: 'auth-lead-1',
    },
    ...overrides,
  };
}

async function makeApp(configOverrides: Partial<TravelGtcConfig> = {}) {
  const store = new MemoryLeadStore();
  const authStore = new MemoryAuthStore();
  const app = await createTravelGtcApp({ config: { ...baseConfig, ...configOverrides }, store, authStore });
  return { app, store, authStore };
}

function setCookieHeader(response: { headers: Record<string, unknown> }): string {
  const header = response.headers['set-cookie'];
  if (Array.isArray(header)) {
    return header[0] as string;
  }
  return String(header);
}

describe('TravelGTC auth API', () => {
  test('verifies bcrypt hashes compatible with PHP password_hash $2y$ prefix', async () => {
    const hash = await hashPassword('StrongPass123');
    const phpStyleHash = hash.replace('$2b$', '$2y$');

    expect(await verifyPassword('StrongPass123', phpStyleHash)).toBe(true);
    expect(await verifyPassword('wrong-password', phpStyleHash)).toBe(false);
  });

  test('returns anonymous current-user state without a session', async () => {
    const { app } = await makeApp();
    const response = await app.inject({ method: 'GET', url: '/api/travelgtc/v1/auth/me' });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      authenticated: false,
      user: null,
    });
  });

  test('registers a local TravelGTC account, sets session cookie and blocks duplicate registration in TravelGTC', async () => {
    const { app, authStore } = await makeApp();
    const first = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/register',
      payload: registerPayload(),
    });
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/register',
      payload: registerPayload(),
    });
    await app.close();

    expect(first.statusCode).toBe(201);
    expect(first.headers['set-cookie']).toBeTruthy();
    expect(first.json().user.email).toBe('crew.user@example.com');
    expect(first.json().email_verification.test_verification_token).toBeTruthy();
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe('account_already_exists');
    expect(authStore.listUsers()).toHaveLength(1);
  });

  test('logs in an existing TravelGTC account without creating another user', async () => {
    const { app, authStore } = await makeApp();
    await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/register',
      payload: registerPayload(),
    });
    const login = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/login',
      payload: loginPayload(),
    });
    const cookie = setCookieHeader(login);
    const me = await app.inject({
      method: 'GET',
      url: '/api/travelgtc/v1/auth/me',
      headers: { cookie },
    });
    await app.close();

    expect(login.statusCode).toBe(200);
    expect(cookie).toContain('HttpOnly');
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({
      authenticated: true,
      user: {
        email: 'crew.user@example.com',
      },
    });
    expect(authStore.listUsers()).toHaveLength(1);
  });

  test('verifies email with captured test token', async () => {
    const { app } = await makeApp();
    const registration = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/register',
      payload: registerPayload(),
    });
    const token = registration.json().email_verification.test_verification_token;
    const verify = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/email/verify',
      payload: { token },
    });
    await app.close();

    expect(verify.statusCode).toBe(200);
    expect(verify.json()).toMatchObject({
      ok: true,
      email_verification_status: 'verified',
      user: {
        emailVerified: true,
        accountStatus: 'active',
      },
    });
  });

  test('requires authentication for account lead submission', async () => {
    const { app, store } = await makeApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/account/leads',
      payload: leadPayload(),
    });
    await app.close();

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('auth_required');
    expect(store.listBundles()).toHaveLength(0);
  });

  test('creates authenticated TravelGTC lead and project membership from TravelGTC action', async () => {
    const { app, store } = await makeApp();
    const registration = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/register',
      payload: registerPayload(),
    });
    const cookie = setCookieHeader(registration);
    const lead = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/account/leads',
      headers: { cookie },
      payload: leadPayload(),
    });
    const me = await app.inject({
      method: 'GET',
      url: '/api/travelgtc/v1/auth/me',
      headers: { cookie },
    });
    await app.close();

    expect(lead.statusCode).toBe(201);
    expect(lead.json()).toMatchObject({
      ok: true,
      message: 'authenticated_lead_created',
      stage: 'new_lead',
    });
    const bundles = store.listBundles();
    expect(bundles).toHaveLength(1);
    expect(bundles[0].userId).toBeTruthy();
    expect(me.json().user.projectMemberships).toContainEqual({
      projectCode: 'travelgtc',
      membershipStatus: 'interested',
    });
  });

  test('clears and revokes session on logout', async () => {
    const { app } = await makeApp();
    const registration = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/register',
      payload: registerPayload(),
    });
    const cookie = setCookieHeader(registration);
    const logout = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/auth/logout',
      headers: { cookie },
    });
    const me = await app.inject({
      method: 'GET',
      url: '/api/travelgtc/v1/auth/me',
      headers: { cookie },
    });
    await app.close();

    expect(logout.statusCode).toBe(200);
    expect(logout.headers['set-cookie']).toContain('Max-Age=0');
    expect(me.json().authenticated).toBe(false);
  });
});

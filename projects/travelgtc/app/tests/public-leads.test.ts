import { describe, expect, test } from 'vitest';
import { createTravelGtcApp } from '../src/server/createApp.js';
import type { TravelGtcConfig } from '../src/server/config.js';
import { MemoryAuthStore } from '../src/modules/auth/stores/memoryAuthStore.js';
import { MemoryLeadStore } from '../src/modules/public-leads/stores/memoryLeadStore.js';

const baseConfig: TravelGtcConfig = {
  appEnv: 'test',
  host: '127.0.0.1',
  port: 0,
  publicLeadCaptureEnabled: true,
  accountLeadCaptureEnabled: true,
  crmAuthMode: 'disabled',
  agentIntakeMode: 'stub',
  parentNetworkMode: 'none',
  aiChatMode: 'stub',
  azureAiAgentName: 'AI-TravelGTC',
  azureAiAgentVersion: '5',
  emailNotificationMode: 'disabled',
  leadNotificationTo: 'kfilipenko@kmf.ru',
  leadNotificationFrom: 'TravelGTC <no-reply@travelgtc.com>',
  smtpPort: 587,
  smtpSecure: false,
  consentVersion: 'travelgtc-consent-v1',
  identityConsentVersion: 'travelgtc-identity-consent-v1',
  sessionCookieName: 'gtc_travelgtc_session',
  sessionTtlDays: 7,
  authSecureCookies: false,
  authEmailVerificationTestMode: true,
  rateLimitWindowSeconds: 60,
  rateLimitMax: 10,
};

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Иван',
    preferred_channel: 'whatsapp',
    contact_value: '+79180000000',
    declared_role: 'trip_author',
    primary_interest: 'create_trip',
    travel_format: 'retreat',
    destination_interest: 'Turkey',
    approx_dates: 'September',
    audience_type: ['clients', 'community'],
    estimated_group_size: '10-15',
    business_interest_level: 'want_to_understand',
    message: 'Хочу провести выезд для клиентов.',
    personal_data_consent: true,
    communication_consent: true,
    consent_version: 'travelgtc-consent-v1',
    tracking: {
      landing_path: '/create-trip/',
      utm_source: 'instagram',
      utm_campaign: 'retreat_intro',
      client_event_id: 'event-1',
    },
    ...overrides,
  };
}

async function makeApp(configOverrides: Partial<TravelGtcConfig> = {}) {
  const store = new MemoryLeadStore();
  const authStore = new MemoryAuthStore();
  const app = await createTravelGtcApp({ config: { ...baseConfig, ...configOverrides }, store, authStore });
  return { app, store };
}

describe('TravelGTC public lead API', () => {
  test('health exposes service and safety switch state', async () => {
    const { app } = await makeApp({ publicLeadCaptureEnabled: false });
    const response = await app.inject({ method: 'GET', url: '/api/travelgtc/v1/health' });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      service: 'travelgtc-api',
      lead_capture_enabled: false,
    });
  });

  test('returns 503 when public lead capture is disabled', async () => {
    const { app, store } = await makeApp({ publicLeadCaptureEnabled: false });
    const response = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload(),
    });
    await app.close();

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('lead_capture_disabled');
    expect(store.listBundles()).toHaveLength(0);
  });

  test('creates contact, lead, travel idea, task and intake agent stub for valid submission', async () => {
    const { app, store } = await makeApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload(),
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      ok: true,
      stage: 'new_lead',
      message: 'lead_created',
    });
    expect(response.json().lead_id).toBeTruthy();
    expect(response.json().contact_id).toBeTruthy();

    const bundles = store.listBundles();
    expect(bundles).toHaveLength(1);
    expect(bundles[0].submission.declared_role).toBe('trip_author');
    expect(bundles[0].submission.travel_format).toEqual(['retreat']);
    expect(bundles[0].intakeOutput.human_review_required).toBe(true);
    expect(bundles[0].intakeOutput.recommended_stage).toBe('needs_human_review');
  });

  test('rejects invalid enum values with validation_failed', async () => {
    const { app } = await makeApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload({ declared_role: 'seller' }),
    });
    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('validation_failed');
    expect(response.json().error.fields.declared_role).toBeTruthy();
  });

  test('rejects missing consent with validation_failed', async () => {
    const { app } = await makeApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload({ personal_data_consent: false }),
    });
    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('validation_failed');
    expect(response.json().error.fields.personal_data_consent).toBeTruthy();
  });

  test('rejects duplicate client_event_id with duplicate_submission', async () => {
    const { app } = await makeApp();
    const first = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload({ tracking: { client_event_id: 'same-event' } }),
    });
    const second = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload({ tracking: { client_event_id: 'same-event' } }),
    });
    await app.close();

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe('duplicate_submission');
  });

  test('rate limits excessive submissions', async () => {
    const { app } = await makeApp({ rateLimitMax: 1 });
    const first = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload({ tracking: { client_event_id: 'rate-1' } }),
    });
    const second = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/public/leads',
      payload: validPayload({ tracking: { client_event_id: 'rate-2' } }),
    });
    await app.close();

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(429);
    expect(second.json().error.code).toBe('rate_limited');
  });

  test('answers AI chat requests in fallback mode', async () => {
    const { app } = await makeApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/travelgtc/v1/ai/chat',
      payload: { question: 'Какой тариф Travel Advantage выбрать для семьи?' },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      mode: 'stub',
      agent: 'AI-TravelGTC',
    });
    expect(response.json().answer).toContain('TravelGTC');
  });
});

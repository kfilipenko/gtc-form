import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createTravelGtcApp } from '../src/server/createApp.js';
import type { TravelGtcConfig } from '../src/server/config.js';
import { MemoryAuthStore } from '../src/modules/auth/stores/memoryAuthStore.js';
import { MemoryLeadStore } from '../src/modules/public-leads/stores/memoryLeadStore.js';

const mocks = vi.hoisted(() => ({ query: vi.fn(), ask: vi.fn(), notify: vi.fn() }));
vi.mock('pg', () => ({ default: { Pool: class {
  query = mocks.query;
  connect = async () => ({ query: mocks.query, release() {} });
  end = async () => {};
} } }));
vi.mock('../src/modules/ai/azureFoundryAgent.js', () => ({ AzureFoundryAgentClient: class { ask = mocks.ask; } }));
vi.mock('../src/modules/notifications/leadEmailNotification.js', () => ({
  createLeadEmailNotificationSender: () => ({ sendAiPurchaseIntent: mocks.notify, sendLeadCreated: vi.fn() }),
}));

const config: TravelGtcConfig = {
  appEnv: 'test', host: '127.0.0.1', port: 0, publicLeadCaptureEnabled: false,
  accountLeadCaptureEnabled: true, crmAuthMode: 'session', agentIntakeMode: 'stub', parentNetworkMode: 'none',
  aiChatMode: 'azure', azureAiProjectEndpoint: 'https://example.invalid', azureAiAgentName: 'test-agent', azureAiAgentVersion: '1',
  databaseUrl: 'postgres://example.invalid/mock-only', referralRegistrationUrl: 'https://www.mwrlife.com/KFilip909',
  emailNotificationMode: 'disabled', leadNotificationTo: 'owner@example.invalid', leadNotificationFrom: 'test@example.invalid',
  smtpPort: 587, smtpSecure: false, consentVersion: 'travelgtc-consent-v1', identityConsentVersion: 'travelgtc-identity-consent-v1',
  sessionCookieName: 'test_session', sessionTtlDays: 7, authSecureCookies: false,
  authEmailVerificationTestMode: true, rateLimitWindowSeconds: 60, rateLimitMax: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ask.mockResolvedValue('Какие условия вы хотите сравнить?');
  mocks.notify.mockResolvedValue(undefined);
  mocks.query.mockImplementation(async (sql: string) => sql.includes('select l.id::text as lead_id')
    ? { rowCount: 1, rows: [{ lead_id: '00000000-0000-4000-8000-000000000001', contact_id: '00000000-0000-4000-8000-000000000002' }] }
    : { rowCount: 0, rows: [] });
});

async function chat(question: string, overrides: Partial<TravelGtcConfig> = {}) {
  const app = await createTravelGtcApp({ config: { ...config, ...overrides }, store: new MemoryLeadStore(), authStore: new MemoryAuthStore() });
  try {
    const registered = await app.inject({ method: 'POST', url: '/api/travelgtc/v1/auth/register', payload: {
      display_name: 'Synthetic Test', email: 'synthetic@example.invalid', password: 'StrongPass123', primary_channel: 'email',
      phone: '+79180000000', consent_version: 'travelgtc-identity-consent-v1', account_terms_consent: true, privacy_consent: true,
    } });
    expect(registered.statusCode).toBe(201);
    const cookie = registered.headers['set-cookie'];
    return await app.inject({ method: 'POST', url: '/api/travelgtc/v1/account/ai/chat',
      headers: { cookie: String(Array.isArray(cookie) ? cookie[0] : cookie) }, payload: { question } });
  } finally { await app.close(); }
}

describe('Mira API with isolated Azure, CRM and email doubles', () => {
  test.each([
    ['Пришли официальный документ Membership.', 'document'],
    ['Хочу зарегистрироваться на мероприятие Life Experiences.', 'event'],
    ['Хочу попробовать Guest Pass.', 'guest_pass'],
    ['Хочу создать аккаунт TravelGTC.', 'account'],
    ['Хочу купить Membership, но пока не готов.', 'conversation'],
    ['У меня группа для йоги, бизнес не интересует.', 'conversation'],
  ])('does not trigger purchase tasks/email: %s', async (question, action) => {
    const response = await chat(question);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ mode: 'azure', purchase_intent: false, history_persisted: true, intent: { action } });
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes("'purchase_intent'"))).toBe(false);
  });

  test.each([
    ['Хочу купить VIP Membership.', 'membership', 'https://vip.traveladvantage.com/KFilip909', 'none'],
    ['Хочу зарегистрироваться как Ambassador.', 'ambassador', config.referralRegistrationUrl, 'ready_to_discuss'],
  ])('records explicit intent and notifies: %s', async (question, action, url, business) => {
    const normalQuery = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async (sql: string, ...args: unknown[]) => sql.includes('select direction, body')
      ? { rowCount: 6, rows: Array.from({length:6},(_,i)=>({direction:i%2?'outbound':'inbound',body:'Предыдущая реплика'})) }
      : normalQuery(sql,...args));
    const response = await chat(question);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ purchase_intent: true, referral_registration_url: url, intent: { action } });
    expect(response.json().answer).toContain(url);
    expect(mocks.notify).toHaveBeenCalledOnce();
    expect(mocks.notify.mock.calls[0][0].referralRegistrationUrl).toBe(url);
    expect(mocks.query.mock.calls.find(([sql]) => sql.includes('business_interest_level = $5'))?.[1][4]).toBe(business);
  });

  test('agent text cannot promote a neutral user to purchase-ready', async () => {
    mocks.ask.mockResolvedValue('Хочу купить VIP Membership.');
    await chat('Спасибо за ответ.');
    const update = mocks.query.mock.calls.find(([sql]) => sql.includes('business_interest_level = case'));
    expect(update?.[1][1]).toBe('new_lead');
    expect(update?.[1][4]).toBeNull();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  test('new account cannot bypass the three-exchange gate', async () => {
    const response = await chat('Хочу купить VIP Membership.');
    expect(response.json().purchase_intent).toBe(false);
    expect(response.json().referral_registration_url).toBeNull();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  test('new account receives guest invitation without purchase notification', async () => {
    const response = await chat('Дай гостевую ссылку.');
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({purchase_intent:false,intent:{action:'guest_pass'}});
    expect(response.json().answer).toContain('https://free.traveladvantage.com/KFilip909');
    expect(mocks.ask.mock.calls[0][0]).toContain('приглашение по прямой просьбе доступно сразу');
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes("'purchase_intent'"))).toBe(false);
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  test('anonymous product preview saves cold contact, not purchase or verified registration', async () => {
    mocks.query.mockImplementation(async (sql:string) => {
      if (sql.includes('returning id')) return {rowCount:1,rows:[{id:'00000000-0000-4000-8000-000000000001'}]};
      if (sql.includes('select g.*')) return {rowCount:1,rows:[{lead_id:'00000000-0000-4000-8000-000000000001',contact_id:'00000000-0000-4000-8000-000000000002',completed_turns:0}]};
      return {rowCount:0,rows:[]};
    });
    const app=await createTravelGtcApp({config:{...config,guestChatEnabled:true},store:new MemoryLeadStore(),authStore:new MemoryAuthStore()});
    try {
      const response=await app.inject({method:'POST',url:'/api/travelgtc/v1/ai/chat',payload:{question:'Хочу посмотреть Travel Advantage.'}});
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({contact_status:'cold_contact',purchase_intent:false,partner_registration_verified:false,
        referral_registration_url:'https://free.traveladvantage.com/KFilip909',completed_turns:1});
      expect(mocks.ask.mock.calls[0][0]).toContain('приглашение по прямой просьбе доступно сразу');
      const metadata=mocks.query.mock.calls.filter(([sql])=>sql.includes('insert into travelgtc_interactions')).map(([,values])=>JSON.parse(values[4]));
      expect(metadata).toHaveLength(2);
      for (const entry of metadata) expect(entry).toMatchObject({partner_registration_verified:false,intent:{action:'guest_pass',purchaseIntent:false}});
      expect(mocks.query.mock.calls.some(([sql])=>sql.includes("'purchase_intent'"))).toBe(false);
      expect(mocks.notify).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });

  test.each([
    [{origin:'https://untrusted.example'}, {question:'Поездка',guest_consent:true},403],
  ])('guest API rejects invalid origin', async (headers,payload,status) => {
    const app = await createTravelGtcApp({config:{...config,guestChatEnabled:true},store:new MemoryLeadStore(),authStore:new MemoryAuthStore()});
    try {
      const response = await app.inject({method:'POST',url:'/api/travelgtc/v1/ai/chat',headers,payload});
      expect(response.statusCode).toBe(status);
      expect(mocks.ask).not.toHaveBeenCalled();
      expect(mocks.query).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });

  test('explicit business refusal clears inferred business interest', async () => {
    await chat('Группа для йоги, бизнес не интересует.');
    expect(mocks.query.mock.calls.find(([sql]) => sql.includes('business_interest_level = case'))?.[1][4]).toBe('none');
  });

  test('Azure failure never returns synthetic success or purchase email', async () => {
    mocks.ask.mockRejectedValueOnce(new Error('Synthetic Azure unavailable'));
    const response = await chat('Хочу купить VIP Membership.');
    expect(response.statusCode).toBe(500);
    expect(response.json().ok).toBe(false);
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes('insert into travelgtc_interactions'))).toBe(false);
  });

  test('disabled Azure performs no CRM operations', async () => {
    const response = await chat('Хочу купить VIP Membership.', { aiChatMode: 'stub' });
    expect(response.json()).toMatchObject({ mode: 'stub', history_persisted: false, purchase_intent: false });
    expect(mocks.ask).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  test('guest API issues protected cookie and saves first turn without referral or email', async () => {
    const contact='00000000-0000-4000-8000-000000000002';
    const lead='00000000-0000-4000-8000-000000000001';
    mocks.query.mockImplementation(async (sql:string) => {
      if (sql.includes('returning id')) return {rowCount:1,rows:[{id:sql.includes('travelgtc_contacts')?contact:lead}]};
      if (sql.includes('select g.*')) return {rowCount:1,rows:[{lead_id:lead,contact_id:contact,completed_turns:0}]};
      return {rowCount:0,rows:[]};
    });
    mocks.ask.mockResolvedValue('Вот VIP: https://vip.traveladvantage.com/KFilip909');
    const app=await createTravelGtcApp({config:{...config,guestChatEnabled:true,authSecureCookies:true},store:new MemoryLeadStore(),authStore:new MemoryAuthStore()});
    try {
      const result=await app.inject({method:'POST',url:'/api/travelgtc/v1/ai/chat',payload:{question:'Хочу купить VIP Membership.',guest_consent:true,
        source:'home',cta:'hero-trip',scenario:'personal-travel',
        campaign:{utm_source:'vk',utm_campaign:'family-2026',utm_medium:'test@example.invalid',utm_content:'x'.repeat(65),token:'never-store',utm_term:'private text'}}});
      expect(result.statusCode).toBe(200);
      expect(result.json()).toMatchObject({contact_status:'cold_contact',purchase_intent:false,completed_turns:1,partner_registration_verified:false});
      expect(result.json().answer).not.toContain('https://vip.traveladvantage.com');
      expect(String(result.headers['set-cookie'])).toMatch(/HttpOnly; Secure; SameSite=Lax/);
      expect(mocks.notify).not.toHaveBeenCalled();
      const inserts=mocks.query.mock.calls.filter(([sql])=>sql.includes('insert into travelgtc_interactions'));
      const metadata=inserts.map(([,values])=>JSON.parse(values[4]));
      expect(metadata[0]).toMatchObject({funnel_event:'conversation_started',entry:{source:'home',cta:'hero-trip',scenario:'personal-travel',campaign:{utm_source:'vk',utm_campaign:'family-2026'}}});
      expect(metadata[0].entry.campaign).toEqual({utm_source:'vk',utm_campaign:'family-2026'});
      expect(metadata[1].funnel_event).toBeUndefined();
    } finally { await app.close(); }
  });
});

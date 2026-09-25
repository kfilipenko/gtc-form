import { beforeAll, afterAll, describe, expect, test } from 'vitest';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { createTravelGtcApp } from '../src/server/createApp.js';
import type { TravelGtcConfig } from '../src/server/config.js';
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
  aiChatMode: 'stub',
  azureAiAgentName: 'AI-TravelGTC',
  azureAiAgentVersion: '5',
  referralRegistrationUrl: 'https://www.mwrlife.com/KFilip909',
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
const route = '/api/travelgtc/v1/crm/content-review/pilot-20260922';
let app: FastifyInstance;
let directory: string;
const cookies: Record<string, string> = {};
const auth = new MemoryAuthStore();
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'content-review-test-'));
  await writeFile(join(directory, 'review.json'), JSON.stringify({ posts: [{ body: 'private draft' }] }));
  await writeFile(join(directory, 'travelgtc-pilot-video.mp4'), Buffer.from('0123456789'));
  await writeFile(join(directory, 'travelgtc-pilot.vtt'), 'WEBVTT\n');
  await writeFile(join(directory, 'test-results.json'), JSON.stringify({ schema_version: 1, tests: [{
    id: 'sora-kling-20260923-v1', title: 'New private test', files: [
      { file: 'test-sora-kling-20260923-v1--combined.mp4' },
      { file: 'test-sora-kling-20260923-v1--symlink.mp4' },
      { file: '../../etc/passwd' },
    ],
  }] }));
  await writeFile(join(directory, 'test-sora-kling-20260923-v1--combined.mp4'), 'abcdefghij');
  await writeFile(join(directory, 'test-sora-kling-20260923-v1--unlisted.mp4'), 'private unlisted bytes');
  await symlink('/etc/passwd', join(directory, 'test-sora-kling-20260923-v1--symlink.mp4'));
  await symlink('/etc/passwd', join(directory, 'need-a.png'));
  app = await createTravelGtcApp({ config: baseConfig, store: new MemoryLeadStore(), authStore: auth, contentReviewDirectory: directory });
  for (const role of ['customer', 'team', 'admin', 'other-project']) {
    const response = await app.inject({ method: 'POST', url: '/api/travelgtc/v1/auth/register', payload: {
      display_name: 'Review Test', email: `${role}@example.com`, password: 'SyntheticTest123!',
      primary_channel: 'email', phone: '+12025550123', consent_version: baseConfig.identityConsentVersion,
      account_terms_consent: true, privacy_consent: true,
    } });
    expect(response.statusCode).toBe(201);
    const user = auth.listUsers().find((user) => user.email === `${role}@example.com`)!;
    cookies[role] = String(response.headers['set-cookie']).split(';')[0];
    if (role === 'team' || role === 'admin') await auth.ensureProjectRole(user.userId, 'travelgtc', role, 'test');
    if (role === 'other-project') await auth.ensureProjectRole(user.userId, 'other-project', 'team', 'test');
  }
});
afterAll(async () => { await app?.close(); if (directory) await rm(directory, { recursive: true, force: true }); });

describe('Protected content review', () => {
  test('adds new test metadata while preserving the pilot', async () => {
    const r = await app.inject({ url: route, headers: { cookie: cookies.team } });
    expect(r.statusCode).toBe(200);
    expect(r.json().review.test_results[0].title).toBe('New private test');
    expect(r.json().review.posts[0].body).toBe('private draft');
  });
  test.each(['anonymous', 'customer', 'other-project'])('new media denies %s', async (role) => {
    const r = await app.inject({ url: `${route}/files/test-sora-kling-20260923-v1--combined.mp4`, headers: cookies[role] ? { cookie: cookies[role] } : {} });
    expect(r.statusCode).toBe(403);
  });
  test('new media supports seek and HEAD after authorization', async () => {
    const url = `${route}/files/test-sora-kling-20260923-v1--combined.mp4`;
    const r = await app.inject({ url, headers: { cookie: cookies.team, range: 'bytes=2-4' } });
    expect(r.statusCode).toBe(206); expect(r.body).toBe('cde');
    const head = await app.inject({ method: 'HEAD', url, headers: { cookie: cookies.team } });
    expect(head.statusCode).toBe(200); expect(head.headers['content-length']).toBe('10');
    expect(head.headers['cache-control']).toBe('private, no-store');
  });
  test.each(['test-sora-kling-20260923-v1--symlink.mp4', 'test-sora-kling-20260923-v1--unlisted.mp4', 'test-results.json'])('new index does not expose %s', async (name) => {
    const r = await app.inject({ url: `${route}/files/${name}`, headers: { cookie: cookies.team } });
    expect(r.statusCode).toBe(404);
  });
  test.each(['anonymous', 'customer', 'other-project'])('denies %s metadata and direct media', async (role) => {
    for (const url of [route, `${route}/files/travelgtc-pilot-video.mp4`]) {
      const response = await app.inject({ url, headers: cookies[role] ? { cookie: cookies[role] } : {} });
      expect(response.statusCode).toBe(403);
      expect(response.body).not.toContain('private draft');
      expect(response.headers['cache-control']).toBe('private, no-store');
    }
  });
  test.each(['team', 'admin'])('permits %s and preserves private cache policy', async (role) => {
    const response = await app.inject({ url: route, headers: { cookie: cookies[role] } });
    expect(response.statusCode).toBe(200);
    expect(response.json().review.posts[0].body).toBe('private draft');
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers['vary']).toContain('Cookie');
  });
  test('rejects another origin despite global CORS', async () => {
    const response = await app.inject({ url: route, headers: { cookie: cookies.team, origin: 'https://untrusted.example' } });
    expect(response.statusCode).toBe(403);
    const noOrigin = await app.inject({ url: `${route}/files/travelgtc-pilot-video.mp4`, headers: { cookie: cookies.team, 'sec-fetch-site': 'cross-site' } });
    expect(noOrigin.statusCode).toBe(403);
  });
  test.each([['bytes=2-4', '234'], ['bytes=7-', '789'], ['bytes=-3', '789'], ['bytes=8-99', '89']])('serves playable range %s', async (range, body) => {
    const response = await app.inject({ url: `${route}/files/travelgtc-pilot-video.mp4`, headers: { cookie: cookies.team, range } });
    expect(response.statusCode).toBe(206);
    expect(response.body).toBe(body);
    expect(Number(response.headers['content-length'])).toBe(body.length);
    expect(response.headers['content-type']).toBe('video/mp4');
    expect(response.headers['content-range']).toMatch(/^bytes \d+-\d+\/10$/);
  });
  test.each(['bytes=11-', 'bytes=5-2', 'bytes=0-1,5-6', 'bytes=-0', 'bytes=-', 'bytes=9999999999999999999999-'])('rejects invalid range %s', async (range) => {
    const response = await app.inject({ url: `${route}/files/travelgtc-pilot-video.mp4`, headers: { cookie: cookies.team, range } });
    expect(response.statusCode).toBe(416);
    expect(response.headers['content-range']).toBe('bytes */10');
  });
  test('HEAD, full media and VTT have correct types and lengths', async () => {
    const head = await app.inject({ method: 'HEAD', url: `${route}/files/travelgtc-pilot-video.mp4`, headers: { cookie: cookies.team } });
    expect(head.statusCode).toBe(200); expect(head.body).toBe(''); expect(head.headers['content-length']).toBe('10');
    const full = await app.inject({ url: `${route}/files/travelgtc-pilot-video.mp4`, headers: { cookie: cookies.team } });
    expect(full.statusCode).toBe(200); expect(full.body).toBe('0123456789');
    const vtt = await app.inject({ url: `${route}/files/travelgtc-pilot.vtt`, headers: { cookie: cookies.team } });
    expect(vtt.headers['content-type']).toContain('text/vtt'); expect(vtt.body).toBe('WEBVTT\n');
  });
  test.each(['need-a.png', 'missing.png', '__proto__', 'review.json', '..%2F..%2Fetc%2Fpasswd'])('does not serve symlinks or unlisted files: %s', async (name) => {
    const response = await app.inject({ url: `${route}/files/${name}`, headers: { cookie: cookies.team } });
    expect(response.statusCode).toBe(404);
    expect(response.body).not.toContain('root:');
  });
  test('revoked sessions cannot read an existing media URL', async () => {
    await app.inject({ method: 'POST', url: '/api/travelgtc/v1/auth/logout', headers: { cookie: cookies.customer } });
    const response = await app.inject({ url: `${route}/files/travelgtc-pilot-video.mp4`, headers: { cookie: cookies.customer } });
    expect(response.statusCode).toBe(403);
  });
});

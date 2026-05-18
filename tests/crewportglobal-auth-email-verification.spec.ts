import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

function runSql(sql: string): string {
  return execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();
}

function sqlValue(value: string): string {
  return value.replace(/'/g, "''");
}

function cleanupAuthUser(email: string): void {
  runSql(`
DELETE FROM crewportglobal.users
WHERE lower(email) = lower('${sqlValue(email)}');
`);
}

function findUserId(email: string): string {
  return runSql(`
SELECT user_id
FROM crewportglobal.users
WHERE lower(email) = lower('${sqlValue(email)}')
LIMIT 1;
`);
}

function readLatestVerificationTokenHash(email: string): string {
  return runSql(`
SELECT t.verification_token_hash
FROM crewportglobal.email_verification_tokens t
JOIN crewportglobal.users u ON u.user_id = t.user_id
WHERE lower(u.email) = lower('${sqlValue(email)}')
ORDER BY t.created_at DESC
LIMIT 1;
`);
}

function createKnownVerificationToken(email: string): string {
  const userId = findUserId(email);
  const token = `known-email-token-${Date.now()}`;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  runSql(`
INSERT INTO crewportglobal.email_verification_tokens (
  user_id,
  email,
  verification_token_hash,
  purpose,
  token_state,
  expires_at,
  delivery_status
) VALUES (
  '${sqlValue(userId)}',
  '${sqlValue(email)}',
  '${tokenHash}',
  'account_email_verification',
  'pending',
  now() + interval '1 hour',
  'test_manual'
);
UPDATE crewportglobal.users
SET email_verification_status = 'pending'
WHERE user_id = '${sqlValue(userId)}';
`);
  return token;
}

test('email verification activates password account and removes cabinet verification task', async ({ page, request }) => {
  const unique = Date.now();
  const email = `auth.email.${unique}@example.com`;
  const password = `EmailPass-${unique}!`;
  cleanupAuthUser(email);

  try {
    const registerResponse = await request.post('/api/v1/auth/register-password', {
      data: {
        email,
        password,
        confirm_password: password,
        full_name: 'Email Verification User',
        role: 'seafarer',
        phone: '+1 555 0123',
        country: 'US',
        terms_accepted: true,
        consent_accepted: true,
      },
    });
    expect(registerResponse.status()).toBe(201);
    const registered = await registerResponse.json();
    expect(registered.user.email_verified).toBe(false);
    expect(registered.user.email_verification_status).toBe('pending');
    expect(registered.email_verification.email_verification_status).toBe('pending');
    expect(JSON.stringify(registered)).not.toContain('verification_token_hash');

    const responseToken = registered.email_verification.test_verification_token;
    const verificationToken = typeof responseToken === 'string' && responseToken
      ? responseToken
      : createKnownVerificationToken(email);
    const latestHash = readLatestVerificationTokenHash(email);
    expect(latestHash).toBeTruthy();
    expect(latestHash).not.toBe(verificationToken);
    expect(latestHash).not.toContain(verificationToken);

    const invalidVerify = await request.post('/api/v1/auth/email/verify', {
      data: {
        token: `${verificationToken}-wrong`,
      },
    });
    expect(invalidVerify.status()).toBe(400);

    await page.goto('/');
    const account = page.locator('.site-header .cpg-account');
    await account.locator('summary').click();
    await account.getByRole('button', { name: 'Login' }).click();
    await account.locator('input[name="email"]').fill(email);
    await account.locator('input[name="password"]').fill(password);
    await account.locator('[data-cpg-login-form]').getByRole('button', { name: 'Log in' }).click();
    await expect(page.locator('.site-header .cpg-account__email-status')).toContainText('Email not verified');

    await page.goto('/cabinet/');
    await expect(page.locator('#cabinet-task-list')).toContainText('Action required: verify your email address');
    await expect(page.locator('#cabinet-task-list')).toContainText(email);

    const resendResult = await page.evaluate(async () => {
      const response = await fetch('/api/v1/auth/email/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      return {
        status: response.status,
        body: await response.json(),
      };
    });
    expect(resendResult.status).toBe(202);
    expect(resendResult.body.email_verification.email_verification_status).toBe('pending');

    const tokenForVerification = typeof resendResult.body.email_verification.test_verification_token === 'string'
      ? resendResult.body.email_verification.test_verification_token
      : createKnownVerificationToken(email);

    const verifyResult = await page.evaluate(async (token) => {
      const response = await fetch('/api/v1/auth/email/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      return {
        status: response.status,
        body: await response.json(),
      };
    }, tokenForVerification);
    expect(verifyResult.status).toBe(200);
    expect(verifyResult.body.status).toBe('email_verified');
    expect(verifyResult.body.user.email_verified).toBe(true);
    expect(JSON.stringify(verifyResult.body)).not.toContain('verification_token_hash');

    const me = await page.evaluate(async () => {
      const response = await fetch('/api/v1/auth/me', { credentials: 'include' });
      return response.json();
    });
    expect(me.authenticated).toBe(true);
    expect(me.user.email_verified).toBe(true);
    expect(me.user.account_activation_status).toBe('active');

    await page.goto('/cabinet/');
    await expect(page.locator('#cabinet-user-summary')).toContainText('Verified');
    await expect(page.locator('#cabinet-task-list')).not.toContainText('Action required: verify your email address');

    await page.goto('/');
    await expect(page.locator('.site-header .cpg-account__email-status')).toContainText('Verified email');
  } finally {
    cleanupAuthUser(email);
  }
});

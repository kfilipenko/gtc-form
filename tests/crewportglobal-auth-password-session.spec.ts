import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function runSql(sql: string): string {
  return execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();
}

function cleanupAuthUser(email: string): void {
  const safeEmail = email.replace(/'/g, "''");
  runSql(`
DELETE FROM crewportglobal.users
WHERE lower(email) = lower('${safeEmail}');
`);
}

function readCredentialHash(email: string): string {
  const safeEmail = email.replace(/'/g, "''");
  return runSql(`
SELECT c.password_hash
FROM crewportglobal.user_credentials c
JOIN crewportglobal.users u ON u.user_id = c.user_id
WHERE lower(u.email) = lower('${safeEmail}')
LIMIT 1;
`);
}

test('password registration, login session, account menu and cabinet access work safely', async ({ page, request }) => {
  const unique = Date.now();
  const email = `auth.session.${unique}@example.com`;
  const password = `SafePass-${unique}!`;
  cleanupAuthUser(email);

  const registerResponse = await request.post('/api/v1/auth/register-password', {
    data: {
      email,
      password,
      confirm_password: password,
      full_name: 'Password Session User',
      role: 'seafarer',
      phone: '+1 555 0199',
      country: 'US',
      terms_accepted: true,
      consent_accepted: true,
    },
  });
  expect(registerResponse.status()).toBe(201);
  const setCookie = registerResponse.headers()['set-cookie'] || '';
  expect(setCookie).toContain('cpg_user_session=');
  expect(setCookie.toLowerCase()).toContain('httponly');
  expect(setCookie).toContain('SameSite=Lax');

  const registered = await registerResponse.json();
  const registerBody = JSON.stringify(registered);
  expect(registerBody).not.toContain(password);
  expect(registerBody).not.toContain('password_hash');
  expect(registered.draft_id).toMatch(/[0-9a-f-]{36}/);
  expect(registered.next_url).toBe('/cabinet/');

  const passwordHash = readCredentialHash(email);
  expect(passwordHash).toBeTruthy();
  expect(passwordHash).not.toBe(password);
  expect(passwordHash).not.toContain(password);

  const wrongPassword = await request.post('/api/v1/auth/login', {
    data: {
      email,
      password: `${password}-wrong`,
    },
  });
  expect(wrongPassword.status()).toBe(401);
  const wrongBody = await wrongPassword.json();
  expect(wrongBody.error).toBe('invalid_login');

  await page.goto('/');
  const account = page.locator('.site-header .cpg-account');
  await expect(account.locator('summary')).toContainText('Account / Login');
  await expect(account.locator('.cpg-account__avatar')).toHaveCount(0);

  await account.locator('summary').click();
  await account.getByRole('button', { name: 'Login' }).click();
  await account.locator('input[name="email"]').fill(email);
  await account.locator('input[name="password"]').fill(password);
  await account.locator('[data-cpg-login-form]').getByRole('button', { name: 'Log in' }).click();

  await expect(page.locator('.site-header .cpg-account__avatar')).toBeVisible();
  await expect(page.locator('.site-header .cpg-account summary')).toContainText('Password Session User');

  const me = await page.evaluate(async () => {
    const response = await fetch('/api/v1/auth/me', { credentials: 'include' });
    return response.json();
  });
  expect(me.authenticated).toBe(true);
  expect(me.user.email).toBe(email);
  expect(JSON.stringify(me)).not.toContain('password_hash');
  expect(JSON.stringify(me)).not.toContain('cpg_user_session');

  await page.goto('/cabinet/');
  await expect(page.locator('#cabinet-summary-user')).toHaveText(email);
  await expect(page.locator('#cabinet-user-summary')).toContainText('Password Session User');
  await expect(page).toHaveURL(/\/cabinet\/$/);

  const cabinetUrl = new URL(page.url());
  expect(cabinetUrl.searchParams.get('draft_id')).toBeNull();

  const cabinetAccount = page.locator('.cabinet-header .cpg-account');
  await expect(cabinetAccount.locator('.cpg-account__avatar')).toBeVisible();
  await cabinetAccount.locator('summary').click();
  await expect(cabinetAccount.getByRole('link', { name: 'My Cabinet' })).toHaveAttribute('href', 'https://crewportglobal.com/cabinet/');
  await cabinetAccount.getByRole('button', { name: 'Logout' }).click();

  await expect(page.locator('.cabinet-header .cpg-account summary')).toContainText('Account / Login');
  const afterLogout = await page.evaluate(async () => {
    const response = await fetch('/api/v1/auth/me', { credentials: 'include' });
    return response.json();
  });
  expect(afterLogout.authenticated).toBe(false);

  cleanupAuthUser(email);
});

test('register page creates password credential session and opens cabinet', async ({ page }) => {
  const unique = Date.now();
  const email = `auth.ui.${unique}@example.com`;
  const password = `UiPass-${unique}!`;
  cleanupAuthUser(email);

  try {
    await page.goto('/register/');
    await page.locator('#email').fill(email);
    await page.locator('#full-name').fill('Register Page User');
    await page.locator('#role').selectOption('employer');
    await page.locator('#phone').fill('+1 555 0177');
    await page.locator('#country').fill('United States');
    await page.locator('#password').fill(password);
    await page.locator('#confirm-password').fill(password);
    await page.locator('#terms').check();
    await page.locator('#consent').check();
    await page.locator('#register-submit').click();

    await expect(page.locator('#register-status')).toContainText('Account created');
    await expect(page.locator('#register-next-steps')).toBeVisible();
    await expect(page.locator('.site-header .cpg-account__avatar')).toBeVisible();

    const passwordHash = readCredentialHash(email);
    expect(passwordHash).toBeTruthy();
    expect(passwordHash).not.toBe(password);

    await page.getByRole('link', { name: 'Open cabinet' }).click();
    await expect(page).toHaveURL(/\/cabinet\/$/);
    await expect(page.locator('#cabinet-summary-user')).toHaveText(email);
    await expect(page.locator('#cabinet-user-summary')).toContainText('Register Page User');
  } finally {
    cleanupAuthUser(email);
  }
});

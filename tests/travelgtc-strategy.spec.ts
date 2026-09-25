import { test, expect } from '@playwright/test';

for (const width of [1440, 390, 320]) {
  test(`public pages and chat at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/travelgtc/v1/**', async route => {
      const url = route.request().url();
      const body = url.includes('/auth/me') ? { ok: true, authenticated: true, user: { displayName: 'Synthetic Test', email: 'test@example.invalid' } }
        : { ok: true, messages: [] };
      await route.fulfill({ json: body });
    });
    for (const path of ['/', '/information/', '/business-model/', '/mira/', '/auth/?mode=login', '/auth/?mode=register']) {
      await page.goto(path);
      await page.locator('main').waitFor();
      await page.evaluate(async () => { await document.fonts.ready; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
      const broken = await page.locator('img').evaluateAll(images => images.filter(image => image.complete && !image.naturalWidth).map(image => image.getAttribute('src')));
      expect(broken, path).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`${path.replace(/\W+/g, '-') || 'home'}.png`), fullPage: true });
    }
    await page.goto('/mira/');
    await expect(page.locator('[data-ai-form]')).toBeVisible();
    expect(await page.locator('[data-ai-form]').evaluate(form => form.getBoundingClientRect().bottom <= form.closest('[data-ai-panel]')!.getBoundingClientRect().bottom)).toBe(true);
    await expect(page.locator('[data-ai-question-select]')).toContainText('Life Experiences');
    await page.route('**/api/travelgtc/v1/account/ai/chat', route => route.fulfill({ status: 503, json: { ok: false, error: { message: 'Synthetic outage' } } }));
    await page.locator('[name=question]').fill('Пришли официальный документ Membership.');
    await page.locator('[data-ai-form] button[type=submit]').click();
    await expect(page.locator('[data-ai-messages]')).toContainText('Не удалось получить ответ Миры');
    await expect(page.locator('[data-ai-messages]')).toContainText('отправка уведомления не подтверждены');
    await expect(page.locator('[data-ai-messages]')).not.toContainText('Elite + Turbo');
    await expect(page.locator('[data-ai-form] button[type=submit]')).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('mira-outage.png'), fullPage: true });
    await page.route('**/api/travelgtc/v1/account/ai/chat', route => route.fulfill({ json: {
      ok: true, mode: 'azure', answer: '### Официальный документ\n\n[Membership](https://www.mwrlife.com/)\n\nУсловия зависят от страны.', lead_id: null,
    } }));
    await page.locator('[name=question]').fill('Покажи документ Membership.');
    await page.locator('[data-ai-form] button[type=submit]').click();
    await expect(page.locator('[data-ai-messages] .ai-message-heading')).toHaveText('Официальный документ');
    await expect(page.locator('[data-ai-messages] a').filter({ hasText: 'Membership' })).toHaveAttribute('href', 'https://www.mwrlife.com/');
    expect(errors).toEqual([]);
  });
}

test('anonymous login and registration preserve scenario and stay distinct', async ({ page }) => {
  await page.route('**/api/travelgtc/v1/**', route => route.fulfill({ json: { ok: true, authenticated: false, user: null } }));
  await page.goto('/mira/?scenario=events&source=information&cta=life-experiences');
  await expect(page.locator('[data-ai-entry-gate]')).toBeVisible();
  await expect(page.locator('[data-ai-form]')).toBeVisible();
  const login = await page.locator('[data-ai-entry-login]').getAttribute('href');
  expect(login).toContain('mode=login');
  expect(decodeURIComponent(login || '')).toContain('scenario=events');
  await page.goto(login!);
  await expect(page.locator('[data-auth-login-form]')).toBeVisible();
  await expect(page.locator('[data-auth-register-form]')).toBeHidden();
  await page.goto('/auth/?mode=register');
  await expect(page.locator('[data-auth-register-form]')).toBeVisible();
  await expect(page.locator('[data-auth-login-form]')).toBeHidden();
});

test('guest talks first, then registers and returns to saved history', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  let authenticated = false;
  let completed = 0;
  const messages: {direction:string;body:string}[] = [];
  await page.route('**/api/travelgtc/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const user = {displayName:'Synthetic Browser Test',email:'browser@example.invalid'};
    if (path.endsWith('/auth/me')) return route.fulfill({json:{ok:true,authenticated,user:authenticated?user:null}});
    if (path.endsWith('/auth/register')) { authenticated=true; return route.fulfill({status:201,json:{ok:true,user}}); }
    if (path.endsWith('/history')) return route.fulfill({json:{ok:true,messages}});
    if (path.endsWith('/ai/chat')) {
      const body = route.request().postDataJSON();
      expect(path).toBe('/api/travelgtc/v1/ai/chat');
      expect(body.guest_consent).toBe(true);
      completed++;
      const answer = completed<4?'Расскажите о поездке.':'Регистрация: https://vip.traveladvantage.com/KFilip909';
      messages.push({direction:'inbound',body:body.question},{direction:'outbound',body:answer});
      return route.fulfill({json:{ok:true,mode:'azure',answer,completed_turns:completed,history_persisted:true}});
    }
    return route.fulfill({json:{ok:true}});
  });
  await page.goto('/mira/?scenario=family');
  expect(await page.locator('[data-ai-form]').evaluate(form => form.getBoundingClientRect().bottom <= form.closest('[data-ai-panel]')!.getBoundingClientRect().bottom)).toBe(true);
  await page.locator('[data-guest-consent]').check();
  for (let n=0;n<4;n++) {
    await page.locator('[name=question]').fill(n===3?'Хочу купить VIP Membership.':`Вопрос о поездке ${n+1}`);
    await page.locator('[data-ai-form] button[type=submit]').click();
    await expect(page.locator('[data-ai-form] button[type=submit]')).toBeEnabled();
  }
  await expect(page.locator('[data-ai-save]')).toBeVisible();
  await expect(page.locator('[data-ai-messages] a[href="https://vip.traveladvantage.com/KFilip909"]')).toHaveAttribute('target','_blank');
  await page.screenshot({path:'test-artifacts/guest-before-registration.png',fullPage:true});
  await page.locator('[data-ai-entry-register]').click();
  await expect(page).toHaveURL(/\/auth\/.*mode=register/);
  await page.locator('#register-name').fill('Synthetic Browser Test');
  await page.locator('#register-email').fill('browser@example.invalid');
  await page.locator('#register-password').fill('StrongPass123');
  await page.locator('#register-phone').fill('+79180000000');
  await page.locator('[name=account_terms_consent]').check();
  await page.locator('[name=privacy_consent]').check();
  await page.locator('[data-auth-register-form] button[type=submit]').click();
  await expect(page).toHaveURL(/\/mira\/.*scenario=family/);
  await expect(page.locator('[data-ai-messages]')).toContainText('Вопрос о поездке 1');
  await expect(page.locator('[data-ai-entry-gate]')).toBeHidden();
});

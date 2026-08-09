import { expect, test } from '@playwright/test';
import { mkdirSync } from 'fs';
import path from 'path';

const screenshotsDir = path.resolve(process.cwd(), 'projects/travelgtc/test-artifacts/screenshots');
mkdirSync(screenshotsDir, { recursive: true });

const homeViewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const publicRoutes = [
  '/',
  '/travel-lifestyle/',
  '/club/',
  '/create-trip/',
  '/business-model/',
  '/events/',
  '/information/',
  '/about/',
  '/mira/',
  '/auth/',
  '/legal/',
  '/legal/privacy/',
  '/legal/terms/',
  '/legal/partner-disclosure/',
];

async function assertNoHorizontalOverflow(pageWidth: number, scrollWidth: number) {
  expect(scrollWidth, `page scroll width ${scrollWidth}px should fit viewport ${pageWidth}px`).toBeLessThanOrEqual(pageWidth + 1);
}

async function measureHorizontalOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
}

test.describe('TravelGTC responsive public site', () => {
  test('auth page shows only the form chosen in the menu link', async ({ page }) => {
    await page.goto('/auth/?mode=login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Войдите в аккаунт' })).toBeVisible();
    await expect(page.locator('[data-auth-login-form]')).toBeVisible();
    await expect(page.locator('[data-auth-register-form]')).toBeHidden();

    await page.goto('/auth/?mode=register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Создайте аккаунт' })).toBeVisible();
    await expect(page.locator('[data-auth-register-form]')).toBeVisible();
    await expect(page.locator('[data-auth-login-form]')).toBeHidden();
  });

  for (const viewport of homeViewports) {
    test(`information page retains detailed reference sections on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/information/', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('h1')).toContainText('Ваш вход в Travel Advantage');
      await expect(page.locator('head link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);
      await expect(page.locator('head link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', '/favicon-32x32.png');
      await expect(page.locator('head link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
      await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute('href', '/site.webmanifest');
      await expect(page.locator('head meta[name="theme-color"]')).toHaveAttribute('content', '#061A28');
      await expect(page.locator('.site-header .brand-logo img')).toHaveAttribute('src', /travelgtc-logo-header\.webp$/);
      await expect(page.locator('.site-header .brand > span')).toHaveCount(0);
      await expect(page.getByText('Партнёрское позиционирование')).toHaveCount(0);
      await expect(page.getByText('Мы не создаём отдельную travel-компанию')).toHaveCount(0);
      await expect(page.locator('.relationship-grid .role-card')).toHaveCount(3);
      await expect(page.getByRole('link', { name: 'Страница официального сайта: https://www.mwrlife.com/home/membership' })).toHaveAttribute('href', 'https://www.mwrlife.com/home/membership');
      await expect(page.getByRole('link', { name: 'Официальный сайт: https://www.traveladvantage.com/home' })).toHaveAttribute('href', 'https://www.traveladvantage.com/home');
      await expect(page.getByRole('link', { name: 'Официальный сайт: https://travelgtc.com/' })).toHaveAttribute('href', 'https://travelgtc.com/');
      await expect(page.locator('.relationship-grid .guest-access-box')).toContainText('Гостевой доступ и VIP Membership');
      await expect(page.locator('.relationship-grid').getByRole('link', { name: 'VIP Membership' })).toHaveAttribute('href', 'https://vip.traveladvantage.com/KFilip909');
      await expect(page.locator('.relationship-grid').getByRole('link', { name: 'Free Guest Pass' })).toHaveAttribute('href', 'https://free.traveladvantage.com/KFilip909');
      await expect(page.getByText('MWR Life в цифрах и официальных адресах')).toBeVisible();
      await expect(page.locator('.company-stats article')).toHaveCount(4);
      await expect(page.getByText('300K+')).toBeVisible();
      await expect(page.getByText('150+')).toBeVisible();
      await expect(page.getByText('World Trust Tower')).toBeVisible();
      await expect(page.getByText('300 SE 2nd Street')).toBeVisible();
      await expect(page.getByText('36 Prime Tower')).toBeVisible();
      await expect(page.locator('.service-grid span')).toHaveCount(10);
      await expect(page.getByText('Сравнение уровней Membership')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Открыть официальный PDF' })).toHaveAttribute('href', 'https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf');
      await expect(page.locator('.access-card')).toContainText('Официальные входы Travel Advantage');
      await expect(page.getByRole('link', { name: 'Открыть VIP Membership Travel Advantage' })).toHaveAttribute('href', 'https://vip.traveladvantage.com/KFilip909');
      await expect(page.getByRole('link', { name: 'Открыть Free Guest Pass Travel Advantage' })).toHaveAttribute('href', 'https://free.traveladvantage.com/KFilip909');
      const accessHeadingBox = await page.locator('.access-card h3').boundingBox();
      expect(accessHeadingBox?.width || 0).toBeGreaterThan(240);
      expect(accessHeadingBox?.height || 0).toBeLessThan(80);
      await expect(page.locator('.site-header a[href="/mira/"]')).toHaveCount(1);
      await expect(page.locator('.site-header a[href="/contacts/"]')).toHaveCount(0);
      await expect(page.locator('.site-footer a[href="/contacts/"]')).toHaveCount(0);
      await expect(page.locator('.site-header a[href="#travel-advantage"]')).toHaveCount(0);
      await expect(page.locator('.site-header .nav-primary')).toHaveCount(0);
      await expect(page.locator('.site-header a[href="/mira/"]')).toHaveText('Мира');
      await expect(page.locator('.site-header a[href="/events/"]')).toHaveCount(0);
      await expect(page.locator('.membership-steps article')).toHaveCount(3);
      await expect(page.locator('.membership-steps')).toContainText('Диалог с Мирой');
      await expect(page.locator('.membership-steps')).toContainText('Официальная ссылка');
      await expect(page.locator('.membership-steps')).toContainText('Сопровождение TravelGTC');
      await expect(page.locator('.membership-steps')).not.toContainText('Выбор интереса');
      await expect(page.locator('.membership-steps')).not.toContainText('Вход или регистрация');
      await expect(page.locator('.ai-section')).toHaveCount(0);
      await expect(page.getByText('Задайте первый вопрос до консультации')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Спросить Миру' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Выбрать первый вопрос' })).toHaveCount(0);
      await expect(page.locator('[data-ai-widget]')).toHaveCount(0);
      await expect(page.locator('#lead-form')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Оставить заявку' })).toHaveCount(0);
      await expect(page.getByText('TravelGTC является партнёрской информационной страницей')).toBeVisible();
      await expect(page.locator('form[data-travelgtc-lead-form]')).toHaveCount(0);
      await expect(page.locator('.nav-links')).toHaveCount(1);
      await expect(page.locator('.nav-contact')).toHaveCount(0);
      await expect(page.locator('.menu-infographic')).toHaveCount(0);
      await expect(page.getByText('Создавайте путешествия')).toHaveCount(0);
      await expect(page.getByText('Развивайте сеть')).toHaveCount(0);
      await expect(page.getByText('Сеть - это не давление. Сеть - это доверие.')).toHaveCount(0);
      await expect(page.getByText('Хотите спокойно разобраться в Travel Advantage?')).toHaveCount(0);
      await expect(page.locator('.cta-panel')).toHaveCount(0);
      await expect(page.locator('.site-footer')).toBeVisible();
      await expect(page.locator('.site-footer [data-protected-email], .site-footer [data-protected-phone]')).toHaveCount(0);

      const serviceBadges = (await page.locator('.service-grid b').allTextContents()).join('');
      const trustBadges = (await page.locator('.trust-card .icon').allTextContents()).join('');
      const processBadges = (await page.locator('.membership-steps b').allTextContents()).join('');
      expect(serviceBadges).not.toMatch(/\b\d{2}\b/);
      expect(trustBadges).not.toMatch(/\b\d{2}\b/);
      expect(processBadges).not.toMatch(/\b\d{2}\b/);

      const overflow = await measureHorizontalOverflow(page);
      await assertNoHorizontalOverflow(overflow.viewportWidth, Math.max(overflow.documentScrollWidth, overflow.bodyScrollWidth));

      const screenshotPath = path.join(screenshotsDir, `travelgtc-information-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      test.info().attach(`travelgtc-information-${viewport.name}`, { path: screenshotPath, contentType: 'image/png' });
    });
  }

  test('mobile menu opens without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.nav-links')).not.toBeVisible();
    await page.locator('[data-menu-toggle]').click();
    await expect(page.locator('.nav-links')).toBeVisible();

    const overflow = await measureHorizontalOverflow(page);
    await assertNoHorizontalOverflow(overflow.viewportWidth, Math.max(overflow.documentScrollWidth, overflow.bodyScrollWidth));
  });

  test('root route is the opportunities sales landing', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Travel Advantage станет:');
    await expect(page.locator('.site-header .nav-links a[href="/"]')).toHaveText('Главная');
    await expect(page.locator('.site-header a[href="/events/"]')).toHaveCount(0);
    await expect(page.locator('.opportunity-motive')).toHaveCount(5);

    const overflow = await measureHorizontalOverflow(page);
    await assertNoHorizontalOverflow(overflow.viewportWidth, Math.max(overflow.documentScrollWidth, overflow.bodyScrollWidth));
  });

  test('opportunities page presents motive links into Mira scenarios', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Travel Advantage станет:');
    await expect(page.locator('.site-header a[href="/events/"]')).toHaveCount(0);
    await expect(page.locator('.site-header a[href="/travel-lifestyle/"]')).toHaveCount(0);
    await expect(page.locator('.site-header a[href="/club/"]')).toHaveCount(0);
    await expect(page.locator('.site-header a[href="/create-trip/"]')).toHaveCount(0);
    await expect(page.locator('.site-header a[href="/business-model/"]')).toHaveCount(0);
    await expect(page.locator('.site-header a[href="/about/"]')).toHaveCount(0);
    await expect(page.locator('.opportunity-link-card')).toHaveCount(0);
    await expect(page.locator('.opportunity-motive')).toHaveCount(5);
    await expect(page.locator('.opportunity-link-grid')).toHaveCount(0);
    await expect(page.locator('.opportunity-motive-list')).toContainText('Подарите близким впечатления');
    await expect(page.locator('.opportunity-motive-list')).toContainText('Создайте business-направление вокруг путешествий');
    await expect(page.locator('.opportunity-motive-list')).not.toContainText('Как Мира ведёт разговор');
    await expect(page.getByRole('link', { name: 'Обсудить семейные поездки с Мирой' })).toHaveAttribute('href', '/mira/?scenario=family&source=events&cta=family');
    await expect(page.getByRole('link', { name: 'Смотреть русскоязычную презентацию MWR Life' })).toHaveAttribute('href', 'https://mwrlife.online/russian-presentation/KFilip909/');
    await expect(page.getByRole('link', { name: 'Смотреть русскоязычную презентацию MWR Life' })).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('link', { name: 'Разобрать Ambassador-сценарий' })).toHaveAttribute('href', '/mira/?scenario=ambassador-business&source=events&cta=ambassador-business');
    await expect(page.locator('.opportunity-final-panel')).toContainText('Начните с мотива, а не с покупки');
    await expect(page.getByRole('link', { name: 'Перейти к Мире' })).toHaveAttribute('href', '/mira/?scenario=next-step&source=events&cta=next-step');
  });

  test('opportunities motive page fits mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.opportunity-link-card')).toHaveCount(0);
    await expect(page.locator('.opportunity-motive').first()).toBeVisible();

    const overflow = await measureHorizontalOverflow(page);
    await assertNoHorizontalOverflow(overflow.viewportWidth, Math.max(overflow.documentScrollWidth, overflow.bodyScrollWidth));
  });

  test('dedicated Mira chat shows a registered-first entry panel to guests', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/mira/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-ai-page] [data-ai-panel]')).toBeVisible();
    await expect(page.locator('[data-ai-entry-gate]')).toBeVisible();
    await expect(page.locator('[data-ai-entry-gate]')).toContainText('Продолжите с Мирой в своём профиле');
    await expect(page.locator('[data-ai-question-prompt]')).toBeHidden();
    await expect(page.locator('[data-ai-form]')).toBeHidden();
    await expect(page.locator('[data-ai-entry-register]')).toHaveAttribute('href', /mode=register/);
    await expect(page.locator('[data-ai-entry-register]')).toHaveAttribute('href', /next=%2Fmira%2F%3Fsource%3Dmira%23ai-consultant/);
  });

  test('Mira scenario link routes a guest to registration and preserves scenario context', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: 'Обсудить семейные поездки с Мирой' }).click();
    await expect(page).toHaveURL(/\/auth\/\?mode=register&next=%2Fmira%2F%3Fscenario%3Dfamily%26source%3Devents%26cta%3Dfamily/);
    await expect(page.locator('[data-auth-entry-context]')).toBeVisible();
    await expect(page.locator('[data-auth-entry-context]')).toContainText('выбранный сценарий сохранится');
  });

  test('Mira welcome copy is friendly and explains authorized chat history', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/mira/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-ai-entry-gate]')).toContainText('историю разговора');
    await expect(page.locator('[data-ai-form]')).toBeHidden();
  });

  test('a fresh Mira answer opens from its first line inside the chat viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/mira/', { waitUntil: 'domcontentloaded' });

    const position = await page.evaluate(async () => {
      const messages = document.querySelector('[data-ai-messages]');
      if (!(messages instanceof HTMLElement) || typeof window.revealAiMessageStart !== 'function') {
        throw new Error('Mira message viewport helper is unavailable.');
      }

      messages.hidden = false;
      messages.replaceChildren();
      messages.style.height = '180px';
      messages.style.overflowY = 'auto';

      for (let index = 0; index < 6; index += 1) {
        const older = document.createElement('article');
        older.style.height = '90px';
        older.textContent = `Предыдущее сообщение ${index + 1}`;
        messages.append(older);
      }

      const fresh = document.createElement('article');
      fresh.style.height = '650px';
      fresh.textContent = 'Начало нового подробного ответа Миры';
      messages.append(fresh);
      messages.scrollTop = messages.scrollHeight;
      window.revealAiMessageStart(messages, fresh);
      await new Promise((resolve) => window.requestAnimationFrame(resolve));

      return {
        scrollTop: messages.scrollTop,
        expectedStart: fresh.offsetTop - messages.offsetTop - 10,
        bottom: messages.scrollHeight - messages.clientHeight,
      };
    });

    expect(position.scrollTop).toBeGreaterThanOrEqual(position.expectedStart - 1);
    expect(position.scrollTop).toBeLessThan(position.bottom);
  });

  test('dedicated Mira page focuses on auth-gated page chat', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 920 });
    await page.goto('/mira/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.site-header .brand-logo img')).toHaveAttribute('src', /travelgtc-logo-header\.webp$/);
    await expect(page.locator('[data-ai-page] .ai-panel-head .ai-logo')).toHaveCount(0);
    await expect(page.locator('.mira-banner-title')).toContainText('Спросите');
    await expect(page.locator('.mira-banner-title')).toContainText('Вашего Агента');
    await expect(page.locator('.mira-banner-title')).toContainText('Мира');
    await expect(page.locator('.mira-banner-title')).not.toContainText('Персональный');
    await expect(page.locator('.mira-banner-image')).toHaveAttribute('src', '/assets/images/processed/mira-avatar.webp');
    await expect(page.locator('[data-ai-page] [data-ai-panel]')).toBeVisible();
    await expect(page.locator('[data-ai-page] [data-ai-question-select] option')).toHaveCount(8);
    await expect(page.locator('[data-ai-page] [data-ai-entry-gate]')).toBeVisible();
    await expect(page.locator('[data-ai-page] [data-ai-question-prompt]')).toBeHidden();
    await expect(page.locator('[data-ai-page] [data-ai-voice]')).toBeHidden();
    await expect(page.locator('[data-ai-lead-link]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Открыть VIP Membership' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Открыть Free Guest Pass' })).toHaveCount(0);
    await expect(page.getByText('Free Guest Pass даёт мягкий гостевой старт')).toHaveCount(0);
    await expect(page.locator('[data-ai-entry-gate]')).toContainText(/сохранить выбранный travel-сценарий/i);
  });

  test('Mira scenario route keeps an approved first question ready after registration', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/mira/?scenario=groups', { waitUntil: 'domcontentloaded' });

    const expectedQuestion = 'У меня есть группа, ученики или клиенты. Как использовать Travel Advantage для поездок, событий и Membership?';
    await expect(page.locator('[data-ai-question-select]')).toHaveValue('');
    await expect(page.locator('[data-ai-form] input[name="question"]')).toHaveValue(expectedQuestion);
    await expect(page.locator('[data-ai-entry-register]')).toHaveAttribute('href', /scenario%3Dgroups/);

    await page.goto('/mira/?scenario=next-step', { waitUntil: 'domcontentloaded' });
    const expectedNextStepQuestion =
      'Я хочу понять, какой следующий шаг мне подходит: Free Guest Pass, Membership, VIP Membership, регистрация по партнёрской ссылке или сопровождение TravelGTC. Помоги выбрать по моей ситуации.';
    await expect(page.locator('[data-ai-question-select]')).toHaveValue('');
    await expect(page.locator('[data-ai-form] input[name="question"]')).toHaveValue(expectedNextStepQuestion);
  });

  for (const route of publicRoutes) {
    test(`public route ${route} fits mobile viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('.site-header .brand-logo img')).toHaveAttribute('src', /travelgtc-logo-header\.webp$/);
      await expect(page.locator('.site-header .brand > span')).toHaveCount(0);
      await expect(page.locator('.site-footer')).toBeVisible();

      const overflow = await measureHorizontalOverflow(page);
      await assertNoHorizontalOverflow(overflow.viewportWidth, Math.max(overflow.documentScrollWidth, overflow.bodyScrollWidth));
    });
  }

  test('favicon assets are published for browsers and devices', async ({ request }) => {
    const assets = [
      '/favicon.ico',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/apple-touch-icon.png',
      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png',
      '/site.webmanifest',
    ];

    for (const asset of assets) {
      const response = await request.get(asset);
      expect(response.ok(), `${asset} should be available`).toBeTruthy();
    }

    const manifestResponse = await request.get('/site.webmanifest');
    expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');

    const manifest = await manifestResponse.json();
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }),
      ]),
    );
  });

  test('public footer does not expose direct contact details', async ({ page, request }) => {
    const response = await request.get('/');
    const html = await response.text();
    expect(html).not.toContain('kfilipenko@kmf.ru');
    expect(html).not.toContain('+7 918 488-34-34');
    expect(html).not.toContain('tel:+79184883434');
    expect(html).not.toContain('/contacts/');
    expect(html).not.toContain('data-protected-email');
    expect(html).not.toContain('data-protected-phone');

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-footer [data-protected-email], .site-footer [data-protected-phone]')).toHaveCount(0);
    await expect(page.locator('.site-footer a[href="/mira/"]')).toHaveText('Связаться через Миру');
  });

  test('owner account receives the role-gated CRM navigation link', async ({ page }) => {
    await page.route('**/api/travelgtc/v1/auth/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          authenticated: true,
          can_access_crm: true,
          user: { displayName: 'Owner', email: 'owner@example.com' },
        }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-auth-user] [data-auth-crm-link]')).toHaveAttribute('href', '/crm/');
  });

  test('CRM administrator can manage selected Mira chats from the primary CRM list', async ({ page }) => {
    const leadId = '33333333-3333-4333-8333-333333333333';
    await page.route('**/api/travelgtc/v1/auth/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, authenticated: true, can_access_crm: true, can_manage_chats: true, user: { displayName: 'Owner', email: 'owner@example.com' } }),
      });
    });
    await page.route('**/api/travelgtc/v1/crm/leads', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, leads: [{ lead_id: leadId, created_at: '2026-08-06T10:00:00.000Z', stage: 'new', primary_interest: 'question', declared_role: 'unsure', source_path: 'ai_chat', chat_status: 'active', display_name: 'Дмитрий Викторович', primary_channel: 'email', primary_contact: 'dmitry@example.com', email: 'dmitry@example.com', phone: '', last_message: 'Хочу узнать о Membership.' }] }),
      });
    });
    await page.route(`**/api/travelgtc/v1/crm/chats/${leadId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, chat: { lead_id: leadId, status: 'archived' } }) });
        return;
      }
    });

    await page.goto('/crm/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Дмитрий Викторович')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Отметить чат Дмитрий Викторович' }).check();
    await page.locator('[data-crm-chat-bulk-action]').selectOption('archived');
    await expect(page.getByRole('button', { name: 'Применить' })).toBeEnabled();
    await page.getByRole('button', { name: 'Применить' }).click();
  });

});

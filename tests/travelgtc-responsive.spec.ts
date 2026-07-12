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
  '/about/',
  '/contacts/',
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
  for (const viewport of homeViewports) {
    test(`home page renders key sections on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

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
      await expect(page.locator('.membership-steps article')).toHaveCount(6);
      await expect(page.locator('.ai-section')).toBeVisible();
      await expect(page.locator('#ai-consultant').getByText('Мира TravelGTC')).toBeVisible();
      await expect(page.locator('[data-ai-widget]')).toBeVisible();
      await expect(page.locator('[data-ai-widget] .ai-logo')).toHaveAttribute('src', /travelgtc-logo-header\.webp$/);
      await expect(page.locator('[data-ai-starter]')).toHaveCount(3);
      await expect(page.locator('[data-ai-voice]')).toHaveCount(1);
      await expect(page.getByText('TravelGTC является партнёрской информационной страницей')).toBeVisible();
      await expect(page.locator('form[data-travelgtc-lead-form]').first()).toBeVisible();
      await expect(page.locator('.nav-links')).toHaveCount(1);
      await expect(page.locator('.nav-contact')).toHaveCount(0);
      await expect(page.locator('.menu-infographic')).toHaveCount(0);
      await expect(page.getByText('Создавайте путешествия')).toHaveCount(0);
      await expect(page.getByText('Развивайте сеть')).toHaveCount(0);
      await expect(page.getByText('Сеть - это не давление. Сеть - это доверие.')).toHaveCount(0);
      await expect(page.getByText('Хотите спокойно разобраться в Travel Advantage?')).toHaveCount(0);
      await expect(page.locator('.cta-panel')).toHaveCount(0);
      await expect(page.locator('.site-footer')).toBeVisible();

      const serviceBadges = (await page.locator('.service-grid b').allTextContents()).join('');
      const trustBadges = (await page.locator('.trust-card .icon').allTextContents()).join('');
      const processBadges = (await page.locator('.membership-steps b').allTextContents()).join('');
      expect(serviceBadges).not.toMatch(/\b\d{2}\b/);
      expect(trustBadges).not.toMatch(/\b\d{2}\b/);
      expect(processBadges).not.toMatch(/\b\d{2}\b/);

      const overflow = await measureHorizontalOverflow(page);
      await assertNoHorizontalOverflow(overflow.viewportWidth, Math.max(overflow.documentScrollWidth, overflow.bodyScrollWidth));

      const screenshotPath = path.join(screenshotsDir, `travelgtc-home-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      test.info().attach(`travelgtc-home-${viewport.name}`, { path: screenshotPath, contentType: 'image/png' });
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

  test('AI consultant opens, minimizes and requires login before saving chat', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('[data-ai-open]').first().click();
    await expect(page.locator('[data-ai-panel]')).toBeVisible();
    await expect(page.locator('[data-ai-starter]')).toHaveCount(3);
    await expect(page.locator('[data-ai-voice]')).toBeVisible();
    const formBox = await page.locator('[data-ai-form]').boundingBox();
    expect(formBox).toBeTruthy();
    expect(formBox ? formBox.y + formBox.height : 0).toBeLessThanOrEqual(900);
    await page.locator('[data-ai-minimize]').click();
    await expect(page.locator('[data-ai-panel]')).not.toBeVisible();

    await page.locator('[data-ai-open]').first().click();
    await page.locator('[data-ai-form] input[name="question"]').fill('Сколько стоит участие и как зарегистрироваться?');
    await page.locator('[data-ai-form]').locator('button[type="submit"]').click();
    await expect(page.locator('[data-ai-messages]')).toContainText(/сначала войдите или зарегистрируйтесь/i);
    await expect(page).toHaveURL(/\/auth\/\?mode=register&next=%2F%23ai-consultant/);
  });

  test('Mira starter questions are needs-discovery prompts and preserve the pending question', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('[data-ai-open]').first().click();
    await expect(page.locator('[data-ai-starter]').first()).toContainText('Путешествую с семьёй');
    await page.locator('[data-ai-starter]').first().click();
    await expect(page.locator('[data-ai-messages]')).toContainText(/сохранить историю диалога/i);
    await expect(page).toHaveURL(/\/auth\/\?mode=register&next=%2F%23ai-consultant/);
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('travelgtc_ai_pending_question') || ''))
      .toContain('семьёй');
  });

  test('Mira welcome copy is friendly and explains authorized chat history', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('[data-ai-open]').first().click();
    await expect(page.locator('[data-ai-messages]')).toContainText(/Привет, я Мира/i);
    await expect(page.locator('[data-ai-messages]')).toContainText(/историю диалога/i);
    await expect(page.locator('[data-ai-form]')).toBeVisible();
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
});

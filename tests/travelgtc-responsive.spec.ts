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

      await expect(page.locator('h1')).toContainText('Создавайте путешествия');
      await expect(page.locator('.benefit-strip')).toHaveCount(0);
      await expect(page.locator('.opportunity-gallery')).toBeVisible();
      await expect(page.locator('.opportunity-card')).toHaveCount(5);
      await expect(page.locator('.route-promo')).toBeVisible();
      await expect(page.locator('.route-options svg')).toHaveCount(5);
      await expect(page.locator('.route-options [data-code]')).toHaveCount(0);
      await expect(page.locator('.route-visual img')).toHaveAttribute('src', /travelgtc-route-map-planning-coast\.webp$/);
      await expect(page.locator('.route-script')).toHaveCSS('font-family', /Caveat/);
      if (viewport.width > 680) {
        const opportunityTitle = await page.locator('#opportunities-title').evaluate((element) => {
          const styles = window.getComputedStyle(element);
          const lineHeight = Number.parseFloat(styles.lineHeight);
          const height = element.getBoundingClientRect().height;

          return {
            height,
            lineHeight,
            whiteSpace: styles.whiteSpace,
          };
        });

        expect(opportunityTitle.whiteSpace).toBe('nowrap');
        expect(opportunityTitle.height).toBeLessThanOrEqual(opportunityTitle.lineHeight * 1.25);
      }
      await expect(page.locator('form[data-travelgtc-lead-form]').first()).toBeVisible();
      await expect(page.locator('.nav-links')).toHaveCount(1);
      await expect(page.locator('.nav-contact')).toHaveCount(0);
      await expect(page.locator('.menu-infographic')).toHaveCount(0);
      await expect(page.locator('main > section.navy')).toHaveCount(0);
      await expect(page.getByText('Новые возможности')).toHaveCount(0);
      await expect(page.getByText('Короткий запрос')).toHaveCount(0);
      await expect(page.getByText('Выберите потребность и коротко опишите запрос')).toHaveCount(0);
      await expect(page.getByText('Сеть - это не давление. Сеть - это доверие.')).toHaveCount(0);
      await expect(page.locator('.site-footer')).toBeVisible();

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

  for (const route of publicRoutes) {
    test(`public route ${route} fits mobile viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('.site-footer')).toBeVisible();

      const overflow = await measureHorizontalOverflow(page);
      await assertNoHorizontalOverflow(overflow.viewportWidth, Math.max(overflow.documentScrollWidth, overflow.bodyScrollWidth));
    });
  }
});

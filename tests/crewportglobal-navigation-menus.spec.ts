import { expect, test } from '@playwright/test';

const appPages = [
  '/index.html',
  '/vacancies/',
  '/create-profile/',
  '/post-vacancy/',
  '/register/',
];

const documentPages = [
  { path: '/for-seafarers/', active: 'For Seafarers' },
  { path: '/for-shipowners/', active: 'For Employers' },
  { path: '/how-it-works/', active: 'How It Works' },
  { path: '/legal/verification-policy/', active: 'Trust & Safety' },
];

const appLinks = [
  { name: 'Home', href: 'https://crewportglobal.com/' },
  { name: 'Vacancies', href: 'https://crewportglobal.com/vacancies/' },
  { name: 'Create Profile', href: 'https://crewportglobal.com/create-profile/' },
  { name: 'Post Vacancy', href: 'https://crewportglobal.com/post-vacancy/' },
  { name: 'Login / Register', href: 'https://crewportglobal.com/register/' },
];

const documentLinks = [
  { name: 'For Seafarers', href: 'https://crewportglobal.com/for-seafarers/' },
  { name: 'For Employers', href: 'https://crewportglobal.com/for-shipowners/' },
  { name: 'How It Works', href: 'https://crewportglobal.com/how-it-works/' },
  { name: 'Trust & Safety', href: 'https://crewportglobal.com/legal/verification-policy/' },
];

test('functional pages expose Application menu with Documents dropdown', async ({ page }) => {
  for (const path of appPages) {
    await page.goto(path);

    const nav = page.locator('nav.site-nav--application');
    await expect(nav).toBeVisible();

    for (const link of appLinks) {
      await expect(nav.getByRole('link', { name: link.name })).toHaveAttribute('href', link.href);
    }

    await expect(nav.locator(':scope > a[data-i18n="nav.forSeafarers"]')).toHaveCount(0);
    await expect(nav.locator(':scope > a[data-i18n="nav.forShipowners"]')).toHaveCount(0);
    await expect(nav.locator(':scope > a[data-i18n="nav.howItWorks"]')).toHaveCount(0);
    await expect(nav.locator(':scope > a[data-i18n="nav.trustSafety"]')).toHaveCount(0);

    const documentsMenu = nav.locator('details.nav-menu--documents');
    await expect(documentsMenu.locator('summary')).toContainText('Documents');
    await expect(documentsMenu.locator('.nav-menu__panel')).toBeHidden();

    await documentsMenu.locator('summary').click();

    for (const link of documentLinks) {
      await expect(documentsMenu.getByRole('link', { name: link.name })).toHaveAttribute('href', link.href);
    }
  }
});

test('document pages expose Documents menu with direct Application return and functional pages dropdown', async ({ page }) => {
  for (const item of documentPages) {
    await page.goto(item.path);

    const nav = page.locator('nav.site-nav--documents');
    await expect(nav).toBeVisible();
    await expect(nav.locator(':scope > a[data-i18n="nav.application"]')).toHaveAttribute(
      'href',
      'https://crewportglobal.com/',
    );
    await expect(nav.locator('.nav-section-label')).toHaveText('Documents');
    await expect(nav.getByRole('link', { name: item.active })).toHaveClass(/is-active/);
    await expect(nav.locator(':scope > a[data-i18n="nav.home"]')).toHaveCount(0);

    for (const link of documentLinks) {
      await expect(nav.getByRole('link', { name: link.name })).toHaveAttribute('href', link.href);
    }

    const applicationMenu = nav.locator('details.nav-menu--application-pages');
    await expect(applicationMenu.locator('summary')).toContainText('Functional pages');
    await expect(applicationMenu.locator('.nav-menu__panel')).toBeHidden();

    await applicationMenu.locator('summary').click();
    await expect(applicationMenu.locator('.nav-menu__panel')).toBeVisible();

    for (const link of appLinks) {
      await expect(applicationMenu.getByRole('link', { name: link.name })).toHaveAttribute('href', link.href);
    }
  }
});

test('document page menu controls expose every application and document target', async ({ page }) => {
  await page.goto('/legal/verification-policy/');

  const nav = page.locator('nav.site-nav--documents');
  const applicationLink = nav.locator(':scope > a[data-i18n="nav.application"]');
  await expect(applicationLink).toBeVisible();
  await expect(applicationLink).toHaveAttribute('href', 'https://crewportglobal.com/');

  const applicationMenu = nav.locator('details.nav-menu--application-pages');
  await applicationMenu.locator('summary').click();
  await expect(applicationMenu.locator('.nav-menu__panel')).toBeVisible();

  for (const link of appLinks) {
    const locator = applicationMenu.getByRole('link', { name: link.name });
    await expect(locator).toBeVisible();
    await expect(locator).toHaveAttribute('href', link.href);
  }

  for (const link of documentLinks) {
    const locator = nav.getByRole('link', { name: link.name });
    await expect(locator).toBeVisible();
    await expect(locator).toHaveAttribute('href', link.href);
  }
});

test('document URLs remain directly accessible without redirects', async ({ page }) => {
  for (const item of documentPages) {
    await page.goto(item.path);
    await expect(page).toHaveURL(new RegExp(`${item.path.replace(/\//g, '\\/')}$`));
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('operator page exposes dedicated Operator navigation with separated public links', async ({ page }) => {
  await page.goto('/verify/');

  const nav = page.locator('nav.site-nav--operator');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Operator Queue' })).toHaveAttribute(
    'href',
    'https://crewportglobal.com/verify/',
  );

  await expect(nav.locator(':scope > a[data-i18n="nav.home"]')).toHaveCount(0);
  await expect(nav.locator(':scope > a[data-i18n="nav.vacancies"]')).toHaveCount(0);
  await expect(nav.locator(':scope > a[data-i18n="nav.forSeafarers"]')).toHaveCount(0);

  const roleMenu = nav.locator('details.nav-menu--operator-roles');
  await expect(roleMenu.locator('summary')).toContainText('Role lanes');
  await roleMenu.locator('summary').click();
  await expect(roleMenu.getByRole('button', { name: 'Verifier' })).toBeVisible();
  await expect(roleMenu.getByRole('button', { name: 'Reviewer' })).toBeVisible();
  await roleMenu.getByRole('button', { name: 'Reviewer' }).click();
  await expect(page.locator('.operator-lane-button[data-operator-lane="reviewer"]')).toHaveClass(/is-active/);

  const publicAppMenu = nav.locator('details.nav-menu--application');
  await expect(publicAppMenu.locator('summary')).toContainText('Public app');
  await publicAppMenu.locator('summary').click();
  for (const link of appLinks) {
    await expect(publicAppMenu.getByRole('link', { name: link.name })).toHaveAttribute('href', link.href);
  }

  const referenceDocsMenu = nav.locator('details.nav-menu--documents');
  await expect(referenceDocsMenu.locator('summary')).toContainText('Reference documents');
  await referenceDocsMenu.locator('summary').click();
  for (const link of documentLinks) {
    await expect(referenceDocsMenu.getByRole('link', { name: link.name })).toHaveAttribute('href', link.href);
  }
});

import { expect, test } from '@playwright/test';

const appPages = [
  '/index.html',
  '/vacancies/',
  '/create-profile/',
  '/seafarers/job-search/',
  '/post-vacancy/',
  '/agents/',
  '/register/',
];

const documentPages = [
  { path: '/legal/verification-policy/', active: 'Verification Policy' },
];

const directDocumentPaths = [
  '/for-shipowners/',
  '/legal/verification-policy/',
];

const fullSiteGroups = [
  { className: 'home', title: 'Home' },
  { className: 'seafarers', title: 'Seafarers' },
  { className: 'employers', title: 'Shipowners' },
  { className: 'agents', title: 'Agents' },
  { className: 'documents', title: 'Documents' },
  { className: 'team', title: 'Team' },
];

const fullSiteLinks = [
  { name: 'Home', href: 'https://crewportglobal.com/' },
  { name: 'My Cabinet', href: 'https://crewportglobal.com/cabinet/' },
  { name: 'Create Profile', href: 'https://crewportglobal.com/create-profile/' },
  { name: 'Job Search', href: 'https://crewportglobal.com/seafarers/job-search/' },
  { name: 'Vacancies', href: 'https://crewportglobal.com/vacancies/' },
  { name: 'Post Vacancy', href: 'https://crewportglobal.com/post-vacancy/' },
  { name: 'Select Candidate', href: 'https://crewportglobal.com/shipowners/candidates/' },
  { name: 'Agent Portal', href: 'https://crewportglobal.com/agents/' },
  { name: 'Seafarer', href: 'https://crewportglobal.com/create-profile/?actor=agent' },
  { name: 'Demand', href: 'https://crewportglobal.com/post-vacancy/?actor=agent' },
  { name: 'Candidates', href: 'https://crewportglobal.com/shipowners/candidates/?actor=agent' },
  { name: 'Contracts', href: 'https://crewportglobal.com/contracts/workspace/?actor=agent' },
  { name: 'Terms', href: 'https://crewportglobal.com/legal/terms/' },
  { name: 'Privacy', href: 'https://crewportglobal.com/legal/privacy/' },
  { name: 'No Recruitment Fees', href: 'https://crewportglobal.com/legal/no-recruitment-fees/' },
  { name: 'Seafarer Agreement', href: 'https://crewportglobal.com/legal/seafarer-candidate-agreement/' },
  { name: 'Shipowner Agreement', href: 'https://crewportglobal.com/legal/shipowner-service-terms/' },
  { name: 'Matching Policy', href: 'https://crewportglobal.com/legal/recruitment-and-matching-policy/' },
  { name: 'Verification Policy', href: 'https://crewportglobal.com/legal/verification-policy/' },
  { name: 'Complaints', href: 'https://crewportglobal.com/legal/complaints/' },
  { name: 'Team Portal', href: 'https://crewportglobal.com/team/' },
  { name: 'Document Review', href: 'https://crewportglobal.com/team/documents/' },
  { name: 'Request-Supply Comparison', href: 'https://crewportglobal.com/team/matching/' },
  { name: 'Registry Detail', href: 'https://crewportglobal.com/team/registry/' },
  { name: 'Shortlist Drafts', href: 'https://crewportglobal.com/team/shortlists/' },
  { name: 'Translation Review', href: 'https://crewportglobal.com/team/translations/' },
  { name: 'Operator Queue', href: 'https://crewportglobal.com/verify/' },
  { name: 'Access Admin', href: 'https://crewportglobal.com/admin/access/' },
];

async function expectFullSiteMenu(nav) {
  await expect(nav.locator('.site-map-nav')).toBeVisible();

  for (const group of fullSiteGroups) {
    if (group.className === 'home') {
      await expect(nav.locator('.site-map-nav > .site-menu-group-link--home')).toHaveText(group.title);
      continue;
    }

    await expect(nav.locator(`details.nav-menu--${group.className} summary`)).toContainText(group.title);
  }

  for (const menu of await nav.locator('details.nav-menu--site-group').all()) {
    const open = await menu.evaluate((element) => element.hasAttribute('open'));
    if (!open) {
      await menu.locator('summary').click();
    }
  }

  for (const link of fullSiteLinks) {
    const locator = nav.locator(`a[href="${link.href}"]`).first();
    await expect(locator, `${link.href} should be visible in the full site menu`).toBeVisible();
    await expect(locator).toContainText(link.name);
  }
}

test('public and direct functional URLs expose visible role-grouped full site menu', async ({ page }) => {
  for (const path of appPages) {
    await page.goto(path);

    const account = page.locator('.site-header .cpg-account');
    await expect(account).toBeVisible();
    await expect(account.locator('summary')).toContainText('Account / Login');
    await expect(account.locator('.cpg-account__avatar')).toHaveCount(0);
    await account.locator('summary').click();
    await expect(account.getByRole('link', { name: 'Registration' })).toHaveAttribute('href', 'https://crewportglobal.com/register/');
    await account.getByRole('button', { name: 'Login' }).click();
    await expect(account.locator('input[name="email"]')).toBeEnabled();
    await expect(account.locator('input[name="password"]')).toBeEnabled();
    await account.locator('summary').click();

    const nav = page.locator('nav.site-nav--application');
    await expect(nav).toBeVisible();
    await expectFullSiteMenu(nav);
  }
});

test('shared theme switcher applies and persists Dark Maritime and Light Work modes', async ({ page }) => {
  await page.goto('/register/');
  await page.evaluate(() => {
    window.localStorage.removeItem('crewportglobal.theme.mode');
  });
  await page.reload();

  const themeSwitcher = page.locator('.site-header .cpg-theme-switcher');
  await expect(themeSwitcher).toBeVisible();
  await expect(themeSwitcher.locator('summary')).toContainText('Theme');
  await expect(themeSwitcher.locator('summary')).toContainText('Dark');
  await expect(page.locator('html')).toHaveAttribute('data-cpg-theme-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-cpg-theme', 'dark');

  await themeSwitcher.locator('summary').click();
  await themeSwitcher.getByRole('button', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-cpg-theme-mode', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-cpg-theme', 'light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-cpg-theme-mode', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-cpg-theme', 'light');

  await page.locator('.site-header .cpg-theme-switcher summary').click();
  await page.locator('.site-header .cpg-theme-switcher').getByRole('button', { name: 'Auto' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-cpg-theme-mode', 'auto');
});

test('cabinet, team and admin workbench pages expose the shared theme switcher', async ({ page }) => {
  const workbenchPages = [
    '/cabinet/',
    '/agents/',
    '/team/documents/',
    '/admin/access/',
  ];

  for (const path of workbenchPages) {
    await page.goto(path);
    await page.evaluate(() => {
      window.localStorage.removeItem('crewportglobal.theme.mode');
    });
    await page.reload();

    const themeSwitcher = page.locator('[data-cpg-theme-switcher] .cpg-theme-switcher').first();
    await expect(themeSwitcher).toBeVisible();
    await expect(themeSwitcher.locator('summary')).toContainText('Theme');
    await expect(page.locator('html')).toHaveAttribute('data-cpg-theme-mode', 'dark');

    await themeSwitcher.locator('summary').click();
    await themeSwitcher.getByRole('button', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-cpg-theme-mode', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-cpg-theme', 'light');
  }
});

test('compact functional screens do not create page-level horizontal overflow on mobile', async ({ page }) => {
  const compactPages = [
    '/register/',
    '/cabinet/',
    '/agents/',
    '/team/documents/',
    '/admin/access/',
    '/verify/',
  ];

  await page.setViewportSize({ width: 390, height: 820 });

  for (const path of compactPages) {
    await page.goto(path);
    await page.evaluate(() => {
      window.localStorage.setItem('crewportglobal.theme.mode', 'dark');
    });
    await page.reload();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} should not overflow horizontally`).toBeLessThanOrEqual(1);
  }
});

test('document pages expose visible role-grouped full site menu', async ({ page }) => {
  for (const item of documentPages) {
    await page.goto(item.path);

    const account = page.locator('.site-header .cpg-account');
    await expect(account).toBeVisible();
    await expect(account.locator('summary')).toContainText('Account / Login');

    const nav = page.locator('nav.site-nav--documents');
    await expect(nav).toBeVisible();
    await expectFullSiteMenu(nav);
    await expect(nav.getByRole('link', { name: item.active })).toHaveClass(/is-active/);
  }
});

test('document page menu exposes all public, team, registration and document targets', async ({ page }) => {
  await page.goto('/legal/verification-policy/');

  const account = page.locator('.site-header .cpg-account');
  await expect(account).toBeVisible();
  await account.locator('summary').click();
  await expect(account.getByRole('link', { name: 'Registration' })).toHaveAttribute('href', 'https://crewportglobal.com/register/');
  await account.getByRole('button', { name: 'Login' }).click();
  await expect(account.locator('input[name="email"]')).toBeEnabled();
  await expect(account.locator('input[name="password"]')).toBeEnabled();
  await account.locator('summary').click();

  const nav = page.locator('nav.site-nav--documents');
  await expectFullSiteMenu(nav);
});

test('document URLs remain directly accessible without redirects', async ({ page }) => {
  for (const path of directDocumentPaths) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`));
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('operator page exposes dedicated Operator navigation and full site menu', async ({ page }) => {
  await page.goto('/verify/');

  const nav = page.locator('nav.site-nav--operator');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Operator Queue' }).first()).toHaveAttribute(
    'href',
    'https://crewportglobal.com/verify/',
  );

  const roleMenu = nav.locator('details.nav-menu--operator-roles');
  await expect(roleMenu.locator('summary')).toContainText('Role lanes');
  await roleMenu.locator('summary').click();
  await expect(roleMenu.getByRole('button', { name: 'Verifier' })).toBeVisible();
  await expect(roleMenu.getByRole('button', { name: 'Reviewer' })).toBeVisible();
  await roleMenu.getByRole('button', { name: 'Reviewer' }).click();
  await expect(page.locator('.operator-lane-button[data-operator-lane="reviewer"]')).toHaveClass(/is-active/);
  await expectFullSiteMenu(nav);
});

import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const repositoryRoot = process.cwd();
const publicRoot = path.join(repositoryRoot, 'projects/crewportglobal/public');
const publicI18nRuntimePath = path.join(repositoryRoot, 'projects/crewportglobal/public/assets/crewportglobal-public-i18n.js');
const machineBundlePath = path.join(repositoryRoot, 'projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js');
const machineBundleManifestPath = path.join(repositoryRoot, 'projects/crewportglobal/i18n/runtime-bundle/manifest.json');

const forbiddenPublicTerms = [
  'static UX slice',
  'implementation slice',
  'future-scoped',
  'pending_human_review',
  'approval boundary',
  'placeholder',
  'not yet published',
  'waiting for approval',
  'publication pending',
  'future approval needed',
];

test('first visit uses supported browser language and updates html metadata', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'ru-RU',
    });
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      get: () => ['ru-RU', 'en-US'],
    });
    window.localStorage.removeItem('crewportglobal.language');
  });

  await page.goto('/index.html');

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('Найдите работу в море. Закрывайте заявки на экипаж быстрее.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('html')).toHaveAttribute('translate', 'yes');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');
});

test('first visit falls back to English when browser language is unsupported', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'pl-PL',
    });
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      get: () => ['pl-PL'],
    });
    window.localStorage.removeItem('crewportglobal.language');
  });

  await page.goto('/index.html');

  await expect(page.locator('#current-language-label')).toHaveText('English');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('en');
});

test('same-page selector translates the homepage and persists after reload', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.locator('.landing-title')).toContainText('Find work at sea. Close crew requests faster.');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page).toHaveURL(/\/index\.html/);
  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('Найдите работу в море. Закрывайте заявки на экипаж быстрее.');
  await expect(page.locator('.site-nav')).toContainText('Документы');
  await expect(page.locator('.nav-menu--employers summary')).toContainText('Работодатели');
  await expect(page.locator('.nav-menu--employers summary')).toHaveAttribute('title', 'Действия для регистрации работодателя, судов и заявок на экипаж.');
  await page.locator('.nav-menu--employers summary').click();
  await expect(page.locator('.nav-menu--employers a[href="https://crewportglobal.com/for-shipowners/"]')).toBeVisible();
  await expect(page.locator('.site-header')).toContainText('Аккаунт / Войти');
  await expect(page.locator('.site-nav')).not.toContainText('Вход / Регистрация');
  await expect(page.locator('.registry-count-label').first()).toContainText('Заявок');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('Найдите работу в море. Закрывайте заявки на экипаж быстрее.');
  await expect(page.locator('.nav-menu--employers summary')).toContainText('Работодатели');
  await expect(page.locator('.registry-count-label').first()).toContainText('Заявок');
});

test('same-page selector works on generated public pages and persists after reload', async ({ page }) => {
  await page.goto('/legal/complaints/index.html');

  await expect(page.locator('h1')).toContainText('Complaint Handling Procedure');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.site-nav')).toContainText('Для работодателей');
  await expect(page.locator('.hero-actions')).toContainText('Назад на главную');
  await expect(page.locator('.sidebar-panel')).toContainText('Публичная библиотека');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.site-nav')).toContainText('Для работодателей');
});

test('homepage falls back to English for missing non-English page translations', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Português' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Português');
  await expect(page.locator('.nav-menu--employers summary')).toContainText('Empregadores');
  await expect(page.locator('.landing-title')).toContainText('Find work at sea. Close crew requests faster.');
  await expect(page.locator('.vacancy-board').filter({ hasText: 'Latest vacancies' })).toContainText('Current public vacancy board');
});

test('homepage and vacancies pages avoid internal planning language', async ({ page }) => {
  for (const path of ['/index.html', '/vacancies/index.html']) {
    await page.goto(path);
    const bodyText = await page.locator('body').innerText();

    for (const term of forbiddenPublicTerms) {
      expect(bodyText).not.toContain(term);
    }
  }
});

test('homepage and vacancies CTAs match their destinations', async ({ page }) => {
  await page.goto('/index.html');

  const main = page.locator('main');

  const account = page.locator('.site-header .cpg-account');
  await expect(account.locator('summary')).toHaveText(/Account \/ Login/);
  await account.locator('summary').click();
  await expect(account.getByRole('link', { name: 'Registration' })).toHaveAttribute('href', 'https://crewportglobal.com/register/');
  await account.locator('summary').click();
  await expect(main.locator('#home-process-cycle')).toContainText('BP-015 operating cycle');
  await expect(main.locator('a[href="#home-process-cycle"]')).toHaveCount(0);
  await expect(main.locator('a[href="https://crewportglobal.com/legal/verification-policy/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/register/?role=seafarer"]')).toHaveText('Create profile');
  await expect(page.locator('main a[href="https://crewportglobal.com/register/?role=employer"]')).toHaveText('Post vacancy');
  await expect(main.locator('select')).toHaveCount(0);
  await expect(main.locator('input')).toHaveCount(0);
  await expect(main).not.toContainText('Create Seafarer Profile');
  await expect(main).not.toContainText('Prepare Vacancy Request');
  await expect(main).not.toContainText('Human control');
  await expect(main).not.toContainText('No automatic employment decision');
  await expect(main).not.toContainText('Employer-side clients describe demand');
  await expect(main).not.toContainText('Seafarers provide professional supply data');
  await expect(main).not.toContainText('How the platform works');

  await page.goto('/vacancies/index.html');

  await expect(page.locator('#vacancy-empty-state')).toContainText('No public vacancies are available yet');
  await expect(page.locator('#vacancy-empty-state')).toContainText('read-only summary');
  await expect(page.locator('main a[href="https://crewportglobal.com/register/"]')).toHaveCount(0);
  await expect(page.locator('main input')).toHaveCount(0);
  await expect(page.locator('main select')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/create-profile/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/post-vacancy/"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('View Details');
  await expect(page.locator('body')).not.toContainText('Create Seafarer Profile');
  await expect(page.locator('body')).not.toContainText('Prepare Vacancy Request');
});

test('register page creates platform participant and routes by role', async ({ page }) => {
  await page.route('**/api/v1/auth/register-password', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        status: 'password_credential_registered',
        draft_id: '33333333-3333-4333-8333-333333333333',
        user: {
          user_id: '22222222-2222-4222-8222-222222222222',
          email: body.email,
        },
        email_verification: {
          email_verification_status: 'pending',
          email_delivery_status: 'captured_test_only',
        },
      }),
    });
  });

  await page.goto('/register/index.html?role=seafarer');

  await expect(page.locator('h1')).toContainText('Create your platform participant account');
  await expect(page.locator('#role')).toHaveValue('seafarer');
  await expect(page.locator('[data-role]')).toHaveCount(0);

  await page.locator('#full-name').fill('Alex Person');
  await page.locator('#email').fill('alex.person@example.com');
  await page.locator('#phone').fill('+15550100');
  await page.locator('#password').fill('Password123!');
  await page.locator('#confirm-password').fill('Password123!');
  await page.locator('#terms').check();
  await page.locator('#consent').check();
  await page.locator('#register-submit').click();

  await expect(page).toHaveURL(/\/create-profile\/\?draft_id=33333333-3333-4333-8333-333333333333/);
  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.registration.person') || '{}');
    return `${payload.registration_state}|${payload.authorization_state}|${payload.email}|${payload.role}|${payload.person_id}|${payload.draft_id}`;
  })).toBe('password_credential_registered|not_granted|alex.person@example.com|seafarer|22222222-2222-4222-8222-222222222222|33333333-3333-4333-8333-333333333333');
});

test('employer participant registration routes to post-vacancy workspace', async ({ page }) => {
  await page.route('**/api/v1/auth/register-password', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        status: 'password_credential_registered',
        draft_id: '44444444-4444-4444-8444-444444444444',
        user: {
          user_id: '55555555-5555-4555-8555-555555555555',
          email: body.email,
        },
        email_verification: {
          email_verification_status: 'pending',
          email_delivery_status: 'captured_test_only',
        },
      }),
    });
  });

  await page.goto('/register/index.html?role=employer');
  await expect(page.locator('#role')).toHaveValue('employer');

  await page.locator('#full-name').fill('Emma Employer');
  await page.locator('#email').fill('emma.employer@example.com');
  await page.locator('#phone').fill('+15550200');
  await page.locator('#password').fill('Password123!');
  await page.locator('#confirm-password').fill('Password123!');
  await page.locator('#terms').check();
  await page.locator('#consent').check();
  await page.locator('#register-submit').click();

  await expect(page).toHaveURL(/\/post-vacancy\/\?draft_id=44444444-4444-4444-8444-444444444444/);
  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.registration.person') || '{}');
    return `${payload.email}|${payload.role}|${window.localStorage.getItem('crewportglobal.registration.role')}`;
  })).toBe('emma.employer@example.com|employer|employer');
});

test('fallback language page remains accessible', async ({ page }) => {
  await page.goto('/language.html');
  await expect(page.locator('h1')).toContainText('Choose the interface language');
  await expect(page.locator('main')).toContainText('English is the official platform language');
});

test('shared runtime consumes a valid prebuilt machine bundle without translating form values', async ({ page }) => {
  const runtime = fs.readFileSync(publicI18nRuntimePath, 'utf8');
  const machineBundle = fs.readFileSync(machineBundlePath, 'utf8');

  await page.setContent(`
    <html>
      <head><title>Runtime fixture</title></head>
      <body>
        <div id="language-selector">
          <button id="current-language-toggle" type="button" aria-expanded="false">
            <span id="current-language-flag"></span>
            <span id="current-language-label"></span>
          </button>
          <div id="header-language-menu" hidden>
            <div id="header-language-options"></div>
          </div>
        </div>
        <span id="machine-key" data-i18n="nav.application"></span>
        <input id="user-value" value="Captain Иван" data-i18n-placeholder="site.tagline" />
        <script>
          window.localStorage.setItem('crewportglobal.language', 'en');
        </script>
        <script>${machineBundle}</script>
        <script>${runtime}</script>
      </body>
    </html>
  `);

  await expect(page.locator('#machine-key')).toHaveText('Application');
  await expect(page.locator('#user-value')).toHaveValue('Captain Иван');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Українська' }).click();

  await expect(page.locator('#machine-key')).toHaveText('[uk machine draft] Application');
  await expect(page.locator('#user-value')).toHaveAttribute('placeholder', '[uk machine draft] Maritime documentation and matching platform');
  await expect(page.locator('#user-value')).toHaveValue('Captain Иван');
});

test('shared runtime ignores an invalid machine bundle and keeps English fallback', async ({ page }) => {
  const runtime = fs.readFileSync(publicI18nRuntimePath, 'utf8');

  await page.setContent(`
    <html>
      <head><title>Runtime fixture</title></head>
      <body>
        <span id="machine-key" data-i18n="nav.application"></span>
        <script>
          window.localStorage.setItem('crewportglobal.language', 'uk');
          window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE = {
            schema_version: 1,
            official_language: 'en',
            publication_boundary: {
              browser_provider_calls_allowed: true,
              form_value_translation_allowed: false
            },
            catalogs: {
              uk: {
                'nav.application': 'INVALID TRANSLATION'
              }
            }
          };
        </script>
        <script>${runtime}</script>
      </body>
    </html>
  `);

  await expect(page.locator('#machine-key')).toHaveText('Application');
});

test('published homepage loads the machine bundle for supported machine-localized languages', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Українська' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Українська');
  await expect(page.locator('.language-toggle__hint')).toHaveText('[uk machine draft] Language');
});

test('public pages load the machine bundle before the shared runtime', async () => {
  const manifest = JSON.parse(fs.readFileSync(machineBundleManifestPath, 'utf8')) as { publication_version?: string };
  expect(manifest.publication_version).toMatch(/^[a-f0-9]{16}$/);
  const htmlFiles: string[] = [];
  const collect = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collect(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(entryPath);
      }
    }
  };

  collect(publicRoot);

  const runtimePages = htmlFiles.filter((htmlFile) => fs.readFileSync(htmlFile, 'utf8').includes('crewportglobal-public-i18n.js'));
  expect(runtimePages.length).toBeGreaterThan(0);

  for (const htmlFile of runtimePages) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const bundleIndex = html.indexOf('crewportglobal-machine-translations.js');
    const runtimeIndex = html.indexOf('crewportglobal-public-i18n.js');
    expect(bundleIndex, `${htmlFile} must load the machine bundle`).toBeGreaterThanOrEqual(0);
    expect(bundleIndex, `${htmlFile} must load the machine bundle before shared runtime`).toBeLessThan(runtimeIndex);
    expect(
      html,
      `${htmlFile} must use the current machine bundle publication version`,
    ).toContain(`crewportglobal-machine-translations.js?v=${manifest.publication_version}`);
  }
});

test('create-profile holds the consolidated seafarer final consent and no onboarding route link', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal.language', 'ru');
  });

  await page.goto('/create-profile/index.html');

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('.nav-menu--seafarers summary')).toContainText('Моряки');
  await page.locator('.nav-menu--seafarers summary').click();
  await expect(page.locator('.nav-menu--seafarers a[href="https://crewportglobal.com/create-profile/"]')).toContainText('Создать профиль');
  await expect(page.locator('body')).toContainText('правило отсутствия платы за трудоустройство');
  await expect(page.locator('body')).toContainText('дополнительные платные услуги не являются условием доступа к работе');
  await expect(page.locator('a[href="/legal/complaints/"]')).toHaveCount(1);
  await expect(page.locator('a[href="https://crewportglobal.com/onboarding/seafarer-registration/"]')).toHaveCount(0);
  await expect(page.locator('a[href="/onboarding/seafarer-registration/"]')).toHaveCount(0);
});

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/crewportglobal', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:38123',
    headless: true,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: [
      'bash -lc',
      '"',
      'cd /var/www/gtc-form',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/001_create_registration_foundation.sql',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/002_extend_seafarer_profiles_practical_fields.sql',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/003_create_vacancy_requests.sql',
      '&& php -S 127.0.0.1:38123 -t ./projects/crewportglobal/public ./projects/crewportglobal/public/router.php',
      '"',
    ].join(' '),
    url: 'http://127.0.0.1:38123/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  }
});

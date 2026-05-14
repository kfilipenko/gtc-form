import { defineConfig } from '@playwright/test';

const host = '127.0.0.1';
const port = 38124;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/crewportglobal-registration-api.spec.ts',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/crewportglobal-api', open: 'never' }]],
  use: {
    baseURL: `http://${host}:${port}/api/v1`,
    headless: true,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
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
      '&& cd projects/crewportglobal/app/backend/api/public',
      `&& php -S ${host}:${port} router.php`,
      '"',
    ].join(' '),
    url: `http://${host}:${port}/api/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

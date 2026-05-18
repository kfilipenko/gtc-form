import { defineConfig } from '@playwright/test';

const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

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
    extraHTTPHeaders: {
      'X-CPG-Operator-Token': operatorAccessToken,
    },
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
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/004_create_vacancy_applications.sql',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/005_extend_vacancy_applications_employer_shortlist.sql',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/007_create_uploaded_documents.sql',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/008_create_user_credentials_sessions.sql',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/009_create_email_verification_tokens.sql',
      '&& export CREWPORTGLOBAL_ENV="${CREWPORTGLOBAL_ENV:-test}"',
      '&& export CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED="${CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED:-true}"',
      '&& export CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE="${CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE:-capture}"',
      '&& export CREWPORTGLOBAL_AUTH_EMAIL_VERIFICATION_TEST_MODE="${CREWPORTGLOBAL_AUTH_EMAIL_VERIFICATION_TEST_MODE:-true}"',
      '&& export CREWPORTGLOBAL_PUBLIC_BASE_URL="${CREWPORTGLOBAL_PUBLIC_BASE_URL:-http://127.0.0.1:38123}"',
      '&& export CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN="${CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN:-${CPG_OPERATOR_ACCESS_TOKEN:-crewportglobal-local-operator}}"',
      '&& php -d post_max_size=12M -d upload_max_filesize=12M -S 127.0.0.1:38123 -t ./projects/crewportglobal/public ./projects/crewportglobal/public/router.php',
      '"',
    ].join(' '),
    url: 'http://127.0.0.1:38123/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  }
});

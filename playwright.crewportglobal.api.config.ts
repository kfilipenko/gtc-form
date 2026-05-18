import { defineConfig } from '@playwright/test';

const host = '127.0.0.1';
const port = 38124;
const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

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
    extraHTTPHeaders: {
      'X-CPG-Operator-Token': operatorAccessToken,
    },
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
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/010_create_user_profile_photos.sql',
      '&& PGHOST=${PGHOST:-127.0.0.1} PGUSER=${PGUSER:-gtc_user} PGPASSWORD=${PGPASSWORD:-gtc_pass} PGDATABASE=${PGDATABASE:-gtc_db}',
      'psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/011_create_reference_catalogs.sql',
      '&& export CREWPORTGLOBAL_ENV="${CREWPORTGLOBAL_ENV:-test}"',
      '&& export CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED="${CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED:-true}"',
      '&& export CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE="${CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE:-capture}"',
      `&& export CREWPORTGLOBAL_PUBLIC_BASE_URL="\${CREWPORTGLOBAL_PUBLIC_BASE_URL:-http://${host}:${port}}"`,
      '&& export CREWPORTGLOBAL_AUTH_EMAIL_VERIFICATION_TEST_MODE="${CREWPORTGLOBAL_AUTH_EMAIL_VERIFICATION_TEST_MODE:-true}"',
      '&& cd projects/crewportglobal/app/backend/api/public',
      '&& export CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN="${CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN:-${CPG_OPERATOR_ACCESS_TOKEN:-crewportglobal-local-operator}}"',
      `&& php -d post_max_size=12M -d upload_max_filesize=12M -S ${host}:${port} router.php`,
      '"',
    ].join(' '),
    url: `http://${host}:${port}/api/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

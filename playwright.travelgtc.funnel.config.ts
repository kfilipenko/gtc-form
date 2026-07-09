import { defineConfig } from '@playwright/test';

const baseURL = process.env.TRAVELGTC_FUNNEL_BASE_URL || 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './tests',
  testMatch: /travelgtc-funnel\.spec\.ts/,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list']],
  outputDir: 'projects/travelgtc/test-artifacts/funnel-test-results',
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.TRAVELGTC_FUNNEL_BASE_URL
    ? undefined
    : {
        command: 'projects/travelgtc/scripts/start_funnel_test_servers.sh',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 45_000,
      },
});

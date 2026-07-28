import { defineConfig } from '@playwright/test';

const baseURL = process.env.TRAVELGTC_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests',
  testMatch: /travelgtc-(responsive|mira-funnel)\.spec\.ts/,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list']],
  outputDir: 'projects/travelgtc/test-artifacts/test-results',
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.TRAVELGTC_BASE_URL
    ? undefined
    : {
        command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory projects/travelgtc/public',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});

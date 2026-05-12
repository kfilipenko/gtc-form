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
    command: 'php -S 127.0.0.1:38123 -t ./projects/crewportglobal/public ./projects/crewportglobal/public/router.php',
    url: 'http://127.0.0.1:38123/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  }
});
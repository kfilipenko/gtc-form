import { defineConfig } from '@playwright/test';
import path from 'path';

const fallbackBase = 'http://localhost:3000';
const baseURL = process.env.CHAT_BASE_URL || fallbackBase;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  // Serve static files locally to avoid hitting prod (403) during tests.
  webServer: {
    command: 'python3 -m http.server 3000',
    url: fallbackBase,
    reuseExistingServer: true,
    cwd: path.resolve(__dirname),
    timeout: 30_000
  }
});

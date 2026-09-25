import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', testMatch: ['travelgtc-strategy.spec.ts', 'travelgtc-conversion.spec.ts', 'travelgtc-journeys.spec.ts'], workers: 1, timeout: 45000,
  reporter: [['list']], outputDir: './test-artifacts/browser',
  use: { baseURL: 'http://127.0.0.1:4189', headless: true, screenshot: 'only-on-failure' },
  webServer: { command: 'python3 -m http.server 4189 --bind 127.0.0.1 --directory projects/travelgtc/public',
    url: 'http://127.0.0.1:4189', reuseExistingServer: false },
});

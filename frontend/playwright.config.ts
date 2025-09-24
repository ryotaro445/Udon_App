// frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['**/*.test.*', 'src/**'],
  timeout: 60_000,
  expect: { timeout: 5_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'customer-mobile', use: { ...devices['iPhone 14'] } },
    { name: 'staff-desktop',   use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: [{
    command: 'npm run dev:both',          // ← バック＆フロント同時起動
    url: 'http://127.0.0.1:5173',         // ← フロントの到達のみ待機
    reuseExistingServer: !process.env.CI,
    timeout: 180_000                      // ← 余裕を持たせる
  }]
});
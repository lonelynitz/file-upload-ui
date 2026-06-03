import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    headless: true,
    actionTimeout: 10_000,
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
});

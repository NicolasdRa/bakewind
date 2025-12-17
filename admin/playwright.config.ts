import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile tests disabled until browsers are installed: npx playwright install
    // {
    //   name: 'mobile',
    //   use: { ...devices['iPhone 14 Pro'] },
    // },
  ],
  // Only start admin frontend - API server should be running externally
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});

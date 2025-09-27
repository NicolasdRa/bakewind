import { chromium, FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 *
 * This runs once after all tests to:
 * - Clean up test database
 * - Remove test files
 * - Reset test environment
 */
async function globalTeardown(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🧹 Cleaning up E2E test environment...');

  try {
    // Clean up test database
    console.log('🗑️ Cleaning up test database...');
    const dbCleanupResponse = await page.request.post('http://localhost:3010/api/test/cleanup-database');

    if (!dbCleanupResponse.ok()) {
      console.warn(`Warning: Failed to cleanup test database: ${dbCleanupResponse.status()}`);
    }

    // Reset any test state
    console.log('🔄 Resetting test state...');
    await page.request.post('http://localhost:3010/api/test/reset-state');

    console.log('✅ E2E test environment cleanup complete');

  } catch (error) {
    console.warn('⚠️ Warning: Failed to fully cleanup E2E test environment:', error);
    // Don't throw here - we don't want teardown failures to fail the test run
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
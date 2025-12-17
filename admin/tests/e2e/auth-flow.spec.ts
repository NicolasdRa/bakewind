import { test, expect } from '@playwright/test';

/**
 * T086: E2E Authentication & Dashboard Access
 * Tests: Login flow, redirect to dashboard, session persistence
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies/storage before each test
    await page.context().clearCookies();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login form with email and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should disable submit button when form is empty', async ({ page }) => {
    await page.goto('/login');

    // Button should be disabled when form is empty
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await expect(submitButton).toBeDisabled();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in test credentials (assumes test user exists)
    await page.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|failed/i')).toBeVisible({ timeout: 5000 });
  });
});

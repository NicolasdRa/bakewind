import { test, expect } from '@playwright/test';

/**
 * T093: E2E Theme Toggle
 * Tests: Dark mode toggle, persistence
 */
test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should have theme toggle button in sidebar', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Look for theme toggle button
    const themeButton = page.locator('button:has-text("Dark Mode"), button:has-text("Light Mode")');
    await expect(themeButton).toBeVisible();
  });

  test('should toggle theme when clicked', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const themeButton = page.locator('button:has-text("Dark Mode"), button:has-text("Light Mode")');

    // Get initial theme
    const initialTheme = await page.locator('html').getAttribute('data-theme');

    // Click theme toggle
    await themeButton.click();

    // Theme should change
    const newTheme = await page.locator('html').getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should persist theme across page navigation', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const themeButton = page.locator('button:has-text("Dark Mode"), button:has-text("Light Mode")');

    // Set to light mode if currently dark
    if (await page.locator('button:has-text("Dark Mode")').isVisible()) {
      await themeButton.click();
    }

    const currentTheme = await page.locator('html').getAttribute('data-theme');

    // Navigate to another page
    await page.goto('/dashboard/inventory');

    // Theme should persist
    const themeAfterNav = await page.locator('html').getAttribute('data-theme');
    expect(themeAfterNav).toBe(currentTheme);
  });

  test('should persist theme after page reload', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const themeButton = page.locator('button:has-text("Dark Mode"), button:has-text("Light Mode")');
    await themeButton.click();

    const themeBeforeReload = await page.locator('html').getAttribute('data-theme');

    // Reload page
    await page.reload();

    const themeAfterReload = await page.locator('html').getAttribute('data-theme');
    expect(themeAfterReload).toBe(themeBeforeReload);
  });

  test('should show correct icon for current theme', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const currentTheme = await page.locator('html').getAttribute('data-theme');

    if (currentTheme === 'light') {
      // Should show moon icon for "switch to dark"
      await expect(page.locator('text=🌙')).toBeVisible();
    } else {
      // Should show sun icon for "switch to light"
      await expect(page.locator('text=☀️')).toBeVisible();
    }
  });
});

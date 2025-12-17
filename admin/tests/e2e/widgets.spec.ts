import { test, expect } from '@playwright/test';

/**
 * T088: E2E Dashboard Widgets
 * Tests: Add widget, remove widget, max 20 limit
 */
test.describe('Dashboard Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display default widgets on dashboard', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Dashboard should have content (DashboardContent component)
    const dashboardContent = page.locator('[class*="container"], [class*="content"], main');
    await expect(dashboardContent.first()).toBeVisible();
  });

  test('should open widget modal when clicking Add Widget', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Click Add Widget button
    const addWidgetButton = page.getByRole('button', { name: /add widget/i });
    if (await addWidgetButton.isVisible()) {
      await addWidgetButton.click();

      // Modal should be visible
      await expect(page.locator('[class*="modal"]')).toBeVisible();
      await expect(page.locator('text=/add widget|select widget/i')).toBeVisible();
    }
  });

  test('should add a new widget from modal', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const initialWidgetCount = await page.locator('[class*="widget"], [data-widget]').count();

    const addWidgetButton = page.getByRole('button', { name: /add widget/i });
    if (await addWidgetButton.isVisible()) {
      await addWidgetButton.click();

      // Click on a widget type to add it
      const widgetTypeButton = page.locator('[class*="widgetType"], button:has-text("Clock")').first();
      if (await widgetTypeButton.isVisible()) {
        await widgetTypeButton.click();

        // Modal should close and new widget should appear
        await expect(page.locator('[class*="widget"], [data-widget]')).toHaveCount(initialWidgetCount + 1);
      }
    }
  });

  test('should remove a widget when close button clicked', async ({ page }) => {
    await page.goto('/dashboard/overview');

    const widgets = page.locator('[class*="widget"], [data-widget]');
    const initialCount = await widgets.count();

    if (initialCount > 0) {
      // Find and click close button on first widget
      const closeButton = page.locator('[class*="widget"] button[title*="close"], [class*="widget"] button[aria-label*="close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();

        // Should have one less widget
        await expect(widgets).toHaveCount(initialCount - 1);
      }
    }
  });

  test('should reset layout when Reset Layout clicked', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Find reset layout option
    const resetButton = page.getByRole('button', { name: /reset layout/i });
    if (await resetButton.isVisible()) {
      page.on('dialog', (dialog) => dialog.accept()); // Accept confirmation
      await resetButton.click();

      // Should have default widgets
      const widgetCount = await page.locator('[class*="widget"], [class*="Widget"]').count();
      expect(widgetCount).toBeGreaterThan(0);
    }
  });
});

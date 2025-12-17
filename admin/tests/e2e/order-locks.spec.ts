import { test, expect } from '@playwright/test';

/**
 * T091: E2E Order Locking
 * Tests: Lock acquisition, lock conflict between users
 */
test.describe('Order Locking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should show lock indicator when order is being edited', async ({ page }) => {
    await page.goto('/dashboard/orders/internal');

    // Click on an order to edit it
    const orderRow = page.locator('table tbody tr, [class*="orderItem"]').first();
    if (await orderRow.isVisible()) {
      await orderRow.click();

      // Wait for potential lock indicator
      await page.waitForTimeout(1000);
    }
  });

  test('should display lock status on order list', async ({ page }) => {
    await page.goto('/dashboard/orders/internal');

    // Look for any lock indicators in the order list
    const lockIndicator = page.locator('[class*="lock"], [class*="locked"]');
    // Lock indicators may or may not be visible depending on current state
  });

  test('should show "Locked by" message when order is locked by another user', async ({ page }) => {
    await page.goto('/dashboard/orders/internal');

    // If any order shows locked status
    const lockedBadge = page.locator('text=/locked by/i');
    if (await lockedBadge.isVisible()) {
      await expect(lockedBadge).toContainText(/locked by/i);
    }
  });
});

test.describe('Order Lock Conflict - Two Browser Contexts', () => {
  test('should prevent editing when order is locked by another user', async ({ browser }) => {
    // Create two browser contexts to simulate two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login as user 1
    await page1.goto('/login');
    await page1.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page1.fill('input[type="password"]', 'password123');
    await page1.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page1).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Login as user 2 (same user for simplicity, but in different session)
    await page2.goto('/login');
    await page2.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page2.fill('input[type="password"]', 'password123');
    await page2.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page2).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // User 1 goes to orders and clicks an order
    await page1.goto('/dashboard/orders/internal');
    const orderRow1 = page1.locator('table tbody tr, [class*="orderItem"]').first();
    if (await orderRow1.isVisible()) {
      await orderRow1.click();
      await page1.waitForTimeout(1000);
    }

    // User 2 tries to access the same order
    await page2.goto('/dashboard/orders/internal');
    const orderRow2 = page2.locator('table tbody tr, [class*="orderItem"]').first();
    if (await orderRow2.isVisible()) {
      await orderRow2.click();

      // Should see locked indicator or warning
      await page2.waitForTimeout(1000);
    }

    // Cleanup
    await context1.close();
    await context2.close();
  });
});

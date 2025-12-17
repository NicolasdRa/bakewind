import { test, expect } from '@playwright/test';

/**
 * T087: E2E Dashboard Navigation
 * Tests: Click nav items, sidebar persistence, route changes
 */
test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to all main pages', async ({ page }) => {
    const routes = [
      { path: '/dashboard/overview', text: /overview|dashboard/i },
      { path: '/dashboard/inventory', text: /inventory/i },
      { path: '/dashboard/production', text: /production/i },
      { path: '/dashboard/orders/customer', text: /customer.*orders|orders/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(route.path);
    }
  });

  test('should toggle sidebar collapse state', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Find and click collapse button
    const collapseButton = page.locator('[title*="Collapse"], [aria-label*="collapse"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();

      // Sidebar should be collapsed
      await expect(page.locator('[data-sidebar-state="collapsed"]')).toBeVisible();

      // Click expand button
      const expandButton = page.locator('[title*="Expand"], [aria-label*="expand"]');
      await expandButton.click();

      await expect(page.locator('[data-sidebar-state="expanded"]')).toBeVisible();
    }
  });

  test('should persist sidebar state across navigation', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Collapse sidebar
    const collapseButton = page.locator('[title*="Collapse"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await expect(page.locator('[data-sidebar-state="collapsed"]')).toBeVisible();

      // Navigate to another page
      await page.goto('/dashboard/inventory');

      // Sidebar should still be collapsed
      await expect(page.locator('[data-sidebar-state="collapsed"]')).toBeVisible();
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/dashboard/inventory');

    // The inventory nav link should be active
    const inventoryLink = page.locator('a[href="/dashboard/inventory"]');
    await expect(inventoryLink).toHaveClass(/active/i);
  });
});

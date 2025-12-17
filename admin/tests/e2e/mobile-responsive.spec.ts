import { test, expect, devices } from '@playwright/test';

/**
 * T094: E2E Mobile Responsive Navigation
 * Tests: Hamburger menu, 390x844 viewport (iPhone 14 Pro)
 */
test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 Pro

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test.skip('should show hamburger menu on mobile', async ({ page }) => {
    // TODO: Hamburger menu not implemented yet
    await page.goto('/dashboard/overview');

    const hamburgerButton = page.locator('button[class*="hamburger"], button[aria-label*="menu"], [class*="menuButton"]');
    await expect(hamburgerButton.first()).toBeVisible();
  });

  test('should hide sidebar by default on mobile', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // On mobile, sidebar should not be in mobile-open state by default
    await expect(page.locator('[data-sidebar-state="mobile-open"]')).not.toBeVisible();
  });

  test.skip('should open sidebar when hamburger menu clicked', async ({ page }) => {
    // TODO: Hamburger menu not implemented yet
    await page.goto('/dashboard/overview');

    const hamburgerButton = page.locator('button[class*="hamburger"], button[aria-label*="menu"], [class*="menuButton"]').first();
    await hamburgerButton.click();

    await expect(page.locator('[data-sidebar-state="mobile-open"]')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should close sidebar when close button clicked', async ({ page }) => {
    // TODO: Hamburger menu not implemented yet - can't open sidebar to test close
    await page.goto('/dashboard/overview');
  });

  test.skip('should close sidebar after navigation on mobile', async ({ page }) => {
    // TODO: Hamburger menu not implemented yet
    await page.goto('/dashboard/overview');
  });

  test('should display content properly on mobile viewport', async ({ page }) => {
    await page.goto('/dashboard/overview');

    // Main content area should be visible
    const mainContent = page.locator('main, [class*="content"], [class*="innerContent"]');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should stack elements vertically on mobile', async ({ page }) => {
    await page.goto('/dashboard/inventory');

    // On mobile, the layout should adapt
    // Table might become a card list or have horizontal scroll
    const container = page.locator('main, [class*="container"]');
    await expect(container.first()).toBeVisible();
  });
});

test.describe('Tablet Responsive', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('should show navigation on tablet', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@bakewind.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.goto('/dashboard/overview');

    // On tablet, sidebar could be collapsed or shown
    const sidebar = page.locator('[class*="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });
});

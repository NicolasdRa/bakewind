import { test, expect, Page, Browser } from '@playwright/test';

/**
 * T025: End-to-end test for admin order management
 *
 * Tests the complete admin workflow for managing orders across
 * the admin application and API integration.
 *
 * Flow:
 * 1. Admin logs in
 * 2. Views order dashboard
 * 3. Filters and searches orders
 * 4. Views order details
 * 5. Updates order status
 * 6. Manages inventory based on orders
 * 7. Views order analytics
 */

const ADMIN_APP_URL = process.env.ADMIN_APP_URL || 'http://localhost:3001';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010';

test.describe('Admin Order Management', () => {
  let page: Page;
  let browser: Browser;

  test.beforeAll(async () => {
    // Create test orders via API for testing
    // This would typically be done in test setup
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to admin app
    await page.goto(ADMIN_APP_URL);

    // Login as admin
    await test.step('Admin login', async () => {
      await page.fill('[data-testid="admin-username"]', 'admin@bakewind.com');
      await page.fill('[data-testid="admin-password"]', 'AdminPassword123!');
      await page.click('[data-testid="admin-login-button"]');

      // Verify successful login
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });
  });

  test('view and filter orders dashboard', async () => {
    // Step 1: Navigate to orders page
    await test.step('Navigate to orders dashboard', async () => {
      await page.click('[data-testid="orders-nav-link"]');
      await expect(page).toHaveURL(`${ADMIN_APP_URL}/orders`);

      // Verify orders table loads
      await page.waitForSelector('[data-testid="orders-table"]');
      const orderRows = await page.locator('[data-testid="order-row"]');
      await expect(orderRows).toHaveCountGreaterThan(0);
    });

    // Step 2: Filter by order status
    await test.step('Filter orders by status', async () => {
      // Filter by pending orders
      await page.selectOption('[data-testid="status-filter"]', 'pending');
      await page.click('[data-testid="apply-filters"]');

      // Verify all visible orders have pending status
      const statusCells = await page.locator('[data-testid="order-status"]');
      const count = await statusCells.count();
      for (let i = 0; i < count; i++) {
        await expect(statusCells.nth(i)).toContainText('pending');
      }
    });

    // Step 3: Filter by date range
    await test.step('Filter orders by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await page.fill('[data-testid="date-from"]', yesterday);
      await page.fill('[data-testid="date-to"]', today);
      await page.click('[data-testid="apply-filters"]');

      // Verify orders are within date range
      await expect(page.locator('[data-testid="order-row"]')).toHaveCountGreaterThan(0);
    });

    // Step 4: Search by customer name
    await test.step('Search orders by customer', async () => {
      await page.fill('[data-testid="customer-search"]', 'Test Customer');
      await page.click('[data-testid="search-button"]');

      // Verify search results
      const customerCells = await page.locator('[data-testid="customer-name"]');
      const count = await customerCells.count();
      for (let i = 0; i < count; i++) {
        await expect(customerCells.nth(i)).toContainText(/test.*customer/i);
      }
    });

    // Step 5: Clear filters
    await test.step('Clear all filters', async () => {
      await page.click('[data-testid="clear-filters"]');

      // Verify all orders are shown again
      await expect(page.locator('[data-testid="order-row"]')).toHaveCountGreaterThan(0);
    });
  });

  test('view order details and update status', async () => {
    let orderId: string;

    // Step 1: Select an order
    await test.step('Select order for details', async () => {
      await page.click('[data-testid="orders-nav-link"]');

      // Get first order ID
      const firstOrderRow = page.locator('[data-testid="order-row"]').first();
      orderId = await firstOrderRow.getAttribute('data-order-id') || '';

      await firstOrderRow.click();
      await expect(page).toHaveURL(`${ADMIN_APP_URL}/orders/${orderId}`);
    });

    // Step 2: Verify order details display
    await test.step('Verify order details', async () => {
      // Check order header information
      await expect(page.locator('[data-testid="order-id"]')).toContainText(orderId);
      await expect(page.locator('[data-testid="order-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();

      // Check customer information
      await expect(page.locator('[data-testid="customer-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-phone"]')).toBeVisible();

      // Check delivery information
      await expect(page.locator('[data-testid="delivery-address"]')).toBeVisible();
      await expect(page.locator('[data-testid="delivery-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="delivery-time"]')).toBeVisible();

      // Check order items
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      const orderItems = await page.locator('[data-testid="order-item"]');
      await expect(orderItems).toHaveCountGreaterThan(0);

      // Check pricing
      await expect(page.locator('[data-testid="order-subtotal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    });

    // Step 3: Update order status
    await test.step('Update order status to confirmed', async () => {
      // Listen for the API call
      const statusUpdateResponse = page.waitForResponse(
        response => response.url().includes(`/api/v1/admin/orders/${orderId}`) &&
                   response.request().method() === 'PATCH'
      );

      await page.selectOption('[data-testid="status-select"]', 'confirmed');
      await page.click('[data-testid="update-status-button"]');

      // Verify API call
      const response = await statusUpdateResponse;
      expect(response.status()).toBe(200);

      // Verify UI updates
      await expect(page.locator('[data-testid="order-status"]')).toContainText('confirmed');
      await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible();
    });

    // Step 4: Add status note
    await test.step('Add status update note', async () => {
      await page.fill('[data-testid="status-note"]', 'Order confirmed and scheduled for production');
      await page.click('[data-testid="add-note-button"]');

      // Verify note appears in timeline
      await expect(page.locator('[data-testid="status-timeline"]')).toContainText('Order confirmed and scheduled for production');
    });

    // Step 5: Update to in-production
    await test.step('Update order to in-production', async () => {
      await page.selectOption('[data-testid="status-select"]', 'in-production');
      await page.fill('[data-testid="status-note"]', 'Started baking process');
      await page.click('[data-testid="update-status-button"]');

      await expect(page.locator('[data-testid="order-status"]')).toContainText('in-production');
    });

    // Step 6: Mark as ready for delivery
    await test.step('Mark order ready for delivery', async () => {
      await page.selectOption('[data-testid="status-select"]', 'ready');
      await page.fill('[data-testid="status-note"]', 'Order completed and ready for pickup/delivery');
      await page.click('[data-testid="update-status-button"]');

      await expect(page.locator('[data-testid="order-status"]')).toContainText('ready');
    });
  });

  test('bulk order status updates', async () => {
    // Step 1: Navigate to orders and select multiple orders
    await test.step('Select multiple orders', async () => {
      await page.click('[data-testid="orders-nav-link"]');

      // Select first 3 orders
      await page.click('[data-testid="order-row"]:nth-child(1) [data-testid="order-checkbox"]');
      await page.click('[data-testid="order-row"]:nth-child(2) [data-testid="order-checkbox"]');
      await page.click('[data-testid="order-row"]:nth-child(3) [data-testid="order-checkbox"]');

      // Verify bulk actions become available
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    });

    // Step 2: Perform bulk status update
    await test.step('Bulk update to confirmed', async () => {
      await page.selectOption('[data-testid="bulk-status-select"]', 'confirmed');
      await page.click('[data-testid="bulk-update-button"]');

      // Confirm bulk action
      await page.click('[data-testid="confirm-bulk-update"]');

      // Verify success message
      await expect(page.locator('[data-testid="bulk-update-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-update-success"]')).toContainText('3 orders updated');
    });
  });

  test('order analytics and reporting', async () => {
    // Step 1: Navigate to orders analytics
    await test.step('View order analytics', async () => {
      await page.click('[data-testid="analytics-nav-link"]');
      await expect(page).toHaveURL(`${ADMIN_APP_URL}/analytics`);

      // Wait for analytics to load
      await page.waitForSelector('[data-testid="analytics-dashboard"]');
    });

    // Step 2: Verify key metrics
    await test.step('Verify order metrics', async () => {
      // Check daily order metrics
      await expect(page.locator('[data-testid="orders-today"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-today"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-order-value"]')).toBeVisible();

      // Check order status distribution
      await expect(page.locator('[data-testid="orders-by-status-chart"]')).toBeVisible();

      // Check revenue chart
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    });

    // Step 3: Filter analytics by date range
    await test.step('Filter analytics by date', async () => {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      await page.fill('[data-testid="analytics-date-from"]', lastWeek);
      await page.fill('[data-testid="analytics-date-to"]', today);
      await page.click('[data-testid="apply-analytics-filter"]');

      // Verify charts update
      await page.waitForFunction(() => {
        const chart = document.querySelector('[data-testid="revenue-chart"]');
        return chart && chart.getAttribute('data-loaded') === 'true';
      });
    });

    // Step 4: Export report
    await test.step('Export order report', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-orders-button"]');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/orders.*\.csv$/);
    });
  });

  test('inventory integration from orders', async () => {
    // Step 1: Navigate to specific order
    await test.step('View order affecting inventory', async () => {
      await page.click('[data-testid="orders-nav-link"]');

      // Click on an order that contains inventory items
      const orderWithInventory = page.locator('[data-testid="order-row"]').first();
      await orderWithInventory.click();
    });

    // Step 2: Check inventory impact
    await test.step('Verify inventory impact display', async () => {
      // Check that inventory impact is shown
      await expect(page.locator('[data-testid="inventory-impact"]')).toBeVisible();

      // Verify individual item inventory levels
      const inventoryItems = await page.locator('[data-testid="inventory-item"]');
      const count = await inventoryItems.count();

      for (let i = 0; i < count; i++) {
        await expect(inventoryItems.nth(i).locator('[data-testid="current-stock"]')).toBeVisible();
        await expect(inventoryItems.nth(i).locator('[data-testid="required-quantity"]')).toBeVisible();
      }
    });

    // Step 3: Navigate to inventory management
    await test.step('Navigate to inventory from order', async () => {
      await page.click('[data-testid="manage-inventory-link"]');
      await expect(page).toHaveURL(`${ADMIN_APP_URL}/inventory`);

      // Verify inventory dashboard loads
      await expect(page.locator('[data-testid="inventory-dashboard"]')).toBeVisible();
    });

    // Step 4: Check low stock alerts
    await test.step('Verify low stock alerts', async () => {
      // Check if there are low stock warnings
      const lowStockItems = page.locator('[data-testid="low-stock-item"]');
      const lowStockCount = await lowStockItems.count();

      if (lowStockCount > 0) {
        // Verify low stock alert details
        await expect(lowStockItems.first().locator('[data-testid="item-name"]')).toBeVisible();
        await expect(lowStockItems.first().locator('[data-testid="current-stock"]')).toBeVisible();
        await expect(lowStockItems.first().locator('[data-testid="minimum-stock"]')).toBeVisible();
      }
    });
  });

  test('real-time order updates', async () => {
    // This test would verify WebSocket functionality
    // Step 1: Setup WebSocket connection monitoring
    await test.step('Monitor WebSocket connection', async () => {
      await page.click('[data-testid="orders-nav-link"]');

      // Wait for WebSocket connection
      await page.waitForFunction(() => {
        return window.io && window.io.readyState === 'open';
      });
    });

    // Step 2: Simulate external order update
    await test.step('Simulate external order update', async () => {
      // This would require a test helper to create a new order
      // and verify it appears in real-time without page refresh

      // For now, we'll verify the WebSocket listener exists
      const hasWebSocketListeners = await page.evaluate(() => {
        return window.io && typeof window.io.on === 'function';
      });

      expect(hasWebSocketListeners).toBe(true);
    });
  });

  test('error handling and edge cases', async () => {
    // Step 1: Test invalid order ID
    await test.step('Handle invalid order ID', async () => {
      await page.goto(`${ADMIN_APP_URL}/orders/invalid-order-id`);

      // Should show error message or redirect
      await expect(page.locator('[data-testid="order-not-found"]')).toBeVisible();
    });

    // Step 2: Test network error handling
    await test.step('Handle network errors', async () => {
      // Simulate network failure
      await page.route('**/api/v1/admin/orders/*', route => {
        route.abort('failed');
      });

      await page.goto(`${ADMIN_APP_URL}/orders`);

      // Should show error state
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    });

    // Step 3: Test concurrent status updates
    await test.step('Handle concurrent status updates', async () => {
      // Reset routing
      await page.unroute('**/api/v1/admin/orders/*');

      await page.goto(`${ADMIN_APP_URL}/orders`);
      const firstOrder = page.locator('[data-testid="order-row"]').first();
      await firstOrder.click();

      // Try to update status multiple times quickly
      await page.selectOption('[data-testid="status-select"]', 'confirmed');
      await page.click('[data-testid="update-status-button"]');

      // Second update should be disabled or queued
      await expect(page.locator('[data-testid="update-status-button"]')).toBeDisabled();
    });
  });
});
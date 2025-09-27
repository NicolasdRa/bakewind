import { test, expect, Page, Browser } from '@playwright/test';

/**
 * T026: Test for WebSocket real-time updates
 *
 * Tests real-time data synchronization between customer and admin applications
 * via WebSocket connections to the API.
 *
 * Scenarios:
 * 1. Order status updates from admin → customer notification
 * 2. New orders from customer → admin dashboard updates
 * 3. Inventory updates from admin → customer product availability
 * 4. Connection handling (disconnect/reconnect)
 * 5. Room-based broadcasting (customer-specific vs admin-global)
 */

const CUSTOMER_APP_URL = process.env.CUSTOMER_APP_URL || 'http://localhost:3000';
const ADMIN_APP_URL = process.env.ADMIN_APP_URL || 'http://localhost:3001';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010';

test.describe('WebSocket Real-time Updates', () => {
  let customerPage: Page;
  let adminPage: Page;
  let browser: Browser;

  test.beforeEach(async ({ browser: testBrowser }) => {
    browser = testBrowser;

    // Create separate contexts and pages for customer and admin
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();

    customerPage = await customerContext.newPage();
    adminPage = await adminContext.newPage();

    // Setup customer session
    await test.step('Setup customer session', async () => {
      await customerPage.goto(CUSTOMER_APP_URL);

      // Login customer
      await customerPage.click('[data-testid="login-link"]');
      await customerPage.fill('[data-testid="login-email"]', 'test.customer@example.com');
      await customerPage.fill('[data-testid="login-password"]', 'TestPassword123!');
      await customerPage.click('[data-testid="login-button"]');

      // Verify customer logged in
      await expect(customerPage.locator('[data-testid="user-menu"]')).toBeVisible();

      // Wait for WebSocket connection
      await customerPage.waitForFunction(() => {
        return window.io && window.io.readyState === 'open';
      });
    });

    // Setup admin session
    await test.step('Setup admin session', async () => {
      await adminPage.goto(ADMIN_APP_URL);

      // Login admin
      await adminPage.fill('[data-testid="admin-username"]', 'admin@bakewind.com');
      await adminPage.fill('[data-testid="admin-password"]', 'AdminPassword123!');
      await adminPage.click('[data-testid="admin-login-button"]');

      // Verify admin logged in
      await expect(adminPage.locator('[data-testid="admin-dashboard"]')).toBeVisible();

      // Wait for WebSocket connection
      await adminPage.waitForFunction(() => {
        return window.io && window.io.readyState === 'open';
      });
    });
  });

  test.afterEach(async () => {
    await customerPage?.close();
    await adminPage?.close();
  });

  test('order status updates from admin to customer', async () => {
    let orderId: string;

    // Step 1: Customer creates an order
    await test.step('Customer creates order', async () => {
      // Navigate to products and add item to cart
      await customerPage.goto(`${CUSTOMER_APP_URL}/products`);
      await customerPage.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
      await customerPage.click('[data-testid="cart-link"]');
      await customerPage.click('[data-testid="checkout-button"]');

      // Fill delivery info (customer already logged in)
      await customerPage.fill('[data-testid="address-line1"]', '123 WebSocket Test St');
      await customerPage.fill('[data-testid="address-city"]', 'Test City');
      await customerPage.fill('[data-testid="address-postal-code"]', '12345');

      // Set delivery date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await customerPage.fill('[data-testid="delivery-date"]', tomorrowStr);

      // Fill payment info
      await customerPage.fill('[data-testid="card-number"]', '4111111111111111');
      await customerPage.fill('[data-testid="card-expiry"]', '12/25');
      await customerPage.fill('[data-testid="card-cvc"]', '123');

      // Place order and get order ID
      const orderResponse = customerPage.waitForResponse(
        response => response.url().includes('/api/v1/orders') && response.request().method() === 'POST'
      );

      await customerPage.click('[data-testid="place-order-button"]');
      const response = await orderResponse;
      const orderData = await response.json();
      orderId = orderData.id;

      // Navigate to order tracking page
      await customerPage.goto(`${CUSTOMER_APP_URL}/orders/${orderId}`);
      await expect(customerPage.locator('[data-testid="order-status"]')).toContainText('pending');
    });

    // Step 2: Admin views and updates order status
    await test.step('Admin updates order status', async () => {
      await adminPage.click('[data-testid="orders-nav-link"]');

      // Find the order and click it
      const orderRow = adminPage.locator(`[data-testid="order-row"][data-order-id="${orderId}"]`);
      await expect(orderRow).toBeVisible();
      await orderRow.click();

      // Verify we're on the order details page
      await expect(adminPage).toHaveURL(`${ADMIN_APP_URL}/orders/${orderId}`);
    });

    // Step 3: Verify real-time status update
    await test.step('Verify real-time status update to customer', async () => {
      // Setup WebSocket message listener on customer page
      await customerPage.evaluate(() => {
        window.receivedUpdates = [];
        window.io.on('orderStatusUpdate', (data) => {
          window.receivedUpdates.push(data);
        });
      });

      // Admin updates status to confirmed
      await adminPage.selectOption('[data-testid="status-select"]', 'confirmed');
      await adminPage.fill('[data-testid="status-note"]', 'Order confirmed via WebSocket test');
      await adminPage.click('[data-testid="update-status-button"]');

      // Wait for customer page to receive WebSocket update
      await customerPage.waitForFunction(() => {
        return window.receivedUpdates && window.receivedUpdates.length > 0;
      });

      // Verify the customer page shows updated status
      await expect(customerPage.locator('[data-testid="order-status"]')).toContainText('confirmed');

      // Verify the status update appears in timeline
      await expect(customerPage.locator('[data-testid="status-timeline"]')).toContainText('Order confirmed via WebSocket test');

      // Verify WebSocket message content
      const receivedUpdates = await customerPage.evaluate(() => window.receivedUpdates);
      expect(receivedUpdates).toHaveLength(1);
      expect(receivedUpdates[0].orderId).toBe(orderId);
      expect(receivedUpdates[0].status).toBe('confirmed');
    });

    // Step 4: Update to in-production and verify again
    await test.step('Verify multiple status updates', async () => {
      // Clear previous updates
      await customerPage.evaluate(() => { window.receivedUpdates = []; });

      // Admin updates to in-production
      await adminPage.selectOption('[data-testid="status-select"]', 'in-production');
      await adminPage.fill('[data-testid="status-note"]', 'Started baking your order');
      await adminPage.click('[data-testid="update-status-button"]');

      // Wait for customer to receive update
      await customerPage.waitForFunction(() => {
        return window.receivedUpdates && window.receivedUpdates.length > 0;
      });

      // Verify customer page updates
      await expect(customerPage.locator('[data-testid="order-status"]')).toContainText('in-production');
      await expect(customerPage.locator('[data-testid="status-timeline"]')).toContainText('Started baking your order');
    });
  });

  test('new order notifications to admin dashboard', async () => {
    // Step 1: Setup admin dashboard to monitor new orders
    await test.step('Admin monitors dashboard', async () => {
      await adminPage.click('[data-testid="dashboard-nav-link"]');

      // Setup WebSocket listener for new orders
      await adminPage.evaluate(() => {
        window.newOrders = [];
        window.io.on('newOrder', (data) => {
          window.newOrders.push(data);
        });
      });

      // Get current order count
      const currentCount = await adminPage.locator('[data-testid="orders-today-count"]').textContent();
      const initialCount = parseInt(currentCount || '0');
    });

    // Step 2: Customer places new order
    await test.step('Customer places new order', async () => {
      // Add product to cart
      await customerPage.goto(`${CUSTOMER_APP_URL}/products`);
      await customerPage.click('[data-testid="product-card"]:nth-child(2) [data-testid="add-to-cart"]');
      await customerPage.click('[data-testid="cart-link"]');
      await customerPage.click('[data-testid="checkout-button"]');

      // Fill minimal required info and place order
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await customerPage.fill('[data-testid="delivery-date"]', tomorrowStr);

      await customerPage.fill('[data-testid="card-number"]', '4111111111111111');
      await customerPage.fill('[data-testid="card-expiry"]', '12/25');
      await customerPage.fill('[data-testid="card-cvc"]', '123');

      await customerPage.click('[data-testid="place-order-button"]');
    });

    // Step 3: Verify admin receives real-time notification
    await test.step('Verify admin receives new order notification', async () => {
      // Wait for WebSocket notification
      await adminPage.waitForFunction(() => {
        return window.newOrders && window.newOrders.length > 0;
      });

      // Verify dashboard updates
      await expect(adminPage.locator('[data-testid="new-order-notification"]')).toBeVisible();

      // Verify order count incremented
      await adminPage.waitForFunction((initialCount) => {
        const currentElement = document.querySelector('[data-testid="orders-today-count"]');
        const currentCount = parseInt(currentElement?.textContent || '0');
        return currentCount > initialCount;
      }, initialCount);

      // Verify WebSocket message content
      const newOrders = await adminPage.evaluate(() => window.newOrders);
      expect(newOrders).toHaveLength(1);
      expect(newOrders[0]).toHaveProperty('orderId');
      expect(newOrders[0]).toHaveProperty('customerName');
      expect(newOrders[0]).toHaveProperty('total');
    });
  });

  test('inventory updates affect product availability', async () => {
    let productId: string;

    // Step 1: Customer views product with available stock
    await test.step('Customer views available product', async () => {
      await customerPage.goto(`${CUSTOMER_APP_URL}/products`);

      // Get first available product
      const availableProduct = customerPage.locator('[data-testid="product-card"]:not([data-stock="0"])').first();
      productId = await availableProduct.getAttribute('data-product-id') || '';

      // Verify add to cart is enabled
      await expect(availableProduct.locator('[data-testid="add-to-cart"]')).toBeEnabled();

      // Setup WebSocket listener for inventory updates
      await customerPage.evaluate(() => {
        window.inventoryUpdates = [];
        window.io.on('inventoryUpdate', (data) => {
          window.inventoryUpdates.push(data);
        });
      });
    });

    // Step 2: Admin updates inventory to zero
    await test.step('Admin sets inventory to zero', async () => {
      await adminPage.click('[data-testid="inventory-nav-link"]');

      // Find the product and update its stock
      const inventoryRow = adminPage.locator(`[data-testid="inventory-row"][data-product-id="${productId}"]`);
      await inventoryRow.locator('[data-testid="stock-input"]').fill('0');
      await inventoryRow.locator('[data-testid="update-stock-button"]').click();

      // Verify update success
      await expect(adminPage.locator('[data-testid="inventory-update-success"]')).toBeVisible();
    });

    // Step 3: Verify customer sees real-time availability update
    await test.step('Verify customer sees stock update', async () => {
      // Wait for WebSocket update
      await customerPage.waitForFunction(() => {
        return window.inventoryUpdates && window.inventoryUpdates.length > 0;
      });

      // Verify product shows as out of stock
      const productCard = customerPage.locator(`[data-testid="product-card"][data-product-id="${productId}"]`);
      await expect(productCard).toHaveAttribute('data-stock', '0');
      await expect(productCard.locator('[data-testid="add-to-cart"]')).toBeDisabled();
      await expect(productCard.locator('[data-testid="out-of-stock-label"]')).toBeVisible();

      // Verify WebSocket message
      const inventoryUpdates = await customerPage.evaluate(() => window.inventoryUpdates);
      expect(inventoryUpdates).toHaveLength(1);
      expect(inventoryUpdates[0].productId).toBe(productId);
      expect(inventoryUpdates[0].stock).toBe(0);
    });
  });

  test('WebSocket connection handling and reconnection', async () => {
    // Step 1: Verify initial connection
    await test.step('Verify initial WebSocket connections', async () => {
      const customerConnected = await customerPage.evaluate(() => {
        return window.io && window.io.readyState === 'open';
      });

      const adminConnected = await adminPage.evaluate(() => {
        return window.io && window.io.readyState === 'open';
      });

      expect(customerConnected).toBe(true);
      expect(adminConnected).toBe(true);
    });

    // Step 2: Simulate connection loss
    await test.step('Simulate connection loss and reconnection', async () => {
      // Disconnect customer WebSocket
      await customerPage.evaluate(() => {
        window.io.disconnect();
      });

      // Verify disconnected state
      await customerPage.waitForFunction(() => {
        return window.io.readyState !== 'open';
      });

      // Reconnect
      await customerPage.evaluate(() => {
        window.io.connect();
      });

      // Verify reconnection
      await customerPage.waitForFunction(() => {
        return window.io.readyState === 'open';
      });
    });

    // Step 3: Test message delivery after reconnection
    await test.step('Test message delivery after reconnection', async () => {
      // Setup listener on customer after reconnection
      await customerPage.evaluate(() => {
        window.reconnectUpdates = [];
        window.io.on('orderStatusUpdate', (data) => {
          window.reconnectUpdates.push(data);
        });
      });

      // Admin makes an update
      await adminPage.click('[data-testid="orders-nav-link"]');
      const firstOrder = adminPage.locator('[data-testid="order-row"]').first();
      const orderId = await firstOrder.getAttribute('data-order-id');
      await firstOrder.click();

      await adminPage.selectOption('[data-testid="status-select"]', 'confirmed');
      await adminPage.click('[data-testid="update-status-button"]');

      // Verify customer receives update after reconnection
      await customerPage.waitForFunction(() => {
        return window.reconnectUpdates && window.reconnectUpdates.length > 0;
      });

      const updates = await customerPage.evaluate(() => window.reconnectUpdates);
      expect(updates).toHaveLength(1);
      expect(updates[0].orderId).toBe(orderId);
    });
  });

  test('room-based broadcasting (customer-specific vs admin-global)', async () => {
    // Step 1: Setup second customer session
    let secondCustomerPage: Page;
    await test.step('Setup second customer session', async () => {
      const secondCustomerContext = await browser.newContext();
      secondCustomerPage = await secondCustomerContext.newPage();

      await secondCustomerPage.goto(CUSTOMER_APP_URL);
      await secondCustomerPage.click('[data-testid="login-link"]');
      await secondCustomerPage.fill('[data-testid="login-email"]', 'second.customer@example.com');
      await secondCustomerPage.fill('[data-testid="login-password"]', 'TestPassword123!');
      await secondCustomerPage.click('[data-testid="login-button"]');

      // Setup WebSocket listeners
      await customerPage.evaluate(() => {
        window.customerUpdates = [];
        window.io.on('orderStatusUpdate', (data) => {
          window.customerUpdates.push(data);
        });
      });

      await secondCustomerPage.evaluate(() => {
        window.customerUpdates = [];
        window.io.on('orderStatusUpdate', (data) => {
          window.customerUpdates.push(data);
        });
      });
    });

    // Step 2: Create order for first customer
    let firstCustomerOrderId: string;
    await test.step('First customer creates order', async () => {
      await customerPage.goto(`${CUSTOMER_APP_URL}/products`);
      await customerPage.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
      await customerPage.click('[data-testid="cart-link"]');
      await customerPage.click('[data-testid="checkout-button"]');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await customerPage.fill('[data-testid="delivery-date"]', tomorrowStr);

      await customerPage.fill('[data-testid="card-number"]', '4111111111111111');
      await customerPage.fill('[data-testid="card-expiry"]', '12/25');
      await customerPage.fill('[data-testid="card-cvc"]', '123');

      const orderResponse = customerPage.waitForResponse(
        response => response.url().includes('/api/v1/orders') && response.request().method() === 'POST'
      );

      await customerPage.click('[data-testid="place-order-button"]');
      const response = await orderResponse;
      const orderData = await response.json();
      firstCustomerOrderId = orderData.id;
    });

    // Step 3: Admin updates first customer's order
    await test.step('Admin updates first customer order', async () => {
      await adminPage.click('[data-testid="orders-nav-link"]');
      const orderRow = adminPage.locator(`[data-testid="order-row"][data-order-id="${firstCustomerOrderId}"]`);
      await orderRow.click();

      await adminPage.selectOption('[data-testid="status-select"]', 'confirmed');
      await adminPage.click('[data-testid="update-status-button"]');
    });

    // Step 4: Verify only first customer receives update
    await test.step('Verify customer-specific broadcasting', async () => {
      // First customer should receive update
      await customerPage.waitForFunction(() => {
        return window.customerUpdates && window.customerUpdates.length > 0;
      });

      // Second customer should NOT receive update (wait a bit to be sure)
      await secondCustomerPage.waitForTimeout(2000);
      const secondCustomerUpdates = await secondCustomerPage.evaluate(() => window.customerUpdates);
      expect(secondCustomerUpdates).toHaveLength(0);

      // Verify first customer received correct update
      const firstCustomerUpdates = await customerPage.evaluate(() => window.customerUpdates);
      expect(firstCustomerUpdates).toHaveLength(1);
      expect(firstCustomerUpdates[0].orderId).toBe(firstCustomerOrderId);
    });

    await secondCustomerPage.close();
  });

  test('WebSocket error handling and fallback', async () => {
    // Step 1: Test invalid WebSocket URL
    await test.step('Test WebSocket error handling', async () => {
      // Simulate WebSocket connection failure
      await customerPage.evaluate(() => {
        window.io.disconnect();
        window.connectionErrors = [];
        window.io.on('connect_error', (error) => {
          window.connectionErrors.push(error);
        });

        // Try to connect to invalid URL
        window.io.io.uri = 'ws://invalid-url:9999';
        window.io.connect();
      });

      // Verify error handling
      await customerPage.waitForFunction(() => {
        return window.connectionErrors && window.connectionErrors.length > 0;
      });
    });

    // Step 2: Test fallback to polling
    await test.step('Test fallback behavior', async () => {
      // In a real implementation, this would test fallback to HTTP polling
      // For now, we verify the application continues to function

      // Navigate to a page that would normally use WebSocket updates
      await customerPage.goto(`${CUSTOMER_APP_URL}/orders`);

      // Verify page still loads and functions
      await expect(customerPage.locator('[data-testid="orders-list"]')).toBeVisible();

      // The application should still work, just without real-time updates
      await customerPage.reload();
      await expect(customerPage.locator('[data-testid="orders-list"]')).toBeVisible();
    });
  });
});
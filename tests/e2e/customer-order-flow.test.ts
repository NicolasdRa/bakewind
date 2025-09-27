import { test, expect, Page, Browser } from '@playwright/test';

/**
 * T024: End-to-end test for customer order flow
 *
 * Tests the complete customer journey from product browsing to order completion
 * across the customer application and API integration.
 *
 * Flow:
 * 1. Customer visits website
 * 2. Browses products
 * 3. Adds items to cart
 * 4. Proceeds to checkout
 * 5. Creates account / logs in
 * 6. Completes order
 * 7. Receives confirmation
 */

const CUSTOMER_APP_URL = process.env.CUSTOMER_APP_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010';

test.describe('Customer Order Flow', () => {
  let page: Page;
  let browser: Browser;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to customer app homepage
    await page.goto(CUSTOMER_APP_URL);
  });

  test('complete customer order flow - new customer', async () => {
    // Step 1: Browse products
    await test.step('Browse products', async () => {
      await page.click('[data-testid="products-link"]');
      await expect(page).toHaveURL(`${CUSTOMER_APP_URL}/products`);

      // Wait for products to load
      await page.waitForSelector('[data-testid="product-card"]');

      // Verify products are displayed
      const productCards = await page.locator('[data-testid="product-card"]');
      await expect(productCards).toHaveCountGreaterThan(0);
    });

    // Step 2: Add items to cart
    await test.step('Add items to cart', async () => {
      // Add first product to cart
      await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');

      // Verify cart badge updates
      await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1');

      // Add second product to cart
      await page.click('[data-testid="product-card"]:nth-child(2) [data-testid="add-to-cart"]');
      await expect(page.locator('[data-testid="cart-badge"]')).toContainText('2');
    });

    // Step 3: View cart
    await test.step('View cart', async () => {
      await page.click('[data-testid="cart-link"]');
      await expect(page).toHaveURL(`${CUSTOMER_APP_URL}/cart`);

      // Verify cart items are displayed
      const cartItems = await page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(2);

      // Verify total is calculated
      await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
    });

    // Step 4: Proceed to checkout
    await test.step('Proceed to checkout', async () => {
      await page.click('[data-testid="checkout-button"]');
      await expect(page).toHaveURL(`${CUSTOMER_APP_URL}/checkout`);
    });

    // Step 5: Customer registration
    await test.step('Register new customer', async () => {
      // Fill registration form
      await page.fill('[data-testid="email-input"]', 'test.customer@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="first-name-input"]', 'Test');
      await page.fill('[data-testid="last-name-input"]', 'Customer');
      await page.fill('[data-testid="phone-input"]', '+1234567890');

      await page.click('[data-testid="register-button"]');

      // Wait for registration to complete
      await page.waitForSelector('[data-testid="delivery-form"]');
    });

    // Step 6: Complete delivery information
    await test.step('Enter delivery information', async () => {
      await page.fill('[data-testid="address-line1"]', '123 Test Street');
      await page.fill('[data-testid="address-city"]', 'Test City');
      await page.fill('[data-testid="address-postal-code"]', '12345');
      await page.selectOption('[data-testid="address-country"]', 'US');

      // Select delivery date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await page.fill('[data-testid="delivery-date"]', tomorrowStr);

      // Select delivery time slot
      await page.selectOption('[data-testid="delivery-time"]', '10:00-12:00');
    });

    // Step 7: Payment information
    await test.step('Enter payment information', async () => {
      await page.fill('[data-testid="card-number"]', '4111111111111111');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="card-name"]', 'Test Customer');
    });

    // Step 8: Place order
    let orderId: string;
    await test.step('Place order', async () => {
      // Listen for the API call to create order
      const orderResponse = page.waitForResponse(
        response => response.url().includes('/api/v1/orders') && response.request().method() === 'POST'
      );

      await page.click('[data-testid="place-order-button"]');

      // Wait for order creation
      const response = await orderResponse;
      expect(response.status()).toBe(201);

      const orderData = await response.json();
      orderId = orderData.id;

      // Verify order confirmation page
      await expect(page).toHaveURL(`${CUSTOMER_APP_URL}/order-confirmation/${orderId}`);
    });

    // Step 9: Verify order confirmation
    await test.step('Verify order confirmation', async () => {
      // Check order confirmation elements
      await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-number"]')).toContainText(orderId);

      // Verify order details
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="delivery-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-info"]')).toBeVisible();

      // Verify order total
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    });

    // Step 10: Verify order in API
    await test.step('Verify order via API', async () => {
      // Make API call to verify order exists
      const apiResponse = await page.request.get(`${API_BASE_URL}/api/v1/orders/${orderId}`);
      expect(apiResponse.status()).toBe(200);

      const orderData = await apiResponse.json();
      expect(orderData.id).toBe(orderId);
      expect(orderData.status).toBe('pending');
      expect(orderData.items).toHaveLength(2);
    });
  });

  test('complete customer order flow - returning customer', async () => {
    // Step 1: Login existing customer
    await test.step('Login existing customer', async () => {
      await page.click('[data-testid="login-link"]');
      await page.fill('[data-testid="login-email"]', 'existing.customer@example.com');
      await page.fill('[data-testid="login-password"]', 'ExistingPassword123!');
      await page.click('[data-testid="login-button"]');

      // Verify login success
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    // Step 2: Quick add to cart and checkout
    await test.step('Quick order process', async () => {
      // Add product to cart
      await page.goto(`${CUSTOMER_APP_URL}/products`);
      await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');

      // Go to cart and checkout
      await page.click('[data-testid="cart-link"]');
      await page.click('[data-testid="checkout-button"]');

      // Verify existing address is pre-filled
      await expect(page.locator('[data-testid="address-line1"]')).toHaveValue(/^.+$/);

      // Update delivery date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await page.fill('[data-testid="delivery-date"]', tomorrowStr);

      // Place order
      await page.click('[data-testid="place-order-button"]');

      // Verify order confirmation
      await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible();
    });
  });

  test('cart persistence across sessions', async () => {
    // Step 1: Add items to cart without login
    await test.step('Add items to cart as guest', async () => {
      await page.goto(`${CUSTOMER_APP_URL}/products`);
      await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
      await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1');
    });

    // Step 2: Refresh page and verify cart persists
    await test.step('Verify cart persistence', async () => {
      await page.reload();
      await expect(page.locator('[data-testid="cart-badge"]')).toContainText('1');
    });

    // Step 3: Login and verify cart merges
    await test.step('Login and verify cart merge', async () => {
      await page.click('[data-testid="login-link"]');
      await page.fill('[data-testid="login-email"]', 'existing.customer@example.com');
      await page.fill('[data-testid="login-password"]', 'ExistingPassword123!');
      await page.click('[data-testid="login-button"]');

      // Cart should still contain the item
      await expect(page.locator('[data-testid="cart-badge"]')).toContainText(/[1-9]/);
    });
  });

  test('error handling - out of stock product', async () => {
    // Step 1: Try to add out of stock product
    await test.step('Add out of stock product', async () => {
      await page.goto(`${CUSTOMER_APP_URL}/products`);

      // Find out of stock product
      const outOfStockProduct = page.locator('[data-testid="product-card"][data-stock="0"]');
      await expect(outOfStockProduct).toBeVisible();

      // Verify add to cart button is disabled
      const addToCartButton = outOfStockProduct.locator('[data-testid="add-to-cart"]');
      await expect(addToCartButton).toBeDisabled();
    });
  });

  test('error handling - payment failure', async () => {
    // Step 1: Setup cart and proceed to checkout
    await test.step('Setup order for payment failure', async () => {
      await page.goto(`${CUSTOMER_APP_URL}/products`);
      await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
      await page.click('[data-testid="cart-link"]');
      await page.click('[data-testid="checkout-button"]');
    });

    // Step 2: Fill form with invalid payment info
    await test.step('Enter invalid payment information', async () => {
      // Fill customer info
      await page.fill('[data-testid="email-input"]', 'payment.fail@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="first-name-input"]', 'Payment');
      await page.fill('[data-testid="last-name-input"]', 'Fail');
      await page.fill('[data-testid="phone-input"]', '+1234567890');
      await page.click('[data-testid="register-button"]');

      // Fill delivery info
      await page.fill('[data-testid="address-line1"]', '123 Test Street');
      await page.fill('[data-testid="address-city"]', 'Test City');
      await page.fill('[data-testid="address-postal-code"]', '12345');

      // Fill invalid payment info (card declined)
      await page.fill('[data-testid="card-number"]', '4000000000000002');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="card-name"]', 'Payment Fail');
    });

    // Step 3: Attempt payment and verify error handling
    await test.step('Verify payment error handling', async () => {
      await page.click('[data-testid="place-order-button"]');

      // Should show payment error
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-error"]')).toContainText(/payment.*failed|card.*declined/i);

      // Should remain on checkout page
      await expect(page).toHaveURL(`${CUSTOMER_APP_URL}/checkout`);
    });
  });
});
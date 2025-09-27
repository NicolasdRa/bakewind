import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 *
 * This runs once before all tests to:
 * - Set up test database
 * - Create test users
 * - Seed test data
 */
async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔧 Setting up E2E test environment...');

  try {
    // Wait for API to be ready
    console.log('⏳ Waiting for API server...');
    await page.goto('http://localhost:3010/health', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Setup test database
    console.log('🗄️ Setting up test database...');
    const dbSetupResponse = await page.request.post('http://localhost:3010/api/test/setup-database');

    if (!dbSetupResponse.ok()) {
      throw new Error(`Failed to setup test database: ${dbSetupResponse.status()}`);
    }

    // Create test users
    console.log('👥 Creating test users...');

    // Create test customer
    await page.request.post('http://localhost:3010/api/v1/customers/register', {
      data: {
        email: 'test.customer@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+1234567890'
      }
    });

    // Create existing customer for login tests
    await page.request.post('http://localhost:3010/api/v1/customers/register', {
      data: {
        email: 'existing.customer@example.com',
        password: 'ExistingPassword123!',
        firstName: 'Existing',
        lastName: 'Customer',
        phone: '+1234567891'
      }
    });

    // Create second customer for WebSocket tests
    await page.request.post('http://localhost:3010/api/v1/customers/register', {
      data: {
        email: 'second.customer@example.com',
        password: 'TestPassword123!',
        firstName: 'Second',
        lastName: 'Customer',
        phone: '+1234567892'
      }
    });

    // Create admin user
    await page.request.post('http://localhost:3010/api/v1/admin/users', {
      data: {
        email: 'admin@bakewind.com',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });

    // Seed test products
    console.log('🍰 Seeding test products...');
    await page.request.post('http://localhost:3010/api/test/seed-products');

    // Seed test inventory
    console.log('📦 Setting up test inventory...');
    await page.request.post('http://localhost:3010/api/test/seed-inventory');

    console.log('✅ E2E test environment setup complete');

  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schemas from '../src/database/schemas';
import { contractTestConfig } from './contract-test.config';

export class ContractTestSetup {
  private pool: Pool;
  private db: any;

  constructor() {
    // Set environment variables for tests
    Object.entries(contractTestConfig.env).forEach(([key, value]) => {
      process.env[key] = value;
    });

    this.pool = new Pool({
      host: contractTestConfig.database.host,
      port: contractTestConfig.database.port,
      user: contractTestConfig.database.username,
      password: contractTestConfig.database.password,
      database: contractTestConfig.database.database,
    });

    this.db = drizzle(this.pool, { schema: schemas });
  }

  async setupDatabase(): Promise<void> {
    try {
      // Create test database if it doesn't exist
      await this.createTestDatabase();

      // Run migrations
      await migrate(this.db, { migrationsFolder: './drizzle' });

      // Seed test data
      await this.seedTestData();

      console.log('✅ Contract test database setup complete');
    } catch (error) {
      console.error('❌ Contract test database setup failed:', error);
      throw error;
    }
  }

  async teardownDatabase(): Promise<void> {
    try {
      // Clean up test data
      await this.cleanupTestData();

      // Close database connection
      await this.pool.end();

      console.log('✅ Contract test database teardown complete');
    } catch (error) {
      console.error('❌ Contract test database teardown failed:', error);
      throw error;
    }
  }

  private async createTestDatabase(): Promise<void> {
    const adminPool = new Pool({
      host: contractTestConfig.database.host,
      port: contractTestConfig.database.port,
      user: contractTestConfig.database.username,
      password: contractTestConfig.database.password,
      database: 'postgres', // Connect to default database to create test db
    });

    try {
      // Check if test database exists
      const result = await adminPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [contractTestConfig.database.database]
      );

      if (result.rows.length === 0) {
        // Create test database
        await adminPool.query(
          `CREATE DATABASE "${contractTestConfig.database.database}"`
        );
        console.log(`📦 Created test database: ${contractTestConfig.database.database}`);
      } else {
        console.log(`📦 Test database already exists: ${contractTestConfig.database.database}`);
      }
    } finally {
      await adminPool.end();
    }
  }

  private async seedTestData(): Promise<void> {
    const { subscriptionPlans, softwareFeatures, products } = contractTestConfig.testData;

    try {
      // Seed subscription plans
      for (const plan of subscriptionPlans) {
        await this.db.insert(schemas.subscriptionPlansTable)
          .values({
            ...plan,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
      }

      // Seed software features
      for (const feature of softwareFeatures) {
        await this.db.insert(schemas.softwareFeaturesTable)
          .values({
            ...feature,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
      }

      // Seed products
      for (const product of products) {
        await this.db.insert(schemas.products)
          .values({
            ...product,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
      }

      console.log('🌱 Test data seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed test data:', error);
      throw error;
    }
  }

  private async cleanupTestData(): Promise<void> {
    try {
      // Clean up in reverse dependency order
      await this.db.delete(schemas.userSessionsTable);
      await this.db.delete(schemas.trialAccountsTable);
      await this.db.delete(schemas.saasUsersTable);
      await this.db.delete(schemas.orderItems);
      await this.db.delete(schemas.orders);
      await this.db.delete(schemas.customers);
      await this.db.delete(schemas.usersTable);

      console.log('🧹 Test data cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      // Don't throw here - we still want to close connections
    }
  }

  async resetDatabase(): Promise<void> {
    await this.cleanupTestData();
    await this.seedTestData();
  }

  getDbConnection() {
    return this.db;
  }

  getPool() {
    return this.pool;
  }
}

// Global setup and teardown functions for Jest
let testSetup: ContractTestSetup;

export async function globalSetup(): Promise<void> {
  console.log('🚀 Setting up contract test environment...');

  testSetup = new ContractTestSetup();
  await testSetup.setupDatabase();

  // Store setup instance globally for teardown
  (global as any).__CONTRACT_TEST_SETUP__ = testSetup;
}

export async function globalTeardown(): Promise<void> {
  console.log('🔧 Tearing down contract test environment...');

  const setup = (global as any).__CONTRACT_TEST_SETUP__ as ContractTestSetup;
  if (setup) {
    await setup.teardownDatabase();
  }
}

// Test utility functions
export function createTestSetup(): ContractTestSetup {
  return new ContractTestSetup();
}

export { contractTestConfig };
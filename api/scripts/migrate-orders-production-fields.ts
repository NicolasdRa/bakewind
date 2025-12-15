import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Add production-specific fields to orders...');

    await client.query('BEGIN');

    // Add new enum values to order_status
    console.log('Adding new status values to order_status enum...');
    await client.query(`
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'draft';
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'scheduled';
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'quality_check';
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';
    `);

    // Create priority enum
    console.log('Creating order_priority enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE order_priority AS ENUM ('low', 'normal', 'high', 'rush');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create production shift enum
    console.log('Creating production_shift enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE production_shift AS ENUM ('morning', 'afternoon', 'night');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add priority column
    console.log('Adding priority column...');
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS priority order_priority DEFAULT 'normal' NOT NULL;
    `);

    // Add production-specific columns
    console.log('Adding production-specific columns...');
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS production_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS assigned_staff VARCHAR(255),
      ADD COLUMN IF NOT EXISTS workstation VARCHAR(100),
      ADD COLUMN IF NOT EXISTS production_shift production_shift,
      ADD COLUMN IF NOT EXISTS target_quantity INTEGER,
      ADD COLUMN IF NOT EXISTS actual_quantity INTEGER,
      ADD COLUMN IF NOT EXISTS waste_quantity INTEGER,
      ADD COLUMN IF NOT EXISTS quality_notes TEXT,
      ADD COLUMN IF NOT EXISTS ingredient_lot_numbers JSONB,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
    `);

    // Create index on batch_number for faster lookups
    console.log('Creating index on batch_number...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_batch_number ON orders(batch_number);
    `);

    // Create index on production_date for scheduling queries
    console.log('Creating index on production_date...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_production_date ON orders(production_date);
    `);

    // Create index on assigned_staff for filtering
    console.log('Creating index on assigned_staff...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff ON orders(assigned_staff);
    `);

    // Create index on priority for sorting
    console.log('Creating index on priority...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
    `);

    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});

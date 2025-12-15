import { Pool } from 'pg';
import { config } from 'dotenv';

config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running order_type migration...\n');

    // Create enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."order_type" AS ENUM('customer', 'internal');
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE 'order_type enum already exists, skipping';
      END $$;
    `);
    console.log('✓ Created order_type enum');

    // Add column
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "orders" ADD COLUMN "order_type" "order_type" DEFAULT 'customer' NOT NULL;
      EXCEPTION
        WHEN duplicate_column THEN
          RAISE NOTICE 'order_type column already exists, skipping';
      END $$;
    `);
    console.log('✓ Added order_type column to orders table');

    // Drop margin column
    await pool.query(`
      ALTER TABLE "recipes" DROP COLUMN IF EXISTS "margin";
    `);
    console.log('✓ Dropped margin column from recipes table (if existed)');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();

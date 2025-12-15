import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration: Separate customer and internal orders');

    await client.query('BEGIN');

    // Step 1: Create new enums for customer orders
    console.log('📝 Creating new enums for customer orders...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "customer_order_status" AS ENUM ('draft', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "customer_order_source" AS ENUM ('online', 'phone', 'walk_in', 'wholesale');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Step 2: Update internal_order_status enum to include production statuses
    console.log('📝 Updating internal_order_status enum...');
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'draft';
        ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'scheduled';
        ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'in_production';
        ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'quality_check';
        ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'completed';
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `);

    // Step 3: Add production-specific columns to internal_orders table
    console.log('📝 Adding production columns to internal_orders...');
    await client.query(`
      ALTER TABLE "internal_orders"
        ADD COLUMN IF NOT EXISTS "production_date" timestamp,
        ADD COLUMN IF NOT EXISTS "production_shift" varchar(50),
        ADD COLUMN IF NOT EXISTS "batch_number" varchar(100),
        ADD COLUMN IF NOT EXISTS "assigned_staff" varchar(255),
        ADD COLUMN IF NOT EXISTS "workstation" varchar(100),
        ADD COLUMN IF NOT EXISTS "target_quantity" integer,
        ADD COLUMN IF NOT EXISTS "actual_quantity" integer,
        ADD COLUMN IF NOT EXISTS "waste_quantity" integer,
        ADD COLUMN IF NOT EXISTS "quality_notes" text;
    `);

    // Step 4: Check if orders table exists and rename it
    console.log('📝 Renaming orders table to customer_orders...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      );
    `);

    if (tableExists.rows[0].exists) {
      await client.query('ALTER TABLE "orders" RENAME TO "customer_orders"');
      await client.query('ALTER TABLE "order_items" RENAME TO "customer_order_items"');
      console.log('✅ Tables renamed successfully');
    } else {
      console.log('ℹ️  orders table already renamed or does not exist');
    }

    // Step 5: Remove order_type column from customer_orders
    console.log('📝 Removing order_type column...');
    await client.query('ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "order_type"');

    // Step 6: Remove production-specific columns from customer_orders
    console.log('📝 Removing production columns from customer_orders...');
    await client.query(`
      ALTER TABLE "customer_orders"
        DROP COLUMN IF EXISTS "production_date",
        DROP COLUMN IF EXISTS "batch_number",
        DROP COLUMN IF EXISTS "assigned_staff",
        DROP COLUMN IF EXISTS "workstation",
        DROP COLUMN IF EXISTS "production_shift",
        DROP COLUMN IF EXISTS "target_quantity",
        DROP COLUMN IF EXISTS "actual_quantity",
        DROP COLUMN IF EXISTS "waste_quantity",
        DROP COLUMN IF EXISTS "quality_notes",
        DROP COLUMN IF EXISTS "ingredient_lot_numbers";
    `);

    // Step 7: Update customer_orders status column
    console.log('📝 Updating customer_orders status column...');
    const statusColumn = await client.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'customer_orders' AND column_name = 'status';
    `);

    if (statusColumn.rows[0]?.data_type !== 'USER-DEFINED') {
      await client.query(`
        ALTER TABLE "customer_orders" ALTER COLUMN "status" DROP DEFAULT;
        ALTER TABLE "customer_orders" ALTER COLUMN "status" TYPE "customer_order_status" USING (
          CASE
            WHEN "status"::text = 'draft' THEN 'draft'::customer_order_status
            WHEN "status"::text = 'pending' THEN 'pending'::customer_order_status
            WHEN "status"::text = 'confirmed' THEN 'confirmed'::customer_order_status
            WHEN "status"::text IN ('ready', 'scheduled') THEN 'ready'::customer_order_status
            WHEN "status"::text IN ('completed', 'delivered', 'in_production', 'quality_check') THEN 'delivered'::customer_order_status
            ELSE 'cancelled'::customer_order_status
          END
        );
        ALTER TABLE "customer_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::customer_order_status;
      `);
    }

    // Step 8: Update customer_orders source column
    console.log('📝 Updating customer_orders source column...');
    await client.query(`
      ALTER TABLE "customer_orders" ALTER COLUMN "source" TYPE "customer_order_source" USING (
        CASE
          WHEN "source"::text = 'online' THEN 'online'::customer_order_source
          WHEN "source"::text = 'phone' THEN 'phone'::customer_order_source
          WHEN "source"::text = 'walk_in' THEN 'walk_in'::customer_order_source
          WHEN "source"::text = 'wholesale' THEN 'wholesale'::customer_order_source
          ELSE 'walk_in'::customer_order_source
        END
      );
    `);

    // Step 9: Update production_items column name
    console.log('📝 Updating production_items column...');
    const prodColumn = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'production_items' AND column_name = 'order_id';
    `);

    if (prodColumn.rows.length > 0) {
      await client.query('ALTER TABLE "production_items" RENAME COLUMN "order_id" TO "internal_order_id"');
    }

    // Step 10: Update order_locks foreign key
    console.log('📝 Updating order_locks foreign key...');

    // First, get the actual constraint name
    const constraintQuery = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'order_locks'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%order_id%';
    `);

    if (constraintQuery.rows.length > 0) {
      const actualConstraintName = constraintQuery.rows[0].constraint_name;
      console.log(`ℹ️  Found constraint: ${actualConstraintName}`);

      await client.query(`ALTER TABLE "order_locks" DROP CONSTRAINT "${actualConstraintName}"`);
      await client.query(`
        ALTER TABLE "order_locks" ADD CONSTRAINT "order_locks_order_id_internal_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "internal_orders"("id") ON DELETE cascade
      `);
    }

    // Step 11: Drop old unused enums
    console.log('📝 Dropping old unused enums...');
    await client.query('DROP TYPE IF EXISTS "order_type" CASCADE');
    await client.query('DROP TYPE IF EXISTS "order_status" CASCADE');
    await client.query('DROP TYPE IF EXISTS "order_source" CASCADE');
    await client.query('DROP TYPE IF EXISTS "production_shift" CASCADE');

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

runMigration()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

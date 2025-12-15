-- Migration: Separate customer and internal orders
-- This migration splits the unified 'orders' table into 'customer_orders' and properly configured 'internal_orders'

-- Step 1: Create new enums for customer orders
CREATE TYPE "customer_order_status" AS ENUM ('draft', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled');
CREATE TYPE "customer_order_source" AS ENUM ('online', 'phone', 'walk_in', 'wholesale');

-- Step 2: Update internal_order_status enum to include production statuses
ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'in_production';
ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'quality_check';
ALTER TYPE "internal_order_status" ADD VALUE IF NOT EXISTS 'completed';

-- Step 3: Add production-specific columns to internal_orders table
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "production_date" timestamp;
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "production_shift" varchar(50);
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "batch_number" varchar(100);
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "assigned_staff" varchar(255);
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "workstation" varchar(100);
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "target_quantity" integer;
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "actual_quantity" integer;
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "waste_quantity" integer;
ALTER TABLE "internal_orders" ADD COLUMN IF NOT EXISTS "quality_notes" text;

-- Step 4: Rename orders table to customer_orders and order_items to customer_order_items
ALTER TABLE "orders" RENAME TO "customer_orders";
ALTER TABLE "order_items" RENAME TO "customer_order_items";

-- Step 5: Remove order_type column from customer_orders (no longer needed)
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "order_type";

-- Step 6: Remove production-specific columns from customer_orders
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "production_date";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "batch_number";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "assigned_staff";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "workstation";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "production_shift";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "target_quantity";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "actual_quantity";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "waste_quantity";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "quality_notes";
ALTER TABLE "customer_orders" DROP COLUMN IF EXISTS "ingredient_lot_numbers";

-- Step 7: Update customer_orders status column to use new enum
ALTER TABLE "customer_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "customer_orders" ALTER COLUMN "status" TYPE "customer_order_status" USING (
  CASE
    WHEN "status" = 'draft' THEN 'draft'::customer_order_status
    WHEN "status" = 'pending' THEN 'pending'::customer_order_status
    WHEN "status" = 'confirmed' THEN 'confirmed'::customer_order_status
    WHEN "status" IN ('ready', 'scheduled') THEN 'ready'::customer_order_status
    WHEN "status" IN ('completed', 'delivered', 'in_production', 'quality_check') THEN 'delivered'::customer_order_status
    ELSE 'cancelled'::customer_order_status
  END
);
ALTER TABLE "customer_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::customer_order_status;

-- Step 8: Update customer_orders source column to use new enum
ALTER TABLE "customer_orders" ALTER COLUMN "source" TYPE "customer_order_source" USING (
  CASE
    WHEN "source" = 'online' THEN 'online'::customer_order_source
    WHEN "source" = 'phone' THEN 'phone'::customer_order_source
    WHEN "source" = 'walk_in' THEN 'walk_in'::customer_order_source
    WHEN "source" = 'wholesale' THEN 'wholesale'::customer_order_source
    ELSE 'walk_in'::customer_order_source
  END
);

-- Step 9: Update production_items to reference internal_orders instead of orders
ALTER TABLE "production_items" RENAME COLUMN "order_id" TO "internal_order_id";

-- Step 10: Update order_locks to reference internal_orders
ALTER TABLE "order_locks" DROP CONSTRAINT IF EXISTS "order_locks_order_id_orders_id_fk";
ALTER TABLE "order_locks" ADD CONSTRAINT "order_locks_order_id_internal_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "internal_orders"("id") ON DELETE cascade;

-- Step 11: Drop old unused enums (do this last to avoid breaking constraints)
DROP TYPE IF EXISTS "order_type" CASCADE;
DROP TYPE IF EXISTS "order_status" CASCADE;
DROP TYPE IF EXISTS "order_source" CASCADE;
DROP TYPE IF EXISTS "production_shift" CASCADE;

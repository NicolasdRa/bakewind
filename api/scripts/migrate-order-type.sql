-- Create order_type enum
DO $$ BEGIN
  CREATE TYPE "public"."order_type" AS ENUM('customer', 'internal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add order_type column to orders table
DO $$ BEGIN
  ALTER TABLE "orders" ADD COLUMN "order_type" "order_type" DEFAULT 'customer' NOT NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Drop margin column from recipes (if it exists)
DO $$ BEGIN
  ALTER TABLE "recipes" DROP COLUMN IF EXISTS "margin";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

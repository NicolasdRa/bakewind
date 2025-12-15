CREATE TYPE "public"."order_type" AS ENUM('customer', 'internal');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" "order_type" DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "margin";
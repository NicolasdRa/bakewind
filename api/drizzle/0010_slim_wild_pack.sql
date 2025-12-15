CREATE TYPE "public"."order_priority" AS ENUM('low', 'normal', 'high', 'rush');--> statement-breakpoint
CREATE TYPE "public"."production_shift" AS ENUM('morning', 'afternoon', 'night');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'pending', 'confirmed', 'scheduled', 'ready', 'in_production', 'quality_check', 'completed', 'delivered', 'cancelled');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "priority" "order_priority" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "production_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "batch_number" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "assigned_staff" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "workstation" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "production_shift" "production_shift";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "target_quantity" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "actual_quantity" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "waste_quantity" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quality_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ingredient_lot_numbers" json;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "production_items" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
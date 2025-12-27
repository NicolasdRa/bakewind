-- Migration: Add tenant_id to all business tables for multi-tenancy support
-- This migration handles existing data by assigning it to the first available tenant

-- Step 1: Add tenant_id columns as nullable first
ALTER TABLE "analytics_events" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "product_metrics" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "production_schedules" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint

-- Step 2: Update existing rows to use the first tenant (for development/demo data)
UPDATE "daily_metrics" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "product_metrics" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "locations" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "suppliers" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "products" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "recipes" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "inventory_items" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "customer_orders" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "production_schedules" SET "tenant_id" = (SELECT id FROM tenants LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- Step 3: Set NOT NULL constraints (analytics_events stays nullable as it can be system-level)
ALTER TABLE "daily_metrics" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_metrics" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_orders" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "production_schedules" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint

-- Step 4: Add foreign key constraints
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_metrics" ADD CONSTRAINT "product_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Step 5: Create indexes for efficient tenant-scoped queries
CREATE INDEX "idx_analytics_events_tenant" ON "analytics_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_tenant_type" ON "analytics_events" USING btree ("tenant_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_daily_metrics_tenant" ON "daily_metrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_daily_metrics_tenant_date" ON "daily_metrics" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "idx_product_metrics_tenant" ON "product_metrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_metrics_tenant_product" ON "product_metrics" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_product_metrics_tenant_date" ON "product_metrics" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "idx_location_tenant" ON "locations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_location_tenant_active" ON "locations" USING btree ("tenant_id","isActive");--> statement-breakpoint
CREATE INDEX "idx_supplier_tenant" ON "suppliers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_tenant_active" ON "suppliers" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_product_tenant" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_tenant_status" ON "products" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_product_tenant_category" ON "products" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_recipe_tenant" ON "recipes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_tenant_category" ON "recipes" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_recipe_tenant_active" ON "recipes" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant" ON "inventory_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant_category" ON "inventory_items" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant_low_stock" ON "inventory_items" USING btree ("tenant_id","current_stock","minimum_stock");--> statement-breakpoint
CREATE INDEX "idx_order_tenant" ON "customer_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_order_tenant_status" ON "customer_orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_order_tenant_date" ON "customer_orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_production_schedule_tenant" ON "production_schedules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_production_schedule_tenant_date" ON "production_schedules" USING btree ("tenant_id","date");

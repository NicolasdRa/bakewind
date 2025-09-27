CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'head-baker', 'baker', 'head-pastry-chef', 'pastry-chef', 'cashier', 'customer', 'guest', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('bread', 'pastry', 'cake', 'cookie', 'sandwich', 'beverage', 'seasonal', 'custom');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'seasonal', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."inventory_category" AS ENUM('ingredient', 'packaging', 'supplies');--> statement-breakpoint
CREATE TYPE "public"."inventory_unit" AS ENUM('kg', 'g', 'l', 'ml', 'unit', 'dozen');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('online', 'phone', 'walk_in', 'wholesale');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partial', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."internal_order_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."internal_order_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."internal_order_source" AS ENUM('cafe', 'restaurant', 'front_house', 'catering', 'retail', 'events');--> statement-breakpoint
CREATE TYPE "public"."internal_order_status" AS ENUM('requested', 'approved', 'in_preparation', 'ready', 'delivered', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."production_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" json,
	"user_id" uuid,
	"session_id" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_internal_orders" integer DEFAULT 0 NOT NULL,
	"total_production_items" integer DEFAULT 0 NOT NULL,
	"completed_production_items" integer DEFAULT 0 NOT NULL,
	"production_efficiency" numeric(5, 2) DEFAULT '0',
	"top_products" json,
	"low_stock_items" integer DEFAULT 0 NOT NULL,
	"expiring_soon_items" integer DEFAULT 0 NOT NULL,
	"inventory_value" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"date" date NOT NULL,
	"quantity_sold" integer DEFAULT 0 NOT NULL,
	"revenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"popularity_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50) NOT NULL,
	"address" text,
	"notes" text,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "user_role" DEFAULT 'guest' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isEmailVerified" boolean DEFAULT false NOT NULL,
	"gender" varchar(20),
	"date_of_birth" timestamp,
	"bio" text,
	"profilePictureUrl" varchar(500),
	"phoneNumber" varchar(20),
	"country" varchar(100),
	"city" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"last_logout_at" timestamp with time zone,
	"refresh_token" varchar(500),
	"refresh_token_expires_at" timestamp with time zone,
	"email_verification_token" varchar(255),
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(50) NOT NULL,
	"address" text,
	"website" varchar(500),
	"delivery_days" json,
	"minimum_order" numeric(10, 2),
	"payment_terms" varchar(255),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "product_category" NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"cost_of_goods" numeric(10, 2),
	"margin" numeric(5, 2),
	"recipe_id" uuid,
	"recipe_name" varchar(255),
	"estimated_prep_time" integer,
	"allergens" json,
	"tags" json,
	"image_url" text,
	"nutritional_info" json,
	"available_seasons" json,
	"minimum_order_quantity" integer DEFAULT 1,
	"storage_instructions" text,
	"shelf_life" integer,
	"customizable" boolean DEFAULT false NOT NULL,
	"customization_options" json,
	"popularity_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"ingredient_name" varchar(255) NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"cost" numeric(10, 4),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"prep_time" integer NOT NULL,
	"cook_time" integer NOT NULL,
	"yield" integer NOT NULL,
	"yield_unit" varchar(50) NOT NULL,
	"cost_per_unit" numeric(10, 4),
	"selling_price" numeric(10, 2),
	"margin" numeric(5, 2),
	"product_id" uuid,
	"product_name" varchar(255),
	"instructions" json NOT NULL,
	"nutritional_info" json,
	"allergens" json,
	"tags" json,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "inventory_category" NOT NULL,
	"unit" "inventory_unit" NOT NULL,
	"current_stock" numeric(10, 3) NOT NULL,
	"minimum_stock" numeric(10, 3) NOT NULL,
	"reorder_point" numeric(10, 3) NOT NULL,
	"reorder_quantity" numeric(10, 3) NOT NULL,
	"cost_per_unit" numeric(10, 4) NOT NULL,
	"supplier" varchar(255),
	"expiration_date" date,
	"location" varchar(255),
	"last_restocked" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"customizations" json
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50),
	"customer_email" varchar(255),
	"source" "order_source" NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"pickup_time" timestamp,
	"delivery_time" timestamp,
	"special_requests" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "internal_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2),
	"special_instructions" text,
	"customizations" json
);
--> statement-breakpoint
CREATE TABLE "internal_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"source" "internal_order_source" NOT NULL,
	"status" "internal_order_status" DEFAULT 'requested' NOT NULL,
	"priority" "internal_order_priority" DEFAULT 'normal' NOT NULL,
	"requested_by" varchar(255) NOT NULL,
	"requested_by_email" varchar(255),
	"department" varchar(255) NOT NULL,
	"total_cost" numeric(10, 2),
	"requested_date" timestamp NOT NULL,
	"needed_by_date" timestamp NOT NULL,
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"completed_at" timestamp,
	"delivered_at" timestamp,
	"special_instructions" text,
	"notes" text,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" "internal_order_frequency",
	"next_order_date" timestamp,
	"recurring_end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "internal_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "production_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"recipe_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"status" "production_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_time" timestamp NOT NULL,
	"start_time" timestamp,
	"completed_time" timestamp,
	"assigned_to" varchar(255),
	"notes" text,
	"batch_number" varchar(100),
	"quality_check" boolean DEFAULT false,
	"quality_notes" text
);
--> statement-breakpoint
CREATE TABLE "production_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"completed_items" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_inventory_items_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_order_items" ADD CONSTRAINT "internal_order_items_internal_order_id_internal_orders_id_fk" FOREIGN KEY ("internal_order_id") REFERENCES "public"."internal_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_schedule_id_production_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."production_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_email_verified" ON "users" USING btree ("isEmailVerified");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_user_active_role" ON "users" USING btree ("isActive","role");--> statement-breakpoint
CREATE INDEX "idx_user_refresh_token" ON "users" USING btree ("refresh_token");--> statement-breakpoint
CREATE INDEX "idx_user_refresh_expiry" ON "users" USING btree ("refresh_token_expires_at");--> statement-breakpoint
CREATE INDEX "idx_user_last_login" ON "users" USING btree ("last_login_at");--> statement-breakpoint
CREATE INDEX "idx_user_password_reset_token" ON "users" USING btree ("password_reset_token");--> statement-breakpoint
CREATE INDEX "idx_user_password_reset_expiry" ON "users" USING btree ("password_reset_expires");--> statement-breakpoint
CREATE INDEX "idx_user_email_verification_token" ON "users" USING btree ("email_verification_token");--> statement-breakpoint
CREATE INDEX "idx_user_name" ON "users" USING btree ("firstName","lastName");--> statement-breakpoint
CREATE INDEX "idx_user_location" ON "users" USING btree ("country","city");--> statement-breakpoint
CREATE INDEX "idx_user_gender" ON "users" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "idx_user_not_deleted" ON "users" USING btree ("deleted_at") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_user_active_verified" ON "users" USING btree ("isActive","isEmailVerified") WHERE "users"."isActive" = true AND "users"."isEmailVerified" = true;
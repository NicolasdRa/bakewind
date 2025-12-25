CREATE TYPE "public"."customer_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('individual', 'business');--> statement-breakpoint
CREATE TYPE "public"."preferred_contact" AS ENUM('email', 'phone', 'text');--> statement-breakpoint
CREATE TYPE "public"."tenant_subscription_status" AS ENUM('trial', 'active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."staff_area" AS ENUM('cafe', 'restaurant', 'front_house', 'catering', 'retail', 'events');--> statement-breakpoint
CREATE TYPE "public"."order_lock_type" AS ENUM('customer', 'internal');--> statement-breakpoint
ALTER TYPE "public"."order_source" RENAME TO "customer_order_source";--> statement-breakpoint
ALTER TYPE "public"."order_status" RENAME TO "customer_order_status";--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"business_phone" varchar(20),
	"business_address" varchar(500),
	"stripe_account_id" varchar(100),
	"subscription_plan_id" uuid,
	"subscription_status" "tenant_subscription_status" DEFAULT 'trial' NOT NULL,
	"signup_source" varchar(100),
	"business_size" "business_size",
	"trial_length_days" integer DEFAULT 14 NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"sample_data_loaded" boolean DEFAULT false NOT NULL,
	"conversion_reminders_sent" integer DEFAULT 0 NOT NULL,
	"converted_at" timestamp with time zone,
	"cancellation_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_owner_user_id_unique" UNIQUE("owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"position" varchar(100),
	"department" varchar(100),
	"areas" json DEFAULT '[]'::json NOT NULL,
	"permissions" json DEFAULT '{}'::json,
	"hire_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "saas_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "trial_accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "saas_users" CASCADE;--> statement-breakpoint
DROP TABLE "trial_accounts" CASCADE;--> statement-breakpoint
ALTER TABLE "order_items" RENAME TO "customer_order_items";--> statement-breakpoint
ALTER TABLE "orders" RENAME TO "customer_orders";--> statement-breakpoint
ALTER TABLE "customers" RENAME COLUMN "address" TO "address_line_1";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "firstName" TO "first_name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "lastName" TO "last_name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "isActive" TO "is_active";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "isEmailVerified" TO "is_email_verified";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "profilePictureUrl" TO "profile_picture_url";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "phoneNumber" TO "phone_number";--> statement-breakpoint
ALTER TABLE "internal_orders" RENAME COLUMN "requested_by" TO "requested_by_name";--> statement-breakpoint
ALTER TABLE "internal_orders" RENAME COLUMN "approved_by" TO "approved_by_name";--> statement-breakpoint
ALTER TABLE "production_items" RENAME COLUMN "order_id" TO "internal_order_id";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP CONSTRAINT "orders_order_number_unique";--> statement-breakpoint
ALTER TABLE "customer_order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "production_items" DROP CONSTRAINT "production_items_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "order_locks" DROP CONSTRAINT "order_locks_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'OWNER', 'STAFF', 'CUSTOMER');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "customer_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customer_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."customer_order_status";--> statement-breakpoint
CREATE TYPE "public"."customer_order_status" AS ENUM('draft', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
ALTER TABLE "customer_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."customer_order_status";--> statement-breakpoint
ALTER TABLE "customer_orders" ALTER COLUMN "status" SET DATA TYPE "public"."customer_order_status" USING "status"::"public"."customer_order_status";--> statement-breakpoint
ALTER TABLE "internal_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "internal_orders" ALTER COLUMN "status" SET DEFAULT 'requested'::text;--> statement-breakpoint
DROP TYPE "public"."internal_order_status";--> statement-breakpoint
CREATE TYPE "public"."internal_order_status" AS ENUM('draft', 'requested', 'approved', 'scheduled', 'in_production', 'quality_check', 'ready', 'completed', 'delivered', 'cancelled');--> statement-breakpoint
ALTER TABLE "internal_orders" ALTER COLUMN "status" SET DEFAULT 'requested'::"public"."internal_order_status";--> statement-breakpoint
ALTER TABLE "internal_orders" ALTER COLUMN "status" SET DATA TYPE "public"."internal_order_status" USING "status"::"public"."internal_order_status";--> statement-breakpoint
DROP INDEX "idx_user_gender";--> statement-breakpoint
DROP INDEX "idx_user_subscription_status";--> statement-breakpoint
DROP INDEX "idx_user_trial_ends_at";--> statement-breakpoint
DROP INDEX "idx_user_business_name";--> statement-breakpoint
DROP INDEX "idx_user_email_verified";--> statement-breakpoint
DROP INDEX "idx_user_active_role";--> statement-breakpoint
DROP INDEX "idx_user_name";--> statement-breakpoint
DROP INDEX "idx_user_active_verified";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "auth_user_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "address_line_2" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "zip_code" varchar(20);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "customer_type" "customer_type" DEFAULT 'business' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "company_name" varchar(255);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tax_id" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "preferred_contact" "preferred_contact";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "marketing_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "status" "customer_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "stripe_customer_id" varchar(100);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "subscription_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "requested_by_staff_id" uuid;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "approved_by_staff_id" uuid;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "production_date" timestamp;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "production_shift" varchar(50);--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "batch_number" varchar(100);--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "assigned_staff_id" uuid;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "assigned_staff_name" varchar(255);--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "workstation" varchar(100);--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "target_quantity" integer;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "actual_quantity" integer;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "waste_quantity" integer;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "quality_notes" text;--> statement-breakpoint
ALTER TABLE "production_items" ADD COLUMN "customer_order_id" uuid;--> statement-breakpoint
ALTER TABLE "order_locks" ADD COLUMN "order_type" "order_lock_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tenant_owner" ON "tenants" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_business_name" ON "tenants" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX "idx_tenant_subscription_status" ON "tenants" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX "idx_tenant_subscription_plan" ON "tenants" USING btree ("subscription_plan_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_trial_ends_at" ON "tenants" USING btree ("trial_ends_at");--> statement-breakpoint
CREATE INDEX "idx_tenant_onboarding" ON "tenants" USING btree ("onboarding_completed");--> statement-breakpoint
CREATE INDEX "idx_tenant_signup_source" ON "tenants" USING btree ("signup_source");--> statement-breakpoint
CREATE INDEX "idx_tenant_business_size" ON "tenants" USING btree ("business_size");--> statement-breakpoint
CREATE INDEX "idx_tenant_stripe_account" ON "tenants" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_active" ON "tenants" USING btree ("deleted_at") WHERE "tenants"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_tenant_trial_active" ON "tenants" USING btree ("subscription_status","trial_ends_at") WHERE "tenants"."subscription_status" = 'trial';--> statement-breakpoint
CREATE INDEX "idx_staff_user" ON "staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_staff_tenant" ON "staff" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_staff_position" ON "staff" USING btree ("position");--> statement-breakpoint
CREATE INDEX "idx_staff_department" ON "staff" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_staff_hire_date" ON "staff" USING btree ("hire_date");--> statement-breakpoint
CREATE INDEX "idx_staff_tenant_position" ON "staff" USING btree ("tenant_id","position");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD CONSTRAINT "internal_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD CONSTRAINT "internal_orders_requested_by_staff_id_staff_id_fk" FOREIGN KEY ("requested_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD CONSTRAINT "internal_orders_approved_by_staff_id_staff_id_fk" FOREIGN KEY ("approved_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD CONSTRAINT "internal_orders_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_internal_order_id_internal_orders_id_fk" FOREIGN KEY ("internal_order_id") REFERENCES "public"."internal_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customer_tenant_id" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_customer_auth_user_id" ON "customers" USING btree ("auth_user_id");--> statement-breakpoint
CREATE INDEX "idx_customer_status" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_customer_type" ON "customers" USING btree ("customer_type");--> statement-breakpoint
CREATE INDEX "idx_customer_name" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_customer_email" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_customer_stripe" ON "customers" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tenant_status" ON "customers" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_internal_order_tenant" ON "internal_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_internal_order_status" ON "internal_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_internal_order_source" ON "internal_orders" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_internal_order_requested_by" ON "internal_orders" USING btree ("requested_by_staff_id");--> statement-breakpoint
CREATE INDEX "idx_internal_order_approved_by" ON "internal_orders" USING btree ("approved_by_staff_id");--> statement-breakpoint
CREATE INDEX "idx_internal_order_assigned_to" ON "internal_orders" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "idx_internal_order_production_date" ON "internal_orders" USING btree ("production_date");--> statement-breakpoint
CREATE INDEX "idx_internal_order_needed_by" ON "internal_orders" USING btree ("needed_by_date");--> statement-breakpoint
CREATE INDEX "idx_internal_order_tenant_status" ON "internal_orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_user_email_verified" ON "users" USING btree ("is_email_verified");--> statement-breakpoint
CREATE INDEX "idx_user_active_role" ON "users" USING btree ("is_active","role");--> statement-breakpoint
CREATE INDEX "idx_user_name" ON "users" USING btree ("first_name","last_name");--> statement-breakpoint
CREATE INDEX "idx_user_active_verified" ON "users" USING btree ("is_active","is_email_verified") WHERE "users"."is_active" = true AND "users"."is_email_verified" = true;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "business_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "subscription_status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "trial_ends_at";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "order_type";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "production_date";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "batch_number";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "assigned_staff";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "workstation";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "production_shift";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "target_quantity";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "actual_quantity";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "waste_quantity";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "quality_notes";--> statement-breakpoint
ALTER TABLE "customer_orders" DROP COLUMN "ingredient_lot_numbers";--> statement-breakpoint
ALTER TABLE "internal_orders" DROP COLUMN "department";--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_order_number_unique" UNIQUE("order_number");--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
DROP TYPE "public"."order_type";--> statement-breakpoint
DROP TYPE "public"."production_shift";--> statement-breakpoint
DROP TYPE "public"."saas_user_role";
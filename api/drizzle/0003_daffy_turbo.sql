CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."business_size" AS ENUM('1', '2-3', '4-10', '10+');--> statement-breakpoint
CREATE TYPE "public"."feature_category" AS ENUM('orders', 'inventory', 'production', 'analytics', 'customers', 'products');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'trial_user';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'subscriber';--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"price_monthly_usd" integer NOT NULL,
	"price_annual_usd" integer NOT NULL,
	"max_locations" integer,
	"max_users" integer,
	"features" json DEFAULT '[]'::json NOT NULL,
	"stripe_price_id_monthly" varchar(100),
	"stripe_price_id_annual" varchar(100),
	"is_popular" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "trial_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"signup_source" varchar(100) NOT NULL,
	"business_size" "business_size" NOT NULL,
	"trial_length_days" integer DEFAULT 14 NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"sample_data_loaded" boolean DEFAULT false NOT NULL,
	"conversion_reminders_sent" integer DEFAULT 0 NOT NULL,
	"converted_at" timestamp with time zone,
	"converted_to_plan_id" uuid,
	"cancellation_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "software_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon_name" varchar(50) NOT NULL,
	"category" "feature_category" NOT NULL,
	"available_in_plans" json DEFAULT '[]'::json NOT NULL,
	"demo_url" varchar(500),
	"help_doc_url" varchar(500),
	"sort_order" integer NOT NULL,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "software_features_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token_hash" varchar(255) NOT NULL,
	"refresh_token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"dashboard_redirect_url" varchar(255),
	"is_revoked" boolean DEFAULT false NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" "subscription_status" DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "trial_accounts" ADD CONSTRAINT "trial_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_accounts" ADD CONSTRAINT "trial_accounts_converted_to_plan_id_subscription_plans_id_fk" FOREIGN KEY ("converted_to_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_plan_name" ON "subscription_plans" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_plan_active" ON "subscription_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_plan_sort_order" ON "subscription_plans" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_plan_popular" ON "subscription_plans" USING btree ("is_popular");--> statement-breakpoint
CREATE INDEX "idx_plan_pricing" ON "subscription_plans" USING btree ("price_monthly_usd","price_annual_usd");--> statement-breakpoint
CREATE INDEX "idx_plan_active_sort" ON "subscription_plans" USING btree ("is_active","sort_order") WHERE "subscription_plans"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_trial_user_id" ON "trial_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_trial_signup_source" ON "trial_accounts" USING btree ("signup_source");--> statement-breakpoint
CREATE INDEX "idx_trial_business_size" ON "trial_accounts" USING btree ("business_size");--> statement-breakpoint
CREATE INDEX "idx_trial_onboarding" ON "trial_accounts" USING btree ("onboarding_completed");--> statement-breakpoint
CREATE INDEX "idx_trial_converted" ON "trial_accounts" USING btree ("converted_at");--> statement-breakpoint
CREATE INDEX "idx_trial_converted_plan" ON "trial_accounts" USING btree ("converted_to_plan_id");--> statement-breakpoint
CREATE INDEX "idx_trial_created" ON "trial_accounts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_trial_active_onboarding" ON "trial_accounts" USING btree ("onboarding_completed","sample_data_loaded");--> statement-breakpoint
CREATE INDEX "idx_feature_name" ON "software_features" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_feature_category" ON "software_features" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_feature_active" ON "software_features" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_feature_sort_order" ON "software_features" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_feature_highlighted" ON "software_features" USING btree ("is_highlighted");--> statement-breakpoint
CREATE INDEX "idx_feature_active_sort" ON "software_features" USING btree ("is_active","sort_order") WHERE "software_features"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_feature_category_sort" ON "software_features" USING btree ("category","sort_order");--> statement-breakpoint
CREATE INDEX "idx_session_user_id" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_access_token" ON "user_sessions" USING btree ("access_token_hash");--> statement-breakpoint
CREATE INDEX "idx_session_refresh_token" ON "user_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "idx_session_expires_at" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_session_revoked" ON "user_sessions" USING btree ("is_revoked");--> statement-breakpoint
CREATE INDEX "idx_session_last_activity" ON "user_sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_session_active_user" ON "user_sessions" USING btree ("user_id","is_revoked","expires_at");--> statement-breakpoint
CREATE INDEX "idx_session_cleanup" ON "user_sessions" USING btree ("expires_at","is_revoked");--> statement-breakpoint
CREATE INDEX "idx_user_subscription_status" ON "users" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX "idx_user_trial_ends_at" ON "users" USING btree ("trial_ends_at");--> statement-breakpoint
CREATE INDEX "idx_user_business_name" ON "users" USING btree ("business_name");
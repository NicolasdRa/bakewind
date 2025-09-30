CREATE TYPE "public"."saas_user_role" AS ENUM('owner', 'admin', 'user');--> statement-breakpoint
CREATE TABLE "saas_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"company_name" varchar(100) NOT NULL,
	"company_phone" varchar(20),
	"company_address" varchar(500),
	"role" "saas_user_role" DEFAULT 'owner' NOT NULL,
	"subscription_plan_id" uuid,
	"trial_account_id" uuid,
	"stripe_customer_id" varchar(100),
	"email_verified" boolean DEFAULT false NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "saas_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "saas_users" ADD CONSTRAINT "saas_users_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_users" ADD CONSTRAINT "saas_users_trial_account_id_trial_accounts_id_fk" FOREIGN KEY ("trial_account_id") REFERENCES "public"."trial_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_saas_user_email" ON "saas_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_saas_user_stripe_customer" ON "saas_users" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_saas_user_deleted" ON "saas_users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_saas_user_role" ON "saas_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_saas_user_email_verified" ON "saas_users" USING btree ("email_verified");--> statement-breakpoint
CREATE INDEX "idx_saas_user_onboarding" ON "saas_users" USING btree ("onboarding_completed");--> statement-breakpoint
CREATE INDEX "idx_saas_user_subscription_plan" ON "saas_users" USING btree ("subscription_plan_id");--> statement-breakpoint
CREATE INDEX "idx_saas_user_trial_account" ON "saas_users" USING btree ("trial_account_id");--> statement-breakpoint
CREATE INDEX "idx_saas_user_company_name" ON "saas_users" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_saas_user_active" ON "saas_users" USING btree ("deleted_at","email_verified") WHERE "saas_users"."deleted_at" IS NULL AND "saas_users"."email_verified" = true;
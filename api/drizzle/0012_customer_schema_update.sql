-- Create enums for customer fields
CREATE TYPE "customer_type" AS ENUM('individual', 'business');
CREATE TYPE "customer_status" AS ENUM('active', 'inactive');
CREATE TYPE "preferred_contact" AS ENUM('email', 'phone', 'text');

-- Add new columns to customers table
ALTER TABLE "customers" ADD COLUMN "user_id" uuid NOT NULL;
ALTER TABLE "customers" ADD COLUMN "address_line_1" text;
ALTER TABLE "customers" ADD COLUMN "address_line_2" text;
ALTER TABLE "customers" ADD COLUMN "city" varchar(100);
ALTER TABLE "customers" ADD COLUMN "state" varchar(100);
ALTER TABLE "customers" ADD COLUMN "zip_code" varchar(20);
ALTER TABLE "customers" ADD COLUMN "customer_type" "customer_type" DEFAULT 'business' NOT NULL;
ALTER TABLE "customers" ADD COLUMN "company_name" varchar(255);
ALTER TABLE "customers" ADD COLUMN "tax_id" varchar(50);
ALTER TABLE "customers" ADD COLUMN "preferred_contact" "preferred_contact";
ALTER TABLE "customers" ADD COLUMN "marketing_opt_in" boolean DEFAULT false NOT NULL;
ALTER TABLE "customers" ADD COLUMN "status" "customer_status" DEFAULT 'active' NOT NULL;

-- Drop old address column (data migration: copy to address_line_1 first)
UPDATE "customers" SET "address_line_1" = "address" WHERE "address" IS NOT NULL;
ALTER TABLE "customers" DROP COLUMN "address";

-- Add foreign key constraint for user_id
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_customer_user_id" ON "customers" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_customer_status" ON "customers" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_customer_type" ON "customers" USING btree ("customer_type");
CREATE INDEX IF NOT EXISTS "idx_customer_name" ON "customers" USING btree ("name");
CREATE INDEX IF NOT EXISTS "idx_customer_email" ON "customers" USING btree ("email");

CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"address" varchar(500) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"country" varchar(100) NOT NULL,
	"postalCode" varchar(20),
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"phoneNumber" varchar(20),
	"email" varchar(320),
	"isActive" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VIEWER'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'HEAD_BAKER', 'BAKER', 'HEAD_PASTRY_CHEF', 'PASTRY_CHEF', 'CASHIER', 'CUSTOMER', 'GUEST', 'VIEWER');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VIEWER'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_location_name" ON "locations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_location_city" ON "locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_location_active" ON "locations" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_location_not_deleted" ON "locations" USING btree ("deleted_at") WHERE "locations"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_user_location_mapping" ON "user_locations" USING btree ("user_id","location_id");--> statement-breakpoint
CREATE INDEX "idx_user_default_location_mapping" ON "user_locations" USING btree ("user_id","isDefault");
CREATE TABLE "widget_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"layout_type" varchar(20) DEFAULT 'grid' NOT NULL,
	"widgets" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "widget_configurations_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "widget_configurations" ADD CONSTRAINT "widget_configurations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
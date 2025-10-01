CREATE TABLE "order_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"locked_by_user_id" uuid NOT NULL,
	"locked_by_session_id" varchar(255) NOT NULL,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_locks_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_consumption_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"avg_daily_consumption" numeric(10, 2) DEFAULT '0' NOT NULL,
	"calculation_period_days" integer DEFAULT 7 NOT NULL,
	"last_calculated_at" timestamp DEFAULT now() NOT NULL,
	"calculation_method" varchar(50) DEFAULT 'historical_orders' NOT NULL,
	"custom_reorder_threshold" numeric(10, 2),
	"custom_lead_time_days" integer,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_consumption_tracking_inventory_item_id_unique" UNIQUE("inventory_item_id")
);
--> statement-breakpoint
ALTER TABLE "order_locks" ADD CONSTRAINT "order_locks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_locks" ADD CONSTRAINT "order_locks_locked_by_user_id_users_id_fk" FOREIGN KEY ("locked_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
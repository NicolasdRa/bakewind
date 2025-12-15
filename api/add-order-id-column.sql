-- Add order_id column to production_items table
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS order_id uuid;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'production_items_order_id_orders_id_fk'
    ) THEN
        ALTER TABLE production_items
        ADD CONSTRAINT production_items_order_id_orders_id_fk
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
END $$;

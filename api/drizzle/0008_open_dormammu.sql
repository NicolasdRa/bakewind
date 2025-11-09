-- Remove stored margin column from products table (now calculated dynamically)
ALTER TABLE "products" DROP COLUMN IF EXISTS "margin";
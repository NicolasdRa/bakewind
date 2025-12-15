import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCustomerOrderIdColumn() {
  const client = await pool.connect();

  try {
    console.log('📝 Adding customer_order_id column to production_items...');

    await client.query('BEGIN');

    // Add customer_order_id column
    await client.query(`
      ALTER TABLE production_items
      ADD COLUMN IF NOT EXISTS customer_order_id UUID;
    `);

    console.log('✅ Added customer_order_id column');

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'production_items'
      AND column_name IN ('internal_order_id', 'customer_order_id')
      ORDER BY column_name;
    `);

    console.log('\n📋 Order ID columns in production_items:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCustomerOrderIdColumn()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

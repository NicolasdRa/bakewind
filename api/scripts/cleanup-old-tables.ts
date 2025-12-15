import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function cleanupOldTables() {
  const client = await pool.connect();

  try {
    console.log('🧹 Starting cleanup of old tables...');

    await client.query('BEGIN');

    // Check if old tables exist
    const checkOrdersTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      );
    `);

    const checkOrderItemsTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'order_items'
      );
    `);

    if (checkOrdersTable.rows[0].exists) {
      console.log('❌ Found old "orders" table - dropping it...');
      await client.query('DROP TABLE IF EXISTS "orders" CASCADE');
      console.log('✅ Dropped "orders" table');
    } else {
      console.log('ℹ️  "orders" table does not exist (already cleaned up)');
    }

    if (checkOrderItemsTable.rows[0].exists) {
      console.log('❌ Found old "order_items" table - dropping it...');
      await client.query('DROP TABLE IF EXISTS "order_items" CASCADE');
      console.log('✅ Dropped "order_items" table');
    } else {
      console.log('ℹ️  "order_items" table does not exist (already cleaned up)');
    }

    // List all tables to confirm
    const allTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n📋 Current database tables:');
    allTables.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    await client.query('COMMIT');
    console.log('\n✅ Cleanup completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupOldTables()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

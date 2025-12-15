import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addOrderTypeToLocks() {
  const client = await pool.connect();

  try {
    console.log('📝 Adding order_type column to order_locks...');

    await client.query('BEGIN');

    // Create enum type for order lock type
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE order_lock_type AS ENUM ('customer', 'internal');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ Created order_lock_type enum');

    // Add order_type column with default 'internal' (for existing records)
    await client.query(`
      ALTER TABLE order_locks
      ADD COLUMN IF NOT EXISTS order_type order_lock_type DEFAULT 'internal' NOT NULL;
    `);

    console.log('✅ Added order_type column');

    // Remove the foreign key constraint from order_id to internal_orders
    // First, find the constraint name
    const constraintResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'order_locks'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%order_id%';
    `);

    if (constraintResult.rows.length > 0) {
      const constraintName = constraintResult.rows[0].constraint_name;
      await client.query(`
        ALTER TABLE order_locks
        DROP CONSTRAINT IF EXISTS ${constraintName};
      `);
      console.log(`✅ Removed foreign key constraint: ${constraintName}`);
    }

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'order_locks'
      AND column_name = 'order_type';
    `);

    console.log('\n📋 order_type column in order_locks:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.udt_name}`);
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

addOrderTypeToLocks()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

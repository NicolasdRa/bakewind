import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { products } from '../schemas/products.schema';
import { sql } from 'drizzle-orm';

dotenv.config();

async function clearPopularity() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log('🧹 Clearing all product popularity scores...');

    const result = await db
      .update(products)
      .set({
        popularityScore: 0,
        updatedAt: new Date(),
      })
      .returning({ id: products.id });

    console.log(`✅ Successfully cleared popularity for ${result.length} products`);
  } catch (error) {
    console.error('❌ Error clearing popularity:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

clearPopularity()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

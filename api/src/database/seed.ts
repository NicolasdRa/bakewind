import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schemas';
import { seedUsers } from './seeds/users.seed';
import { seedLocations } from './seeds/locations.seed';
import { seedInventory } from './seeds/inventory.seed';
import { seedProducts } from './seeds/products.seed';
import { seedRecipes } from './seeds/recipes.seed';

// Load environment variables
dotenv.config();

async function main() {
  // Use the same environment variables as the main app
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5433'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'bakewind_secure_password_2025',
    database: process.env.DATABASE_NAME || 'bakewind_db',
  });

  try {
    await client.connect();
    const db = drizzle(client, { schema });

    console.log('🚀 Starting database seeding...');

    // Run seed functions
    await seedUsers(db);
    await seedLocations(db);
    await seedInventory(db);
    await seedRecipes(db);
    await seedProducts(db);

    console.log('✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

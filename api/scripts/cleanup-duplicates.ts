import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { inventoryItems, recipeIngredients } from '../src/database/schemas';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config();

async function cleanupDuplicates() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🔍 Checking for duplicate inventory items...\n');

  // Find duplicates grouped by name and category
  const duplicates = await db.execute(sql`
    SELECT name, category, COUNT(*) as count, array_agg(id ORDER BY created_at) as ids
    FROM inventory_items
    GROUP BY name, category
    HAVING COUNT(*) > 1
    ORDER BY count DESC, name
  `);

  if (duplicates.rows.length === 0) {
    console.log('✅ No duplicates found!');
    await pool.end();
    return;
  }

  console.log(`Found ${duplicates.rows.length} duplicate groups:\n`);

  for (const dup of duplicates.rows) {
    console.log(`  - ${dup.name} (${dup.category}): ${dup.count} copies`);
  }

  console.log('\n🧹 Cleaning up duplicates...\n');

  let totalDeleted = 0;

  for (const dup of duplicates.rows) {
    const ids = dup.ids as string[];
    const keepId = ids[0]; // Keep the oldest one
    const deleteIds = ids.slice(1); // Delete the rest

    console.log(`\n📦 ${dup.name}:`);
    console.log(`  Keeping: ${keepId}`);
    console.log(`  Deleting: ${deleteIds.length} duplicate(s)`);

    // Update recipe_ingredients to use the kept ID
    for (const deleteId of deleteIds) {
      const updated = await db.execute(sql`
        UPDATE recipe_ingredients
        SET ingredient_id = ${keepId}
        WHERE ingredient_id = ${deleteId}
      `);

      if (updated.rowCount && updated.rowCount > 0) {
        console.log(`  ↳ Updated ${updated.rowCount} recipe ingredient references`);
      }
    }

    // Delete consumption tracking for duplicates
    const deletedTracking = await db.execute(sql`
      DELETE FROM inventory_consumption_tracking
      WHERE inventory_item_id = ANY(ARRAY[${sql.raw(deleteIds.map(id => `'${id}'`).join(','))}]::uuid[])
    `);

    if (deletedTracking.rowCount && deletedTracking.rowCount > 0) {
      console.log(`  ↳ Deleted ${deletedTracking.rowCount} consumption tracking records`);
    }

    // Delete the duplicate inventory items
    const deleted = await db.execute(sql`
      DELETE FROM inventory_items
      WHERE id = ANY(ARRAY[${sql.raw(deleteIds.map(id => `'${id}'`).join(','))}]::uuid[])
    `);

    totalDeleted += deleted.rowCount || 0;
    console.log(`  ✓ Deleted ${deleted.rowCount} duplicate(s)`);
  }

  console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate inventory items.`);

  await pool.end();
}

cleanupDuplicates().catch(console.error);

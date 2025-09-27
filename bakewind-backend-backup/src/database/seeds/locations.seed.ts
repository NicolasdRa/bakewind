import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../schemas';

export async function seedLocations(db: NodePgDatabase<typeof schema>) {
  console.log('📍 Seeding locations...');

  try {
    // First, get the admin user
    const existingUsers = await db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.email, 'admin@bakewind.com'))
      .limit(1);

    if (existingUsers.length === 0) {
      console.log('⚠️ No admin user found. Run users seed first.');
      return;
    }

    const testUser = existingUsers[0];
    console.log('👤 Found test user:', testUser.email);

    // Check if locations already exist
    const existingLocations = await db
      .select()
      .from(schema.locationsTable)
      .limit(2);

    // Check if user already has locations assigned
    const existingUserLocations = await db
      .select()
      .from(schema.userLocationsTable)
      .where(eq(schema.userLocationsTable.userId, testUser.id))
      .limit(1);

    if (existingLocations.length > 0 && existingUserLocations.length > 0) {
      console.log('📍 Locations and user assignments already exist, skipping...');
      return;
    }

    let locationsToAssign = existingLocations;

    // If no locations exist, create them
    if (existingLocations.length === 0) {
      const locations = [
        {
          name: 'Downtown Bakery',
          address: '123 Main Street',
          city: 'Downtown',
          state: 'CA',
          country: 'USA',
          postalCode: '12345',
          timezone: 'America/Los_Angeles',
          phoneNumber: '+1-555-0101',
          email: 'downtown@bakewind.com',
          description: 'Our flagship location in the heart of downtown'
        },
        {
          name: 'Uptown Bakery',
          address: '456 Oak Avenue',
          city: 'Uptown',
          state: 'CA',
          country: 'USA',
          postalCode: '12346',
          timezone: 'America/Los_Angeles',
          phoneNumber: '+1-555-0102',
          email: 'uptown@bakewind.com',
          description: 'Our cozy uptown location with artisanal specialties'
        }
      ];

      // Insert locations
      const insertedLocations = await db
        .insert(schema.locationsTable)
        .values(locations)
        .returning();

      console.log(`📍 Created ${insertedLocations.length} locations`);
      locationsToAssign = insertedLocations;
    } else {
      console.log(`📍 Using ${existingLocations.length} existing locations`);
    }

    // Associate locations with the test user
    const userLocationAssignments = locationsToAssign.map((location, index) => ({
      userId: testUser.id,
      locationId: location.id,
      isDefault: index === 0 // First location is default
    }));

    await db
      .insert(schema.userLocationsTable)
      .values(userLocationAssignments);

    console.log(`🔗 Assigned ${userLocationAssignments.length} locations to test user`);

  } catch (error) {
    console.error('❌ Failed to seed locations:', error);
    throw error;
  }
}
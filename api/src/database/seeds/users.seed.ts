import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcryptjs';
import { usersTable, locationsTable, userLocationsTable } from '../schemas';
import * as schema from '../schemas';

export async function seedUsers(db: NodePgDatabase<typeof schema>) {
  console.log('🌱 Seeding users...');

  // Create test locations first
  const [location1, location2] = await db
    .insert(locationsTable)
    .values([
      {
        name: 'Downtown Bakery',
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        timezone: 'America/New_York',
        phoneNumber: '+1-555-0101',
        email: 'downtown@bakewind.com',
      },
      {
        name: 'Uptown Bakery',
        address: '456 Oak Ave',
        city: 'New York',
        country: 'USA',
        timezone: 'America/New_York',
        phoneNumber: '+1-555-0102',
        email: 'uptown@bakewind.com',
      },
    ])
    .onConflictDoNothing()
    .returning();

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create test users with new role structure
  // ADMIN: System admin with full access
  // OWNER: Bakery business owner (has associated tenant)
  // STAFF: Bakery employee (has associated staff profile in staff table)
  // CUSTOMER: End customer (has associated customer profile)
  const users = await db
    .insert(usersTable)
    .values([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'admin@bakewind.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
        phoneNumber: '+1-555-0001',
        country: 'USA',
        city: 'New York',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'owner@bakewind.com',
        password: hashedPassword,
        role: 'OWNER',
        isActive: true,
        isEmailVerified: true,
        phoneNumber: '+1-555-0002',
        country: 'USA',
        city: 'New York',
      },
      {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'staff@bakewind.com',
        password: hashedPassword,
        role: 'STAFF',
        isActive: true,
        isEmailVerified: true,
        phoneNumber: '+1-555-0003',
        country: 'USA',
        city: 'New York',
      },
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'customer@bakewind.com',
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
        phoneNumber: '+1-555-0004',
        country: 'USA',
        city: 'New York',
      },
    ])
    .onConflictDoNothing()
    .returning();

  // Assign users to locations
  if (
    users.length >= 4 &&
    users[0] &&
    users[1] &&
    users[2] &&
    users[3] &&
    location1 &&
    location2
  ) {
    await db
      .insert(userLocationsTable)
      .values([
        // Admin has access to both locations
        {
          userId: users[0].id,
          locationId: location1.id,
          isDefault: true,
        },
        {
          userId: users[0].id,
          locationId: location2.id,
          isDefault: false,
        },
        // Manager has access to both locations
        {
          userId: users[1].id,
          locationId: location1.id,
          isDefault: true,
        },
        {
          userId: users[1].id,
          locationId: location2.id,
          isDefault: false,
        },
        // Staff only has downtown location
        {
          userId: users[2].id,
          locationId: location1.id,
          isDefault: true,
        },
        // Viewer only has downtown location
        {
          userId: users[3].id,
          locationId: location1.id,
          isDefault: true,
        },
      ])
      .onConflictDoNothing();
  }

  console.log('✅ Users seeded successfully!');
  console.log('Test accounts:');
  console.log('  Admin: admin@bakewind.com / password123');
  console.log('  Owner: owner@bakewind.com / password123');
  console.log('  Staff: staff@bakewind.com / password123');
  console.log('  Customer: customer@bakewind.com / password123');
}

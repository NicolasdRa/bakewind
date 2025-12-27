import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { usersTable, locationsTable, userLocationsTable, tenantsTable } from '../schemas';
import * as schema from '../schemas';

export async function seedUsers(db: NodePgDatabase<typeof schema>) {
  console.log('🌱 Seeding users...');

  // Hash passwords first
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create OWNER user first (needed for tenant)
  const [ownerUser] = await db
    .insert(usersTable)
    .values({
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
    })
    .onConflictDoNothing()
    .returning();

  // Get the actual owner user ID (whether just created or already existed)
  let ownerUserId: string;
  if (ownerUser) {
    ownerUserId = ownerUser.id;
  } else {
    // User already exists, find them
    const existingOwner = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, 'owner@bakewind.com'),
    });
    if (!existingOwner) {
      console.log('⚠️ Could not find owner user');
      return;
    }
    ownerUserId = existingOwner.id;
  }

  // Create tenant for the owner if it doesn't exist
  let tenantId: string;
  const existingTenant = await db.query.tenantsTable.findFirst({
    where: eq(tenantsTable.ownerUserId, ownerUserId),
  });

  if (existingTenant) {
    tenantId = existingTenant.id;
    console.log('🏢 Using existing tenant:', existingTenant.businessName);
  } else {
    const [tenant] = await db
      .insert(tenantsTable)
      .values({
        ownerUserId: ownerUserId,
        businessName: 'BakeWind Demo Bakery',
        businessPhone: '+1-555-0100',
        subscriptionStatus: 'active',
      })
      .returning();
    tenantId = tenant?.id || '';
    console.log('🏢 Created new tenant:', tenant?.businessName);
  }

  if (!tenantId) {
    console.log('⚠️ No tenant available, skipping location seeding');
    return;
  }

  // Create test locations with tenantId
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
        tenantId,
      },
      {
        name: 'Uptown Bakery',
        address: '456 Oak Ave',
        city: 'New York',
        country: 'USA',
        timezone: 'America/New_York',
        phoneNumber: '+1-555-0102',
        email: 'uptown@bakewind.com',
        tenantId,
      },
    ])
    .onConflictDoNothing()
    .returning();

  // Create remaining test users
  // ADMIN: System admin with full access
  // STAFF: Bakery employee (has associated staff profile in staff table)
  // CUSTOMER: End customer (has associated customer profile)
  // Note: OWNER already created above
  const additionalUsers = await db
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

  // Combine owner with additional users
  const users = ownerUser ? [additionalUsers[0], ownerUser, additionalUsers[1], additionalUsers[2]] : additionalUsers;

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

import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, like, or, isNull, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { locationsTable, userLocationsTable } from '../database/schemas';
import * as schema from '../database/schemas';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationResponseData,
  AssignUserToLocationDto,
  LocationQueryParams,
  locationResponseDataSchema,
} from './locations.validation';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(locationData: CreateLocationDto): Promise<LocationResponseData> {
    // Check for duplicate location name in the same city
    const existingLocation = await this.db
      .select()
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.name, locationData.name),
          eq(locationsTable.city, locationData.city),
          isNull(locationsTable.deletedAt),
        ),
      )
      .limit(1);

    if (existingLocation.length > 0) {
      throw new ConflictException(
        `Location with name "${locationData.name}" already exists in ${locationData.city}`,
      );
    }

    const [location] = await this.db
      .insert(locationsTable)
      .values(locationData)
      .returning();

    if (!location) {
      throw new Error('Failed to create location');
    }

    this.logger.log(
      `Created new location: ${location.name} in ${location.city}`,
    );

    return locationResponseDataSchema.parse(location);
  }

  async findAll(
    query: Partial<LocationQueryParams> = {},
  ): Promise<LocationResponseData[]> {
    const { isActive, city, country, search, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const whereConditions = [isNull(locationsTable.deletedAt)];

    if (isActive !== undefined) {
      whereConditions.push(eq(locationsTable.isActive, isActive));
    }

    if (city) {
      whereConditions.push(eq(locationsTable.city, city));
    }

    if (country) {
      whereConditions.push(eq(locationsTable.country, country));
    }

    if (search) {
      const searchCondition = or(
        like(locationsTable.name, `%${search}%`),
        like(locationsTable.address, `%${search}%`),
        like(locationsTable.city, `%${search}%`),
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    const locations = await this.db
      .select()
      .from(locationsTable)
      .where(
        whereConditions.length > 1
          ? and(...whereConditions)
          : whereConditions[0],
      )
      .orderBy(locationsTable.name)
      .limit(limit)
      .offset(offset);

    return locations.map((location) =>
      locationResponseDataSchema.parse(location),
    );
  }

  async findById(id: string): Promise<LocationResponseData> {
    const [location] = await this.db
      .select()
      .from(locationsTable)
      .where(and(eq(locationsTable.id, id), isNull(locationsTable.deletedAt)))
      .limit(1);

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return locationResponseDataSchema.parse(location);
  }

  async update(
    id: string,
    locationData: UpdateLocationDto,
  ): Promise<LocationResponseData> {
    const existingLocation = await this.findById(id);

    // Check for duplicate name if name is being updated
    if (locationData.name && locationData.name !== existingLocation.name) {
      const city = locationData.city || existingLocation.city;
      const duplicateLocation = await this.db
        .select()
        .from(locationsTable)
        .where(
          and(
            eq(locationsTable.name, locationData.name),
            eq(locationsTable.city, city),
            sql`${locationsTable.id} != ${id}`,
            isNull(locationsTable.deletedAt),
          ),
        )
        .limit(1);

      if (duplicateLocation.length > 0) {
        throw new ConflictException(
          `Location with name "${locationData.name}" already exists in ${city}`,
        );
      }
    }

    const [updatedLocation] = await this.db
      .update(locationsTable)
      .set({
        ...locationData,
        updatedAt: new Date(),
      })
      .where(eq(locationsTable.id, id))
      .returning();

    if (!updatedLocation) {
      throw new Error('Failed to update location');
    }

    this.logger.log(`Updated location: ${updatedLocation.name}`);

    return locationResponseDataSchema.parse(updatedLocation);
  }

  async remove(id: string): Promise<void> {
    const existingLocation = await this.findById(id);

    // Soft delete
    await this.db
      .update(locationsTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(locationsTable.id, id));

    this.logger.log(`Soft deleted location: ${existingLocation.name}`);
  }

  // User-Location relationship methods
  async assignUserToLocation(
    assignmentData: AssignUserToLocationDto,
  ): Promise<void> {
    // Check if location exists
    await this.findById(assignmentData.locationId);

    // Check if assignment already exists
    const existingAssignment = await this.db
      .select()
      .from(userLocationsTable)
      .where(
        and(
          eq(userLocationsTable.userId, assignmentData.userId),
          eq(userLocationsTable.locationId, assignmentData.locationId),
        ),
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      throw new ConflictException('User is already assigned to this location');
    }

    // If this is set as default, remove default from other locations for this user
    if (assignmentData.isDefault) {
      await this.db
        .update(userLocationsTable)
        .set({ isDefault: false })
        .where(eq(userLocationsTable.userId, assignmentData.userId));
    }

    await this.db.insert(userLocationsTable).values(assignmentData);

    this.logger.log(
      `Assigned user ${assignmentData.userId} to location ${assignmentData.locationId}`,
    );
  }

  async removeUserFromLocation(
    userId: string,
    locationId: string,
  ): Promise<void> {
    const existingAssignment = await this.db
      .select()
      .from(userLocationsTable)
      .where(
        and(
          eq(userLocationsTable.userId, userId),
          eq(userLocationsTable.locationId, locationId),
        ),
      )
      .limit(1);

    if (existingAssignment.length === 0) {
      throw new NotFoundException('User is not assigned to this location');
    }

    await this.db
      .delete(userLocationsTable)
      .where(
        and(
          eq(userLocationsTable.userId, userId),
          eq(userLocationsTable.locationId, locationId),
        ),
      );

    this.logger.log(`Removed user ${userId} from location ${locationId}`);
  }

  async getUserLocations(userId: string): Promise<LocationResponseData[]> {
    console.log('📍 [LOCATIONS_SERVICE] Getting locations for user:', userId);

    const userLocations = await this.db
      .select({
        location: locationsTable,
      })
      .from(userLocationsTable)
      .innerJoin(
        locationsTable,
        eq(userLocationsTable.locationId, locationsTable.id),
      )
      .where(
        and(
          eq(userLocationsTable.userId, userId),
          isNull(locationsTable.deletedAt),
        ),
      )
      .orderBy(locationsTable.name);

    console.log(
      '📍 [LOCATIONS_SERVICE] Found locations:',
      userLocations.length,
    );

    return userLocations.map((ul) =>
      locationResponseDataSchema.parse(ul.location),
    );
  }

  async getLocationUsers(locationId: string): Promise<string[]> {
    // Verify location exists
    await this.findById(locationId);

    const locationUsers = await this.db
      .select({ userId: userLocationsTable.userId })
      .from(userLocationsTable)
      .where(eq(userLocationsTable.locationId, locationId));

    return locationUsers.map((lu) => lu.userId);
  }

  async setDefaultLocation(userId: string, locationId: string): Promise<void> {
    // Verify user is assigned to this location
    const assignment = await this.db
      .select()
      .from(userLocationsTable)
      .where(
        and(
          eq(userLocationsTable.userId, userId),
          eq(userLocationsTable.locationId, locationId),
        ),
      )
      .limit(1);

    if (assignment.length === 0) {
      throw new NotFoundException('User is not assigned to this location');
    }

    // Remove default from all other locations for this user
    await this.db
      .update(userLocationsTable)
      .set({ isDefault: false })
      .where(eq(userLocationsTable.userId, userId));

    // Set this location as default
    await this.db
      .update(userLocationsTable)
      .set({ isDefault: true })
      .where(
        and(
          eq(userLocationsTable.userId, userId),
          eq(userLocationsTable.locationId, locationId),
        ),
      );

    this.logger.log(`Set location ${locationId} as default for user ${userId}`);
  }

  async getUserDefaultLocation(
    userId: string,
  ): Promise<LocationResponseData | null> {
    const [defaultLocation] = await this.db
      .select({
        location: locationsTable,
      })
      .from(userLocationsTable)
      .innerJoin(
        locationsTable,
        eq(userLocationsTable.locationId, locationsTable.id),
      )
      .where(
        and(
          eq(userLocationsTable.userId, userId),
          eq(userLocationsTable.isDefault, true),
          isNull(locationsTable.deletedAt),
        ),
      )
      .limit(1);

    return defaultLocation
      ? locationResponseDataSchema.parse(defaultLocation.location)
      : null;
  }
}

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { staffTable, usersTable } from '../database/schemas';
import * as schema from '../database/schemas';
import { CreateStaffDto, UpdateStaffDto } from './dto';

@Injectable()
export class StaffService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get staff record by user ID
   * This is the primary method for fetching current user's staff profile
   */
  async findByUserId(userId: string) {
    const [result] = await this.db
      .select()
      .from(staffTable)
      .where(eq(staffTable.userId, userId))
      .limit(1);
    return result || null;
  }

  /**
   * Get staff record by ID
   */
  async findById(id: string) {
    const [result] = await this.db
      .select()
      .from(staffTable)
      .where(eq(staffTable.id, id))
      .limit(1);
    return result || null;
  }

  /**
   * Get all staff for a tenant with user information
   */
  async findAllByTenant(tenantId: string) {
    const results = await this.db
      .select({
        id: staffTable.id,
        userId: staffTable.userId,
        tenantId: staffTable.tenantId,
        position: staffTable.position,
        department: staffTable.department,
        areas: staffTable.areas,
        permissions: staffTable.permissions,
        hireDate: staffTable.hireDate,
        createdAt: staffTable.createdAt,
        updatedAt: staffTable.updatedAt,
        // User information
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
      })
      .from(staffTable)
      .innerJoin(usersTable, eq(staffTable.userId, usersTable.id))
      .where(eq(staffTable.tenantId, tenantId));

    return results;
  }

  /**
   * Get staff by ID within a tenant (for tenant-scoped access)
   */
  async findByIdAndTenant(id: string, tenantId: string) {
    const [result] = await this.db
      .select()
      .from(staffTable)
      .where(and(eq(staffTable.id, id), eq(staffTable.tenantId, tenantId)))
      .limit(1);
    return result || null;
  }

  /**
   * Create a new staff record
   */
  async create(data: CreateStaffDto) {
    // Check if user already has a staff record
    const existing = await this.findByUserId(data.userId);
    if (existing) {
      throw new ConflictException('User already has a staff record');
    }

    const [created] = await this.db
      .insert(staffTable)
      .values({
        userId: data.userId,
        tenantId: data.tenantId,
        position: data.position,
        department: data.department,
        areas: data.areas || [],
        permissions: data.permissions || {},
        hireDate: data.hireDate ? new Date(data.hireDate) : null,
      })
      .returning();

    return created;
  }

  /**
   * Update a staff record
   */
  async update(id: string, data: UpdateStaffDto) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Staff record not found');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.position !== undefined) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.areas !== undefined) updateData.areas = data.areas;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.hireDate !== undefined) {
      updateData.hireDate = data.hireDate ? new Date(data.hireDate) : null;
    }

    const [updated] = await this.db
      .update(staffTable)
      .set(updateData)
      .where(eq(staffTable.id, id))
      .returning();

    return updated;
  }

  /**
   * Update staff by user ID (for self-service updates)
   */
  async updateByUserId(userId: string, data: UpdateStaffDto) {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new NotFoundException('Staff record not found');
    }

    return this.update(existing.id, data);
  }

  /**
   * Delete a staff record
   */
  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Staff record not found');
    }

    await this.db.delete(staffTable).where(eq(staffTable.id, id));
  }

  /**
   * Delete staff by tenant (admin cleanup)
   */
  async deleteByTenant(tenantId: string) {
    await this.db.delete(staffTable).where(eq(staffTable.tenantId, tenantId));
  }
}

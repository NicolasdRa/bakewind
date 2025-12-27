import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, gt } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { usersTable, userLocationsTable } from '../database/schemas';
import * as schema from '../database/schemas';
import { UserRegistration, UserUpdate, UsersData } from './users.validation';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userData: UserRegistration,
  ): Promise<Omit<UsersData, 'password'>> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const [user] = await this.db
      .insert(usersTable)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    if (!user) {
      throw new Error('Failed to create user');
    }

    this.logger.log(`Created new user: ${user.email}`);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<UsersData, 'password' | 'refreshToken'>[]> {
    const users = await this.db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        role: usersTable.role,
        isActive: usersTable.isActive,
        isEmailVerified: usersTable.isEmailVerified,
        gender: usersTable.gender,
        dateOfBirth: usersTable.dateOfBirth,
        phoneNumber: usersTable.phoneNumber,
        country: usersTable.country,
        city: usersTable.city,
        profilePictureUrl: usersTable.profilePictureUrl,
        bio: usersTable.bio,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        deletedAt: usersTable.deletedAt,
        lastLoginAt: usersTable.lastLoginAt,
        lastLogoutAt: usersTable.lastLogoutAt,
        refreshTokenExpiresAt: usersTable.refreshTokenExpiresAt,
        emailVerificationToken: usersTable.emailVerificationToken,
        passwordResetToken: usersTable.passwordResetToken,
        passwordResetExpires: usersTable.passwordResetExpires,
      })
      .from(usersTable);

    return users;
  }

  async findById(
    id: string,
  ): Promise<Omit<UsersData, 'password' | 'refreshToken'> | null> {
    const [user] = await this.db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        role: usersTable.role,
        isActive: usersTable.isActive,
        isEmailVerified: usersTable.isEmailVerified,
        gender: usersTable.gender,
        dateOfBirth: usersTable.dateOfBirth,
        phoneNumber: usersTable.phoneNumber,
        country: usersTable.country,
        city: usersTable.city,
        profilePictureUrl: usersTable.profilePictureUrl,
        bio: usersTable.bio,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        deletedAt: usersTable.deletedAt,
        lastLoginAt: usersTable.lastLoginAt,
        lastLogoutAt: usersTable.lastLogoutAt,
        refreshTokenExpiresAt: usersTable.refreshTokenExpiresAt,
        emailVerificationToken: usersTable.emailVerificationToken,
        passwordResetToken: usersTable.passwordResetToken,
        passwordResetExpires: usersTable.passwordResetExpires,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    return user || null;
  }

  async findByEmail(email: string): Promise<UsersData | null> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return user || null;
  }

  async update(
    id: string,
    userData: UserUpdate,
  ): Promise<Omit<UsersData, 'password'>> {
    const [existingUser] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`🔧 Processing update for user ID: ${id}`);
    this.logger.log(`📊 Raw update data:`, userData);

    // Prepare update fields with proper typing
    const updateFields = {
      ...userData,
      updatedAt: new Date(),
    };

    // Convert undefined to null for nullable fields to match database schema
    (Object.keys(userData) as Array<keyof UserUpdate>).forEach((key) => {
      const value = userData[key];
      const processedValue = value === undefined ? null : value;
      (updateFields as any)[key] = processedValue;
      this.logger.log(
        `  ${key}: ${JSON.stringify(value)} → ${JSON.stringify(processedValue)}`,
      );
    });

    this.logger.log(`🗃️ Final update fields:`, updateFields);

    const [updatedUser] = await this.db
      .update(usersTable)
      .set(updateFields)
      .where(eq(usersTable.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    this.logger.log(`✅ Successfully updated user: ${updatedUser.email}`);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.db
      .update(usersTable)
      .set({
        refreshToken,
        refreshTokenExpiresAt: refreshToken
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null, // 7 days
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db
      .update(usersTable)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));
  }

  async toggleUserStatus(id: string): Promise<Omit<UsersData, 'password'>> {
    const [existingUser] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const [updatedUser] = await this.db
      .update(usersTable)
      .set({
        isActive: !existingUser.isActive,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to toggle user status');
    }

    this.logger.log(
      `Toggled user status: ${updatedUser.email}, isActive: ${updatedUser.isActive}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const [existingUser] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.db
      .update(usersTable)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id));

    this.logger.log(`Changed password for user: ${existingUser.email}`);
  }

  async delete(id: string): Promise<void> {
    return this.remove(id);
  }

  async remove(id: string): Promise<void> {
    const [existingUser] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete
    await this.db
      .update(usersTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id));

    this.logger.log(`Soft deleted user: ${existingUser.email}`);
  }

  async getUserLocationIds(userId: string): Promise<string[]> {
    try {
      const userLocations = await this.db
        .select({ locationId: userLocationsTable.locationId })
        .from(userLocationsTable)
        .where(eq(userLocationsTable.userId, userId));

      return userLocations.map((ul) => ul.locationId);
    } catch (error) {
      this.logger.warn(`Failed to get user locations for ${userId}:`, error);
      // Return empty array if query fails
      return [];
    }
  }

  /**
   * Generate and save a password reset token for a user
   * Token expires in 1 hour
   */
  async setPasswordResetToken(email: string): Promise<{ token: string; user: { firstName: string; email: string } } | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.db
      .update(usersTable)
      .set({
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    this.logger.log(`Password reset token generated for user: ${email}`);

    return {
      token, // Return the unhashed token (to be sent in email)
      user: {
        firstName: user.firstName,
        email: user.email,
      },
    };
  }

  /**
   * Find a user by their password reset token
   * Only returns user if token is valid and not expired
   */
  async findByPasswordResetToken(token: string): Promise<UsersData | null> {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.passwordResetToken, hashedToken),
          gt(usersTable.passwordResetExpires, new Date()),
        ),
      )
      .limit(1);

    return user || null;
  }

  /**
   * Reset a user's password using a valid reset token
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    const user = await this.findByPasswordResetToken(token);
    if (!user) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.db
      .update(usersTable)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    this.logger.log(`Password reset successful for user: ${user.email}`);
    return true;
  }
}

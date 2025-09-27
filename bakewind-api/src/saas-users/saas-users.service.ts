import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, isNull, gt } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { usersTable } from '../database/schemas/users.schema';
import { trialAccountsTable } from '../database/schemas/trial-accounts.schema';

export interface CreateTrialUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  phoneNumber?: string;
  signupSource: string;
  businessSize: '1' | '2-3' | '4-10' | '10+';
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
}

@Injectable()
export class SaasUsersService {
  private readonly logger = new Logger(SaasUsersService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new trial user with associated trial account
   */
  async createTrialUser(userData: CreateTrialUserData) {
    const { email, password, firstName, lastName, businessName, phoneNumber, signupSource, businessSize } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.databaseService.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Calculate trial end date (14 days from now)
      const trialLengthDays = this.configService.get<number>('TRIAL_LENGTH_DAYS', 14);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialLengthDays);

      // Create user in transaction
      const result = await this.databaseService.db.transaction(async (tx) => {
        // Insert user
        const [newUser] = await tx
          .insert(usersTable)
          .values({
            email,
            password: passwordHash,
            firstName,
            lastName,
            businessName,
            phoneNumber,
            role: 'trial_user',
            subscriptionStatus: 'trial',
            trialEndsAt,
            isEmailVerified: false,
          })
          .returning();

        // Insert trial account
        const [trialAccount] = await tx
          .insert(trialAccountsTable)
          .values({
            userId: newUser.id,
            signupSource,
            businessSize,
            trialLengthDays,
            onboardingCompleted: false,
            sampleDataLoaded: false,
            conversionRemindersSent: 0,
          })
          .returning();

        return { user: newUser, trialAccount };
      });

      this.logger.log(`Created trial user ${result.user.id} for email ${email}`);

      // Remove password hash from response
      const { password: _, ...userWithoutPassword } = result.user;
      return { user: userWithoutPassword, trialAccount: result.trialAccount };

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create trial user for ${email}:`, error);
      throw new BadRequestException('Failed to create trial user');
    }
  }

  /**
   * Find user by email with password for authentication
   */
  async findUserByEmailWithPassword(email: string) {
    try {
      const [user] = await this.databaseService.db
        .select()
        .from(usersTable)
        .where(and(
          eq(usersTable.email, email),
          eq(usersTable.isActive, true),
          isNull(usersTable.deletedAt)
        ))
        .limit(1);

      return user || null;
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}:`, error);
      return null;
    }
  }

  /**
   * Find user by ID without password
   */
  async findUserById(userId: string) {
    try {
      const [user] = await this.databaseService.db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          businessName: usersTable.businessName,
          phoneNumber: usersTable.phoneNumber,
          role: usersTable.role,
          subscriptionStatus: usersTable.subscriptionStatus,
          trialEndsAt: usersTable.trialEndsAt,
          isEmailVerified: usersTable.isEmailVerified,
          isActive: usersTable.isActive,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          lastLoginAt: usersTable.lastLoginAt,
        })
        .from(usersTable)
        .where(and(
          eq(usersTable.id, userId),
          eq(usersTable.isActive, true),
          isNull(usersTable.deletedAt)
        ))
        .limit(1);

      return user || null;
    } catch (error) {
      this.logger.error(`Failed to find user by ID ${userId}:`, error);
      return null;
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updateData: UpdateUserData) {
    try {
      const [updatedUser] = await this.databaseService.db
        .update(usersTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(usersTable.id, userId),
          eq(usersTable.isActive, true),
          isNull(usersTable.deletedAt)
        ))
        .returning({
          id: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          businessName: usersTable.businessName,
          phoneNumber: usersTable.phoneNumber,
          role: usersTable.role,
          subscriptionStatus: usersTable.subscriptionStatus,
          trialEndsAt: usersTable.trialEndsAt,
          isEmailVerified: usersTable.isEmailVerified,
          isActive: usersTable.isActive,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          lastLoginAt: usersTable.lastLoginAt,
        });

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Updated user ${userId}`);
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update user ${userId}:`, error);
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string) {
    try {
      await this.databaseService.db
        .update(usersTable)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));

      this.logger.log(`Updated last login for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update last login for user ${userId}:`, error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Check if user's trial has expired
   */
  async isTrialExpired(userId: string): Promise<boolean> {
    try {
      const user = await this.findUserById(userId);
      if (!user || user.role !== 'trial_user' || !user.trialEndsAt) {
        return false; // Not a trial user or no trial end date
      }

      return new Date() > user.trialEndsAt;
    } catch (error) {
      this.logger.error(`Failed to check trial expiration for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get users with expiring trials for reminder emails
   */
  async getUsersWithExpiringTrials(daysUntilExpiration: number) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysUntilExpiration);

      const users = await this.databaseService.db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          businessName: usersTable.businessName,
          trialEndsAt: usersTable.trialEndsAt,
        })
        .from(usersTable)
        .innerJoin(trialAccountsTable, eq(trialAccountsTable.userId, usersTable.id))
        .where(and(
          eq(usersTable.role, 'trial_user'),
          eq(usersTable.subscriptionStatus, 'trial'),
          eq(usersTable.isActive, true),
          isNull(usersTable.deletedAt),
          gt(usersTable.trialEndsAt, new Date()), // Trial not yet expired
          eq(usersTable.trialEndsAt, cutoffDate), // Expires on cutoff date
        ));

      return users;
    } catch (error) {
      this.logger.error(`Failed to get users with expiring trials:`, error);
      return [];
    }
  }

  /**
   * Convert trial user to subscriber
   */
  async convertTrialToSubscriber(userId: string, planId: string) {
    try {
      const result = await this.databaseService.db.transaction(async (tx) => {
        // Update user to subscriber
        const [updatedUser] = await tx
          .update(usersTable)
          .set({
            role: 'subscriber',
            subscriptionStatus: 'active',
            trialEndsAt: null,
            updatedAt: new Date(),
          })
          .where(eq(usersTable.id, userId))
          .returning();

        // Update trial account with conversion info
        const [updatedTrial] = await tx
          .update(trialAccountsTable)
          .set({
            convertedAt: new Date(),
            convertedToPlanId: planId,
            updatedAt: new Date(),
          })
          .where(eq(trialAccountsTable.userId, userId))
          .returning();

        return { user: updatedUser, trialAccount: updatedTrial };
      });

      this.logger.log(`Converted trial user ${userId} to subscriber with plan ${planId}`);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = result.user;
      return { user: userWithoutPassword, trialAccount: result.trialAccount };

    } catch (error) {
      this.logger.error(`Failed to convert trial user ${userId} to subscriber:`, error);
      throw new BadRequestException('Failed to convert trial to subscription');
    }
  }

  /**
   * Soft delete user account
   */
  async deleteUser(userId: string) {
    try {
      const [deletedUser] = await this.databaseService.db
        .update(usersTable)
        .set({
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(usersTable.id, userId),
          eq(usersTable.isActive, true),
          isNull(usersTable.deletedAt)
        ))
        .returning({ id: usersTable.id });

      if (!deletedUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Soft deleted user ${userId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete user ${userId}:`, error);
      throw new BadRequestException('Failed to delete user');
    }
  }

  /**
   * Get user statistics for admin dashboard
   */
  async getUserStatistics() {
    try {
      const stats = await this.databaseService.db
        .select({
          totalUsers: usersTable.id,
          role: usersTable.role,
          subscriptionStatus: usersTable.subscriptionStatus,
        })
        .from(usersTable)
        .where(and(
          eq(usersTable.isActive, true),
          isNull(usersTable.deletedAt)
        ));

      const summary = stats.reduce((acc, user) => {
        acc.total += 1;
        acc.byRole[user.role] = (acc.byRole[user.role] || 0) + 1;
        acc.byStatus[user.subscriptionStatus] = (acc.byStatus[user.subscriptionStatus] || 0) + 1;
        return acc;
      }, {
        total: 0,
        byRole: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
      });

      return summary;
    } catch (error) {
      this.logger.error('Failed to get user statistics:', error);
      return { total: 0, byRole: {}, byStatus: {} };
    }
  }
}
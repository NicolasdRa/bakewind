import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { saasUsersTable } from '../database/schemas/saas-users';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

export interface CreateSaasUserDto {
  email: string;
  password: string;
  companyName: string;
  companyPhone?: string;
  companyAddress?: string;
  role?: 'owner' | 'admin' | 'user';
  subscriptionPlanId?: string;
  trialAccountId?: string;
  stripeCustomerId?: string;
}

export interface UpdateSaasUserDto {
  email?: string;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  role?: 'owner' | 'admin' | 'user';
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  lastLoginAt?: Date;
  lastPaymentDate?: Date;
}

export interface UpdateSubscriptionDto {
  subscriptionStatus?: string;
  subscriptionPlanId?: string;
  stripeSubscriptionId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  lastPaymentDate?: Date;
}

@Injectable()
export class SaasUsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async create(createDto: CreateSaasUserDto) {
    const { email, password, ...userData } = createDto;

    // Check if email already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(password, bcryptRounds);

    // Create user
    const [newUser] = await this.db.database
      .insert(saasUsersTable)
      .values({
        email,
        passwordHash,
        companyName: userData.companyName,
        companyPhone: userData.companyPhone,
        companyAddress: userData.companyAddress,
        role: userData.role || 'owner',
        subscriptionPlanId: userData.subscriptionPlanId,
        trialAccountId: userData.trialAccountId,
        stripeCustomerId: userData.stripeCustomerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async findAll(limit = 20, offset = 0) {
    const users = await this.db.database
      .select({
        id: saasUsersTable.id,
        email: saasUsersTable.email,
        companyName: saasUsersTable.companyName,
        companyPhone: saasUsersTable.companyPhone,
        companyAddress: saasUsersTable.companyAddress,
        role: saasUsersTable.role,
        subscriptionPlanId: saasUsersTable.subscriptionPlanId,
        trialAccountId: saasUsersTable.trialAccountId,
        stripeCustomerId: saasUsersTable.stripeCustomerId,
        emailVerified: saasUsersTable.emailVerified,
        onboardingCompleted: saasUsersTable.onboardingCompleted,
        lastLoginAt: saasUsersTable.lastLoginAt,
        createdAt: saasUsersTable.createdAt,
        updatedAt: saasUsersTable.updatedAt,
      })
      .from(saasUsersTable)
      .where(isNull(saasUsersTable.deletedAt))
      .limit(limit)
      .offset(offset);

    return users;
  }

  async findById(id: string) {
    const [user] = await this.db.database
      .select()
      .from(saasUsersTable)
      .where(and(eq(saasUsersTable.id, id), isNull(saasUsersTable.deletedAt)));

    if (!user) {
      throw new NotFoundException(`SaaS user with ID ${id} not found`);
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string) {
    const [user] = await this.db.database
      .select()
      .from(saasUsersTable)
      .where(and(eq(saasUsersTable.email, email), isNull(saasUsersTable.deletedAt)));

    return user;
  }

  async findByEmailWithPassword(email: string) {
    const [user] = await this.db.database
      .select()
      .from(saasUsersTable)
      .where(and(eq(saasUsersTable.email, email), isNull(saasUsersTable.deletedAt)));

    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string) {
    const [user] = await this.db.database
      .select()
      .from(saasUsersTable)
      .where(
        and(
          eq(saasUsersTable.stripeCustomerId, stripeCustomerId),
          isNull(saasUsersTable.deletedAt)
        )
      );

    if (!user) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByStripeSubscriptionId(subscriptionId: string) {
    // For now, search by Stripe subscription ID stored in user metadata
    // This is a placeholder implementation that should be replaced with proper subscription tracking
    const [user] = await this.db.database
      .select()
      .from(saasUsersTable)
      .where(and(
        eq(saasUsersTable.stripeCustomerId, subscriptionId), // Note: This is not ideal, should be subscription ID
        isNull(saasUsersTable.deletedAt)
      ));

    if (!user) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, updateDto: UpdateSaasUserDto) {
    const user = await this.findById(id);

    const [updatedUser] = await this.db.database
      .update(saasUsersTable)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      })
      .where(eq(saasUsersTable.id, id))
      .returning();

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateSubscription(userId: string, subscriptionDto: UpdateSubscriptionDto) {
    const user = await this.findById(userId);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (subscriptionDto.subscriptionPlanId !== undefined) {
      updateData.subscriptionPlanId = subscriptionDto.subscriptionPlanId;
    }

    // Store additional subscription data in user metadata or separate table
    const [updatedUser] = await this.db.database
      .update(saasUsersTable)
      .set(updateData)
      .where(eq(saasUsersTable.id, userId))
      .returning();

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updatePassword(id: string, newPassword: string) {
    const user = await this.findById(id);

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(newPassword, bcryptRounds);

    await this.db.database
      .update(saasUsersTable)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(saasUsersTable.id, id));

    return { message: 'Password updated successfully' };
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmailWithPassword(email);
    if (!user) {
      return false;
    }

    return bcrypt.compare(password, user.passwordHash);
  }

  async verifyEmail(id: string) {
    const [updatedUser] = await this.db.database
      .update(saasUsersTable)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(saasUsersTable.id, id))
      .returning();

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async completeOnboarding(id: string) {
    const [updatedUser] = await this.db.database
      .update(saasUsersTable)
      .set({
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(saasUsersTable.id, id))
      .returning();

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateLastLogin(id: string) {
    await this.db.database
      .update(saasUsersTable)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(saasUsersTable.id, id));
  }

  async softDelete(id: string) {
    const user = await this.findById(id);

    const [deletedUser] = await this.db.database
      .update(saasUsersTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(saasUsersTable.id, id))
      .returning();

    const { passwordHash, ...userWithoutPassword } = deletedUser;
    return userWithoutPassword;
  }

  async getActiveUsersCount(): Promise<number> {
    const result = await this.db.database
      .select()
      .from(saasUsersTable)
      .where(
        and(
          isNull(saasUsersTable.deletedAt),
          eq(saasUsersTable.emailVerified, true)
        )
      );

    return result.length;
  }

  async getUsersBySubscriptionPlan(planId: string) {
    const users = await this.db.database
      .select({
        id: saasUsersTable.id,
        email: saasUsersTable.email,
        companyName: saasUsersTable.companyName,
        role: saasUsersTable.role,
        createdAt: saasUsersTable.createdAt,
      })
      .from(saasUsersTable)
      .where(
        and(
          eq(saasUsersTable.subscriptionPlanId, planId),
          isNull(saasUsersTable.deletedAt)
        )
      );

    return users;
  }

  async getUsersWithExpiringTrials(daysBeforeExpiry: number = 3) {
    // This would need to be implemented with trial account expiry dates
    // For now, returning empty array as a placeholder
    return [];
  }

  // Method for getting user profile
  async getUserProfile(userId: string) {
    const user = await this.findById(userId);
    return {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      companyPhone: user.companyPhone,
      companyAddress: user.companyAddress,
      companyWebsite: null, // Not in saas users table yet
      role: user.role,
      status: 'active', // Default status mapping
      emailVerified: user.emailVerified,
      timezone: null, // Not in saas users table yet
      language: null, // Not in saas users table yet
      stripeCustomerId: user.stripeCustomerId,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  // Method for updating profile
  async updateProfile(userId: string, updateDto: UpdateSaasUserDto) {
    const updatedUser = await this.updateUser(userId, updateDto);
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      companyName: updatedUser.companyName,
      companyPhone: updatedUser.companyPhone,
      companyAddress: updatedUser.companyAddress,
      companyWebsite: null, // Not in saas users table yet
      role: updatedUser.role,
      status: 'active', // Default status mapping
      emailVerified: updatedUser.emailVerified,
      timezone: null, // Not in saas users table yet
      language: null, // Not in saas users table yet
      stripeCustomerId: updatedUser.stripeCustomerId,
      lastLoginAt: updatedUser.lastLoginAt?.toISOString() || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }

  // Method for changing password
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Verify current password
    const user = await this.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update to new password
    return this.updatePassword(userId, newPassword);
  }

  // Method for getting account settings
  async getAccountSettings(userId: string) {
    const user = await this.findById(userId);
    // Return notification settings (placeholder values since they're not in the schema yet)
    return {
      emailNotifications: true,
      marketingEmails: false,
      securityNotifications: true,
      weeklyDigest: true,
    };
  }

  // Method for updating account settings
  async updateAccountSettings(userId: string, settingsDto: any) {
    const user = await this.findById(userId);
    // For now, just return the updated settings (placeholder implementation)
    return {
      emailNotifications: settingsDto.emailNotifications ?? true,
      marketingEmails: settingsDto.marketingEmails ?? false,
      securityNotifications: settingsDto.securityNotifications ?? true,
      weeklyDigest: settingsDto.weeklyDigest ?? true,
    };
  }

  // Method for getting subscription status
  async getSubscriptionStatus(userId: string) {
    const user = await this.findById(userId);
    return {
      subscriptionStatus: (user as any).subscriptionStatus || 'inactive',
      subscriptionPlanId: user.subscriptionPlanId,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: (user as any).stripeSubscriptionId || null,
      subscriptionStartDate: (user as any).subscriptionStartDate || null,
      subscriptionEndDate: (user as any).subscriptionEndDate || null,
      lastPaymentDate: (user as any).lastPaymentDate || null,
    };
  }

  // Method for getting billing history
  async getBillingHistory(userId: string, limit: number = 10) {
    // This would typically integrate with Stripe to get billing history
    // For now, returning placeholder data
    return {
      invoices: [],
      paymentMethods: [],
      upcomingInvoice: null,
    };
  }

  // Method for getting usage statistics
  async getUsageStatistics(userId: string) {
    // This would typically aggregate usage data
    // For now, returning placeholder data
    return {
      ordersCount: 0,
      customersCount: 0,
      inventoryItems: 0,
      storageUsed: 0,
      apiCallsThisMonth: 0,
    };
  }

  // Helper method to find user by ID with password (private method)
  private async findByIdWithPassword(id: string) {
    const [user] = await this.db.database
      .select()
      .from(saasUsersTable)
      .where(and(eq(saasUsersTable.id, id), isNull(saasUsersTable.deletedAt)))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Additional missing methods for controller compatibility
  async getAllUsers(options: any = {}) {
    return this.findAll(options.limit, options.offset);
  }

  async updateUserStatus(userId: string, status: string, reason?: string) {
    const updatedUser = await this.updateUser(userId, { role: status as any });
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      companyName: updatedUser.companyName,
      companyPhone: updatedUser.companyPhone,
      companyAddress: updatedUser.companyAddress,
      companyWebsite: null, // Not in saas users table yet
      role: updatedUser.role,
      status: 'active', // Default status mapping
      emailVerified: updatedUser.emailVerified,
      timezone: null, // Not in saas users table yet
      language: null, // Not in saas users table yet
      stripeCustomerId: updatedUser.stripeCustomerId,
      lastLoginAt: updatedUser.lastLoginAt?.toISOString() || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }
}
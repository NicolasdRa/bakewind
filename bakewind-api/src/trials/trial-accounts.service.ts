import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, isNull, lt, gte } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { trialAccountsTable } from '../database/schemas/trial-accounts.schema';
import { usersTable } from '../database/schemas/users.schema';

export interface UpdateOnboardingData {
  onboardingCompleted?: boolean;
  sampleDataRequested?: boolean;
}

export interface TrialConversionData {
  planId: string;
  stripeSubscriptionId?: string;
  paymentMethodId?: string;
}

@Injectable()
export class TrialAccountsService {
  private readonly logger = new Logger(TrialAccountsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get trial account by user ID
   */
  async getTrialAccountByUserId(userId: string) {
    try {
      const [trialAccount] = await this.databaseService.db
        .select()
        .from(trialAccountsTable)
        .where(eq(trialAccountsTable.userId, userId))
        .limit(1);

      if (!trialAccount) {
        throw new NotFoundException('Trial account not found');
      }

      return trialAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get trial account for user ${userId}:`, error);
      throw new BadRequestException('Failed to retrieve trial account');
    }
  }

  /**
   * Get trial account by ID
   */
  async getTrialAccountById(trialId: string) {
    try {
      const [trialAccount] = await this.databaseService.db
        .select()
        .from(trialAccountsTable)
        .where(eq(trialAccountsTable.id, trialId))
        .limit(1);

      if (!trialAccount) {
        throw new NotFoundException('Trial account not found');
      }

      return trialAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get trial account ${trialId}:`, error);
      throw new BadRequestException('Failed to retrieve trial account');
    }
  }

  /**
   * Update trial onboarding progress
   */
  async updateOnboarding(userId: string, trialId: string, updateData: UpdateOnboardingData) {
    try {
      // Verify the trial belongs to the user
      const trialAccount = await this.getTrialAccountById(trialId);

      if (trialAccount.userId !== userId) {
        throw new ForbiddenException('Not authorized to update this trial');
      }

      // If trial is already converted, don't allow updates
      if (trialAccount.convertedAt) {
        throw new BadRequestException('Cannot update onboarding for converted trial');
      }

      const updates: any = {
        updatedAt: new Date(),
      };

      if (updateData.onboardingCompleted !== undefined) {
        updates.onboardingCompleted = updateData.onboardingCompleted;
      }

      if (updateData.sampleDataRequested === true && !trialAccount.sampleDataLoaded) {
        updates.sampleDataLoaded = true;
        // Here you would trigger sample data loading
        await this.loadSampleData(userId);
      }

      const [updatedTrial] = await this.databaseService.db
        .update(trialAccountsTable)
        .set(updates)
        .where(eq(trialAccountsTable.id, trialId))
        .returning();

      this.logger.log(`Updated onboarding for trial ${trialId}, user ${userId}`);
      return updatedTrial;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update onboarding for trial ${trialId}:`, error);
      throw new BadRequestException('Failed to update onboarding');
    }
  }

  /**
   * Load sample data for a trial account
   */
  private async loadSampleData(userId: string) {
    try {
      // This would typically:
      // 1. Create sample products
      // 2. Create sample customers
      // 3. Create sample orders
      // 4. Create sample recipes
      // 5. Create sample inventory items

      this.logger.log(`Loading sample data for user ${userId}`);

      // Placeholder for actual sample data loading
      // This would integrate with other services to create demo data

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to load sample data for user ${userId}:`, error);
      // Don't throw - sample data is not critical
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToSubscription(userId: string, conversionData: TrialConversionData) {
    try {
      const trialAccount = await this.getTrialAccountByUserId(userId);

      if (trialAccount.convertedAt) {
        throw new BadRequestException('Trial already converted');
      }

      const [updatedTrial] = await this.databaseService.db
        .update(trialAccountsTable)
        .set({
          convertedAt: new Date(),
          convertedToPlanId: conversionData.planId,
          updatedAt: new Date(),
        })
        .where(eq(trialAccountsTable.userId, userId))
        .returning();

      this.logger.log(`Converted trial for user ${userId} to plan ${conversionData.planId}`);
      return updatedTrial;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to convert trial for user ${userId}:`, error);
      throw new BadRequestException('Failed to convert trial');
    }
  }

  /**
   * Track conversion reminder sent
   */
  async incrementConversionReminders(userId: string) {
    try {
      const trialAccount = await this.getTrialAccountByUserId(userId);

      const [updatedTrial] = await this.databaseService.db
        .update(trialAccountsTable)
        .set({
          conversionRemindersSent: trialAccount.conversionRemindersSent + 1,
          updatedAt: new Date(),
        })
        .where(eq(trialAccountsTable.userId, userId))
        .returning();

      this.logger.log(`Incremented conversion reminders for user ${userId} to ${updatedTrial.conversionRemindersSent}`);
      return updatedTrial;
    } catch (error) {
      this.logger.error(`Failed to increment reminders for user ${userId}:`, error);
      // Don't throw - reminder tracking is not critical
      return null;
    }
  }

  /**
   * Get trials expiring soon for reminder campaigns
   */
  async getExpiringTrials(daysUntilExpiration: number) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysUntilExpiration);

      const expiringTrials = await this.databaseService.db
        .select({
          trialAccount: trialAccountsTable,
          user: usersTable,
        })
        .from(trialAccountsTable)
        .innerJoin(usersTable, eq(usersTable.id, trialAccountsTable.userId))
        .where(and(
          isNull(trialAccountsTable.convertedAt), // Not yet converted
          eq(usersTable.role, 'trial_user'),
          gte(usersTable.trialEndsAt, new Date()), // Not yet expired
          lt(usersTable.trialEndsAt, cutoffDate), // Expires within cutoff
        ));

      return expiringTrials;
    } catch (error) {
      this.logger.error(`Failed to get expiring trials:`, error);
      return [];
    }
  }

  /**
   * Get trial accounts that need reminder emails
   */
  async getTrialsNeedingReminders() {
    try {
      const now = new Date();
      const reminderSchedule = [
        { daysBeforeExpiry: 4, reminderNumber: 1 },
        { daysBeforeExpiry: 1, reminderNumber: 2 },
        { daysBeforeExpiry: 0, reminderNumber: 3 }, // Day of expiration
      ];

      const trialsNeedingReminders = [];

      for (const schedule of reminderSchedule) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + schedule.daysBeforeExpiry);
        targetDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const trials = await this.databaseService.db
          .select({
            trialAccount: trialAccountsTable,
            user: usersTable,
          })
          .from(trialAccountsTable)
          .innerJoin(usersTable, eq(usersTable.id, trialAccountsTable.userId))
          .where(and(
            isNull(trialAccountsTable.convertedAt),
            eq(usersTable.role, 'trial_user'),
            gte(usersTable.trialEndsAt, targetDate),
            lt(usersTable.trialEndsAt, endOfDay),
            lt(trialAccountsTable.conversionRemindersSent, schedule.reminderNumber),
          ));

        trialsNeedingReminders.push(...trials.map(t => ({
          ...t,
          reminderNumber: schedule.reminderNumber,
          daysUntilExpiry: schedule.daysBeforeExpiry,
        })));
      }

      return trialsNeedingReminders;
    } catch (error) {
      this.logger.error('Failed to get trials needing reminders:', error);
      return [];
    }
  }

  /**
   * Update cancellation reason for unconverted trial
   */
  async setCancellationReason(userId: string, reason: string) {
    try {
      const [updatedTrial] = await this.databaseService.db
        .update(trialAccountsTable)
        .set({
          cancellationReason: reason,
          updatedAt: new Date(),
        })
        .where(and(
          eq(trialAccountsTable.userId, userId),
          isNull(trialAccountsTable.convertedAt),
        ))
        .returning();

      if (!updatedTrial) {
        throw new NotFoundException('Trial account not found or already converted');
      }

      this.logger.log(`Set cancellation reason for user ${userId}: ${reason}`);
      return updatedTrial;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to set cancellation reason for user ${userId}:`, error);
      throw new BadRequestException('Failed to set cancellation reason');
    }
  }

  /**
   * Get trial conversion statistics
   */
  async getConversionStatistics(startDate?: Date, endDate?: Date) {
    try {
      let query = this.databaseService.db
        .select({
          totalTrials: trialAccountsTable.id,
          converted: trialAccountsTable.convertedAt,
          convertedToPlanId: trialAccountsTable.convertedToPlanId,
          businessSize: trialAccountsTable.businessSize,
          signupSource: trialAccountsTable.signupSource,
          onboardingCompleted: trialAccountsTable.onboardingCompleted,
          sampleDataLoaded: trialAccountsTable.sampleDataLoaded,
        })
        .from(trialAccountsTable);

      // Add date filters if provided
      if (startDate) {
        query = query.where(gte(trialAccountsTable.createdAt, startDate));
      }
      if (endDate) {
        query = query.where(lt(trialAccountsTable.createdAt, endDate));
      }

      const trials = await query;

      // Calculate statistics
      const stats = {
        total: trials.length,
        converted: trials.filter(t => t.converted !== null).length,
        conversionRate: 0,
        byBusinessSize: {} as Record<string, { total: number; converted: number; rate: number }>,
        bySignupSource: {} as Record<string, { total: number; converted: number; rate: number }>,
        byPlan: {} as Record<string, number>,
        onboardingCompleted: trials.filter(t => t.onboardingCompleted).length,
        sampleDataLoaded: trials.filter(t => t.sampleDataLoaded).length,
      };

      // Calculate conversion rate
      if (stats.total > 0) {
        stats.conversionRate = (stats.converted / stats.total) * 100;
      }

      // Group by business size
      trials.forEach(trial => {
        if (!stats.byBusinessSize[trial.businessSize]) {
          stats.byBusinessSize[trial.businessSize] = { total: 0, converted: 0, rate: 0 };
        }
        stats.byBusinessSize[trial.businessSize].total++;
        if (trial.converted) {
          stats.byBusinessSize[trial.businessSize].converted++;
        }
      });

      // Calculate rates for business sizes
      Object.keys(stats.byBusinessSize).forEach(size => {
        const sizeStats = stats.byBusinessSize[size];
        if (sizeStats.total > 0) {
          sizeStats.rate = (sizeStats.converted / sizeStats.total) * 100;
        }
      });

      // Group by signup source
      trials.forEach(trial => {
        if (!stats.bySignupSource[trial.signupSource]) {
          stats.bySignupSource[trial.signupSource] = { total: 0, converted: 0, rate: 0 };
        }
        stats.bySignupSource[trial.signupSource].total++;
        if (trial.converted) {
          stats.bySignupSource[trial.signupSource].converted++;
        }
      });

      // Calculate rates for signup sources
      Object.keys(stats.bySignupSource).forEach(source => {
        const sourceStats = stats.bySignupSource[source];
        if (sourceStats.total > 0) {
          sourceStats.rate = (sourceStats.converted / sourceStats.total) * 100;
        }
      });

      // Group conversions by plan
      trials
        .filter(t => t.convertedToPlanId)
        .forEach(trial => {
          stats.byPlan[trial.convertedToPlanId!] = (stats.byPlan[trial.convertedToPlanId!] || 0) + 1;
        });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get conversion statistics:', error);
      throw new BadRequestException('Failed to get conversion statistics');
    }
  }

  /**
   * Get active trials count
   */
  async getActiveTrialsCount() {
    try {
      const now = new Date();

      const activeTrials = await this.databaseService.db
        .select({ count: trialAccountsTable.id })
        .from(trialAccountsTable)
        .innerJoin(usersTable, eq(usersTable.id, trialAccountsTable.userId))
        .where(and(
          isNull(trialAccountsTable.convertedAt),
          eq(usersTable.role, 'trial_user'),
          gte(usersTable.trialEndsAt, now),
        ));

      return activeTrials.length;
    } catch (error) {
      this.logger.error('Failed to get active trials count:', error);
      return 0;
    }
  }

  /**
   * Extend trial period (admin function)
   */
  async extendTrial(userId: string, additionalDays: number) {
    try {
      // Get current trial end date
      const [user] = await this.databaseService.db
        .select({ trialEndsAt: usersTable.trialEndsAt })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user || !user.trialEndsAt) {
        throw new NotFoundException('User or trial end date not found');
      }

      // Calculate new end date
      const newTrialEndsAt = new Date(user.trialEndsAt);
      newTrialEndsAt.setDate(newTrialEndsAt.getDate() + additionalDays);

      // Update user's trial end date
      await this.databaseService.db
        .update(usersTable)
        .set({
          trialEndsAt: newTrialEndsAt,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));

      this.logger.log(`Extended trial for user ${userId} by ${additionalDays} days`);
      return { newTrialEndsAt };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to extend trial for user ${userId}:`, error);
      throw new BadRequestException('Failed to extend trial');
    }
  }
}
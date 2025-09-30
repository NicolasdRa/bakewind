import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, lte, gte } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { trialAccountsTable } from '../database/schemas/trial-accounts.schema';
import { ConfigService } from '@nestjs/config';

export interface CreateTrialAccountDto {
  userId: string;
  signupSource: string;
  businessSize: '1' | '2-3' | '4-10' | '10+';
  trialLengthDays?: number;
}

export interface UpdateTrialAccountDto {
  onboardingCompleted?: boolean;
  sampleDataLoaded?: boolean;
  conversionRemindersSent?: number;
  cancellationReason?: string;
}

export interface ConvertTrialDto {
  convertedToPlanId: string;
}

@Injectable()
export class TrialAccountsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async create(createDto: CreateTrialAccountDto) {
    const trialLengthDays = createDto.trialLengthDays ||
      this.configService.get<number>('TRIAL_LENGTH_DAYS', 14);

    const [newTrial] = await this.db.database
      .insert(trialAccountsTable)
      .values({
        userId: createDto.userId,
        signupSource: createDto.signupSource,
        businessSize: createDto.businessSize,
        trialLengthDays,
        onboardingCompleted: false,
        sampleDataLoaded: false,
        conversionRemindersSent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newTrial;
  }

  async findAll(limit = 20, offset = 0) {
    const trials = await this.db.database
      .select()
      .from(trialAccountsTable)
      .limit(limit)
      .offset(offset);

    return trials;
  }

  async findById(id: string) {
    const [trial] = await this.db.database
      .select()
      .from(trialAccountsTable)
      .where(eq(trialAccountsTable.id, id));

    if (!trial) {
      throw new NotFoundException(`Trial account with ID ${id} not found`);
    }

    return trial;
  }

  async getTrialByUserId(userId: string) {
    const [trial] = await this.db.database
      .select()
      .from(trialAccountsTable)
      .where(eq(trialAccountsTable.userId, userId));

    return trial || null;
  }

  // Alias for controller compatibility
  async getTrialById(id: string) {
    return this.findById(id);
  }

  // Alias for controller compatibility
  async updateOnboardingProgress(id: string, updateData: any) {
    return this.updateOnboarding(id, updateData);
  }

  async update(id: string, updateDto: UpdateTrialAccountDto) {
    const existingTrial = await this.findById(id);

    const [updatedTrial] = await this.db.database
      .update(trialAccountsTable)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      })
      .where(eq(trialAccountsTable.id, id))
      .returning();

    return updatedTrial;
  }

  async updateOnboarding(id: string, onboardingData: {
    onboardingCompleted?: boolean;
    sampleDataLoaded?: boolean;
  }) {
    const existingTrial = await this.findById(id);

    const [updatedTrial] = await this.db.database
      .update(trialAccountsTable)
      .set({
        ...onboardingData,
        updatedAt: new Date(),
      })
      .where(eq(trialAccountsTable.id, id))
      .returning();

    return updatedTrial;
  }

  async loadSampleData(id: string) {
    const existingTrial = await this.findById(id);

    if (existingTrial.sampleDataLoaded) {
      throw new BadRequestException('Sample data has already been loaded');
    }

    const [updatedTrial] = await this.db.database
      .update(trialAccountsTable)
      .set({
        sampleDataLoaded: true,
        updatedAt: new Date(),
      })
      .where(eq(trialAccountsTable.id, id))
      .returning();

    // TODO: Trigger actual sample data loading process

    return updatedTrial;
  }

  async convertToPaid(id: string, planId: string) {
    const existingTrial = await this.findById(id);

    if (existingTrial.convertedAt) {
      throw new BadRequestException('Trial has already been converted');
    }

    const [convertedTrial] = await this.db.database
      .update(trialAccountsTable)
      .set({
        convertedAt: new Date(),
        convertedToPlanId: planId,
        updatedAt: new Date(),
      })
      .where(eq(trialAccountsTable.id, id))
      .returning();

    return convertedTrial;
  }

  async cancelTrial(id: string, reason?: string) {
    const existingTrial = await this.findById(id);

    if (existingTrial.convertedAt) {
      throw new BadRequestException('Cannot cancel a converted trial');
    }

    const [canceledTrial] = await this.db.database
      .update(trialAccountsTable)
      .set({
        cancellationReason: reason || 'User canceled',
        updatedAt: new Date(),
      })
      .where(eq(trialAccountsTable.id, id))
      .returning();

    return canceledTrial;
  }

  async incrementRemindersSent(id: string) {
    const existingTrial = await this.findById(id);

    const [updatedTrial] = await this.db.database
      .update(trialAccountsTable)
      .set({
        conversionRemindersSent: existingTrial.conversionRemindersSent + 1,
        updatedAt: new Date(),
      })
      .where(eq(trialAccountsTable.id, id))
      .returning();

    return updatedTrial;
  }

  async getExpiringTrials(daysBeforeExpiry: number = 3) {
    const now = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(now.getDate() + daysBeforeExpiry);

    // Get trials that are:
    // 1. Not converted
    // 2. Will expire within the specified days
    // 3. Haven't been canceled
    const trials = await this.db.database
      .select()
      .from(trialAccountsTable)
      .where(
        and(
          isNull(trialAccountsTable.convertedAt),
          isNull(trialAccountsTable.cancellationReason),
          // This would need a calculated expiry date field
          // For now, we'll return all unconverted trials
        )
      );

    // Filter by calculated expiry date
    return trials.filter(trial => {
      const trialEndDate = new Date(trial.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + trial.trialLengthDays);
      return trialEndDate <= expiryThreshold && trialEndDate >= now;
    });
  }

  async getActiveTrials() {
    const now = new Date();

    const trials = await this.db.database
      .select()
      .from(trialAccountsTable)
      .where(
        and(
          isNull(trialAccountsTable.convertedAt),
          isNull(trialAccountsTable.cancellationReason)
        )
      );

    // Filter by calculated expiry date
    return trials.filter(trial => {
      const trialEndDate = new Date(trial.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + trial.trialLengthDays);
      return trialEndDate >= now;
    });
  }

  async getExpiredTrials() {
    const now = new Date();

    const trials = await this.db.database
      .select()
      .from(trialAccountsTable)
      .where(
        and(
          isNull(trialAccountsTable.convertedAt),
          isNull(trialAccountsTable.cancellationReason)
        )
      );

    // Filter by calculated expiry date
    return trials.filter(trial => {
      const trialEndDate = new Date(trial.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + trial.trialLengthDays);
      return trialEndDate < now;
    });
  }

  async getConversionRate(startDate?: Date, endDate?: Date) {
    let allTrials = await this.db.database
      .select()
      .from(trialAccountsTable);

    // Filter by date range if provided
    if (startDate || endDate) {
      allTrials = allTrials.filter(trial => {
        const trialDate = new Date(trial.createdAt);
        if (startDate && trialDate < startDate) return false;
        if (endDate && trialDate > endDate) return false;
        return true;
      });
    }

    const totalTrials = allTrials.length;
    const convertedTrials = allTrials.filter(trial => trial.convertedAt !== null).length;

    return {
      totalTrials,
      convertedTrials,
      conversionRate: totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0,
    };
  }

  async getTrialsByBusinessSize() {
    const trials = await this.db.database
      .select()
      .from(trialAccountsTable);

    const bySize: Record<string, number> = {};

    trials.forEach(trial => {
      bySize[trial.businessSize] = (bySize[trial.businessSize] || 0) + 1;
    });

    return bySize;
  }

  async getTrialsBySignupSource() {
    const trials = await this.db.database
      .select()
      .from(trialAccountsTable);

    const bySource: Record<string, number> = {};

    trials.forEach(trial => {
      bySource[trial.signupSource] = (bySource[trial.signupSource] || 0) + 1;
    });

    return bySource;
  }

  async getTrialMetrics() {
    const activeTrials = await this.getActiveTrials();
    const expiredTrials = await this.getExpiredTrials();
    const conversionRate = await this.getConversionRate();
    const byBusinessSize = await this.getTrialsByBusinessSize();
    const bySignupSource = await this.getTrialsBySignupSource();

    return {
      activeTrials: activeTrials.length,
      expiredTrials: expiredTrials.length,
      ...conversionRate,
      byBusinessSize,
      bySignupSource,
    };
  }

  async hasConvertedToPaid(trialId: string): Promise<boolean> {
    const trial = await this.findById(trialId);
    return trial.convertedAt !== null;
  }

  calculateTrialEndDate(trial: any): Date {
    const endDate = new Date(trial.createdAt);
    endDate.setDate(endDate.getDate() + trial.trialLengthDays);
    return endDate;
  }

  isTrialExpired(trial: any): boolean {
    const endDate = this.calculateTrialEndDate(trial);
    return endDate < new Date();
  }

  getDaysRemaining(trial: any): number {
    const endDate = this.calculateTrialEndDate(trial);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Additional missing methods for controller compatibility
  async getAllTrials(options: any = {}) {
    const trials = await this.db.database
      .select()
      .from(trialAccountsTable)
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    return trials;
  }

  async getTrialAnalytics(period: string = '30d') {
    return this.getTrialMetrics();
  }

  async getOnboardingProgressStats() {
    const trials = await this.db.database
      .select()
      .from(trialAccountsTable);

    const completed = trials.filter(t => t.onboardingCompleted).length;

    return {
      totalTrials: trials.length,
      completedOnboarding: completed,
      averageStepsCompleted: trials.length > 0 ? (completed / trials.length) * 100 : 0
    };
  }

  async bulkUpdateTrials(trialIds: string[], updateData: any) {
    const updates = await Promise.all(
      trialIds.map(id => this.update(id, updateData))
    );
    return { updated: updates.length };
  }
}
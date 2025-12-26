import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schemas';
import { tenantsTable } from '../database/schemas/tenants.schema';
import type {
  CreateTenantDto,
  UpdateTenantDto,
  BusinessSize,
} from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Create a new tenant (bakery business)
   * Called during OWNER registration
   */
  async create(dto: CreateTenantDto) {
    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const [tenant] = await this.db
      .insert(tenantsTable)
      .values({
        ownerUserId: dto.ownerUserId,
        businessName: dto.businessName,
        businessPhone: dto.businessPhone,
        businessAddress: dto.businessAddress,
        signupSource: dto.signupSource,
        businessSize: dto.businessSize as BusinessSize | undefined,
        subscriptionStatus: 'trial',
        trialEndsAt,
        trialLengthDays: 14,
        onboardingCompleted: false,
        sampleDataLoaded: false,
      })
      .returning();

    if (tenant) {
      this.logger.log(`Created tenant ${tenant.id} for owner ${dto.ownerUserId}`);
    }
    return tenant;
  }

  /**
   * Find tenant by ID
   */
  async findById(id: string) {
    const [tenant] = await this.db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, id))
      .limit(1);

    return tenant || null;
  }

  /**
   * Find tenant by owner user ID
   * Used to get tenant context for OWNER users
   */
  async findByOwnerUserId(ownerUserId: string) {
    const [tenant] = await this.db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.ownerUserId, ownerUserId))
      .limit(1);

    return tenant || null;
  }

  /**
   * Update tenant details
   */
  async update(id: string, dto: UpdateTenantDto) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.businessName !== undefined) updateData.businessName = dto.businessName;
    if (dto.businessPhone !== undefined) updateData.businessPhone = dto.businessPhone;
    if (dto.businessAddress !== undefined) updateData.businessAddress = dto.businessAddress;
    if (dto.stripeAccountId !== undefined) updateData.stripeAccountId = dto.stripeAccountId;
    if (dto.subscriptionPlanId !== undefined) updateData.subscriptionPlanId = dto.subscriptionPlanId;
    if (dto.subscriptionStatus !== undefined) updateData.subscriptionStatus = dto.subscriptionStatus;
    if (dto.onboardingCompleted !== undefined) updateData.onboardingCompleted = dto.onboardingCompleted;
    if (dto.sampleDataLoaded !== undefined) updateData.sampleDataLoaded = dto.sampleDataLoaded;

    const [updated] = await this.db
      .update(tenantsTable)
      .set(updateData)
      .where(eq(tenantsTable.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(id: string) {
    return this.update(id, { onboardingCompleted: true });
  }

  /**
   * Mark sample data as loaded
   */
  async markSampleDataLoaded(id: string) {
    return this.update(id, { sampleDataLoaded: true });
  }

  /**
   * Update subscription status (called by Stripe webhooks)
   */
  async updateSubscriptionStatus(
    id: string,
    status: 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete',
    planId?: string,
  ) {
    const updateData: UpdateTenantDto = { subscriptionStatus: status };
    if (planId) {
      updateData.subscriptionPlanId = planId;
    }
    return this.update(id, updateData);
  }

  /**
   * Check if trial has expired
   */
  async isTrialExpired(id: string): Promise<boolean> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (tenant.subscriptionStatus !== 'trial') {
      return false;
    }

    if (!tenant.trialEndsAt) {
      return false;
    }

    return new Date() > tenant.trialEndsAt;
  }

  /**
   * Convert trial to paid subscription
   */
  async convertFromTrial(id: string, planId: string, stripeAccountId: string) {
    const [updated] = await this.db
      .update(tenantsTable)
      .set({
        subscriptionStatus: 'active',
        subscriptionPlanId: planId,
        stripeAccountId,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tenantsTable.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    this.logger.log(`Tenant ${id} converted from trial to paid subscription`);
    return updated;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(id: string, reason?: string) {
    const updateData: Record<string, unknown> = {
      subscriptionStatus: 'canceled',
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.cancellationReason = reason;
    }

    const [updated] = await this.db
      .update(tenantsTable)
      .set(updateData)
      .where(eq(tenantsTable.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    this.logger.log(`Tenant ${id} subscription canceled`);
    return updated;
  }

  /**
   * Soft delete tenant
   */
  async softDelete(id: string) {
    const [deleted] = await this.db
      .update(tenantsTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tenantsTable.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return deleted;
  }
}

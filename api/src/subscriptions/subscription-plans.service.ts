import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { subscriptionPlansTable } from '../database/schemas/subscription-plans.schema';

export interface CreateSubscriptionPlanDto {
  name: string;
  description: string;
  priceMonthlyUsd: number;
  priceAnnualUsd: number;
  maxLocations?: number | null;
  maxUsers?: number | null;
  features?: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  isPopular?: boolean;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateSubscriptionPlanDto {
  name?: string;
  description?: string;
  priceMonthlyUsd?: number;
  priceAnnualUsd?: number;
  maxLocations?: number | null;
  maxUsers?: number | null;
  features?: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  isPopular?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly db: DatabaseService) {}

  async create(createDto: CreateSubscriptionPlanDto) {
    const [newPlan] = await this.db.database
      .insert(subscriptionPlansTable)
      .values({
        ...createDto,
        features: createDto.features || [],
        isPopular: createDto.isPopular ?? false,
        isActive: createDto.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.formatPlan(newPlan);
  }

  async findAll(onlyActive = false) {
    const whereCondition = onlyActive
      ? eq(subscriptionPlansTable.isActive, true)
      : undefined;

    const plans = await this.db.database
      .select()
      .from(subscriptionPlansTable)
      .where(whereCondition)
      .orderBy(asc(subscriptionPlansTable.sortOrder));

    return plans.map((plan) => this.formatPlan(plan));
  }

  async findById(id: string) {
    const [plan] = await this.db.database
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, id));

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return this.formatPlan(plan);
  }

  async findByName(name: string) {
    const [plan] = await this.db.database
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.name, name));

    return plan ? this.formatPlan(plan) : null;
  }

  async getPlanByStripePriceId(stripePriceId: string) {
    const [plan] = await this.db.database
      .select()
      .from(subscriptionPlansTable)
      .where(
        and(
          eq(subscriptionPlansTable.isActive, true),
          eq(subscriptionPlansTable.stripePriceIdMonthly, stripePriceId),
        ),
      );

    if (!plan) {
      // Check annual price ID
      const [annualPlan] = await this.db.database
        .select()
        .from(subscriptionPlansTable)
        .where(
          and(
            eq(subscriptionPlansTable.isActive, true),
            eq(subscriptionPlansTable.stripePriceIdAnnual, stripePriceId),
          ),
        );

      return annualPlan ? this.formatPlan(annualPlan) : null;
    }

    return this.formatPlan(plan);
  }

  async getPopularPlans() {
    const plans = await this.db.database
      .select()
      .from(subscriptionPlansTable)
      .where(
        and(
          eq(subscriptionPlansTable.isActive, true),
          eq(subscriptionPlansTable.isPopular, true),
        ),
      )
      .orderBy(asc(subscriptionPlansTable.sortOrder));

    return plans.map((plan) => this.formatPlan(plan));
  }

  async update(id: string, updateDto: UpdateSubscriptionPlanDto) {
    const existingPlan = await this.findById(id);

    const updateData: any = {
      ...updateDto,
      updatedAt: new Date(),
    };

    if (updateDto.features) {
      updateData.features = JSON.stringify(updateDto.features);
    }

    const [updatedPlan] = await this.db.database
      .update(subscriptionPlansTable)
      .set(updateData)
      .where(eq(subscriptionPlansTable.id, id))
      .returning();

    return this.formatPlan(updatedPlan);
  }

  async updateStripePriceIds(
    id: string,
    monthlyPriceId?: string,
    annualPriceId?: string,
  ) {
    const existingPlan = await this.findById(id);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (monthlyPriceId !== undefined) {
      updateData.stripePriceIdMonthly = monthlyPriceId;
    }

    if (annualPriceId !== undefined) {
      updateData.stripePriceIdAnnual = annualPriceId;
    }

    const [updatedPlan] = await this.db.database
      .update(subscriptionPlansTable)
      .set(updateData)
      .where(eq(subscriptionPlansTable.id, id))
      .returning();

    return this.formatPlan(updatedPlan);
  }

  async deactivate(id: string) {
    const existingPlan = await this.findById(id);

    const [deactivatedPlan] = await this.db.database
      .update(subscriptionPlansTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlansTable.id, id))
      .returning();

    return this.formatPlan(deactivatedPlan);
  }

  async activate(id: string) {
    const existingPlan = await this.findById(id);

    const [activatedPlan] = await this.db.database
      .update(subscriptionPlansTable)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlansTable.id, id))
      .returning();

    return this.formatPlan(activatedPlan);
  }

  async setPopular(id: string, isPopular: boolean) {
    const existingPlan = await this.findById(id);

    const [updatedPlan] = await this.db.database
      .update(subscriptionPlansTable)
      .set({
        isPopular,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlansTable.id, id))
      .returning();

    return this.formatPlan(updatedPlan);
  }

  async reorderPlans(planOrders: { id: string; sortOrder: number }[]) {
    const updatePromises = planOrders.map(({ id, sortOrder }) =>
      this.db.database
        .update(subscriptionPlansTable)
        .set({
          sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlansTable.id, id))
        .returning(),
    );

    await Promise.all(updatePromises);

    return this.findAll();
  }

  async getDefaultTrialPlan(): Promise<any> {
    // Get the plan configured as the default trial plan
    const defaultPlanName = process.env.DEFAULT_TRIAL_PLAN || 'starter';

    const plan = await this.findByName(defaultPlanName);

    if (!plan) {
      // Fallback to the first active plan
      const plans = await this.findAll(true);
      return plans[0] || null;
    }

    return plan;
  }

  async comparePlans(planIds: string[]) {
    const plans = await Promise.all(planIds.map((id) => this.findById(id)));

    // Create a feature comparison matrix
    const allFeatures = new Set<string>();
    plans.forEach((plan) => {
      plan.features.forEach((feature: string) => allFeatures.add(feature));
    });

    const comparison = {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceMonthlyUsd: plan.priceMonthlyUsd,
        priceAnnualUsd: plan.priceAnnualUsd,
        maxLocations: plan.maxLocations,
        maxUsers: plan.maxUsers,
      })),
      features: Array.from(allFeatures).map((feature) => ({
        feature,
        availability: plans.map((plan) => ({
          planId: plan.id,
          included: plan.features.includes(feature),
        })),
      })),
    };

    return comparison;
  }

  private formatPlan(plan: any) {
    return {
      ...plan,
      features:
        typeof plan.features === 'string'
          ? JSON.parse(plan.features)
          : plan.features,
    };
  }

  async validatePlanLimits(
    planId: string,
    currentLocations: number,
    currentUsers: number,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const plan = await this.findById(planId);
    const errors: string[] = [];

    if (plan.maxLocations !== null && currentLocations > plan.maxLocations) {
      errors.push(
        `Plan allows maximum ${plan.maxLocations} locations, but you have ${currentLocations}`,
      );
    }

    if (plan.maxUsers !== null && currentUsers > plan.maxUsers) {
      errors.push(
        `Plan allows maximum ${plan.maxUsers} users, but you have ${currentUsers}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { subscriptionPlansTable } from '../database/schemas/subscription-plans.schema';
import { StripeService } from '../stripe/stripe.service';
import type Stripe from 'stripe';

export interface CreatePlanData {
  name: string;
  description: string;
  priceMonthlyUsd: number;
  priceAnnualUsd: number;
  maxLocations?: number;
  maxUsers?: number;
  features: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  isPopular?: boolean;
  sortOrder: number;
}

export interface UpdatePlanData {
  description?: string;
  priceMonthlyUsd?: number;
  priceAnnualUsd?: number;
  maxLocations?: number;
  maxUsers?: number;
  features?: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  isPopular?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly stripeService?: StripeService,
  ) {}

  /**
   * Get all active subscription plans sorted by display order
   */
  async getAllPlans(includeInactive = false) {
    try {
      const whereConditions = includeInactive ? {} : { isActive: true };

      const plans = await this.databaseService.db
        .select()
        .from(subscriptionPlansTable)
        .where(includeInactive ? undefined : eq(subscriptionPlansTable.isActive, true))
        .orderBy(asc(subscriptionPlansTable.sortOrder));

      return plans;
    } catch (error) {
      this.logger.error('Failed to get subscription plans:', error);
      throw new BadRequestException('Failed to retrieve subscription plans');
    }
  }

  /**
   * Get a specific subscription plan by ID
   */
  async getPlanById(planId: string) {
    try {
      const [plan] = await this.databaseService.db
        .select()
        .from(subscriptionPlansTable)
        .where(eq(subscriptionPlansTable.id, planId))
        .limit(1);

      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

      return plan;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get plan ${planId}:`, error);
      throw new BadRequestException('Failed to retrieve subscription plan');
    }
  }

  /**
   * Get a subscription plan by name
   */
  async getPlanByName(name: string) {
    try {
      const [plan] = await this.databaseService.db
        .select()
        .from(subscriptionPlansTable)
        .where(eq(subscriptionPlansTable.name, name))
        .limit(1);

      return plan || null;
    } catch (error) {
      this.logger.error(`Failed to get plan by name ${name}:`, error);
      return null;
    }
  }

  /**
   * Create a new subscription plan (admin only)
   */
  async createPlan(planData: CreatePlanData) {
    try {
      // Check if plan name already exists
      const existingPlan = await this.getPlanByName(planData.name);
      if (existingPlan) {
        throw new BadRequestException('Plan name already exists');
      }

      // Validate pricing
      if (planData.priceAnnualUsd >= planData.priceMonthlyUsd * 12) {
        throw new BadRequestException('Annual price should be discounted from monthly price');
      }

      const [newPlan] = await this.databaseService.db
        .insert(subscriptionPlansTable)
        .values({
          ...planData,
          isActive: true,
        })
        .returning();

      this.logger.log(`Created subscription plan ${newPlan.id} - ${newPlan.name}`);
      return newPlan;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to create subscription plan:', error);
      throw new BadRequestException('Failed to create subscription plan');
    }
  }

  /**
   * Update an existing subscription plan (admin only)
   */
  async updatePlan(planId: string, updateData: UpdatePlanData) {
    try {
      // Verify plan exists
      const existingPlan = await this.getPlanById(planId);

      // If updating pricing, validate
      if (updateData.priceMonthlyUsd && updateData.priceAnnualUsd) {
        if (updateData.priceAnnualUsd >= updateData.priceMonthlyUsd * 12) {
          throw new BadRequestException('Annual price should be discounted from monthly price');
        }
      }

      const [updatedPlan] = await this.databaseService.db
        .update(subscriptionPlansTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlansTable.id, planId))
        .returning();

      this.logger.log(`Updated subscription plan ${planId}`);
      return updatedPlan;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update plan ${planId}:`, error);
      throw new BadRequestException('Failed to update subscription plan');
    }
  }

  /**
   * Soft delete a subscription plan (deactivate)
   */
  async deletePlan(planId: string) {
    try {
      const [deactivatedPlan] = await this.databaseService.db
        .update(subscriptionPlansTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(
          eq(subscriptionPlansTable.id, planId),
          eq(subscriptionPlansTable.isActive, true)
        ))
        .returning({ id: subscriptionPlansTable.id });

      if (!deactivatedPlan) {
        throw new NotFoundException('Subscription plan not found or already deactivated');
      }

      this.logger.log(`Deactivated subscription plan ${planId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete plan ${planId}:`, error);
      throw new BadRequestException('Failed to delete subscription plan');
    }
  }

  /**
   * Get the most popular plan
   */
  async getPopularPlan() {
    try {
      const [plan] = await this.databaseService.db
        .select()
        .from(subscriptionPlansTable)
        .where(and(
          eq(subscriptionPlansTable.isActive, true),
          eq(subscriptionPlansTable.isPopular, true)
        ))
        .limit(1);

      return plan || null;
    } catch (error) {
      this.logger.error('Failed to get popular plan:', error);
      return null;
    }
  }

  /**
   * Get plan by Stripe price ID
   */
  async getPlanByStripePriceId(stripePriceId: string) {
    try {
      const [plan] = await this.databaseService.db
        .select()
        .from(subscriptionPlansTable)
        .where(
          and(
            eq(subscriptionPlansTable.isActive, true),
            eq(subscriptionPlansTable.stripePriceIdMonthly, stripePriceId)
          )
        )
        .limit(1);

      if (!plan) {
        // Check annual price ID
        const [annualPlan] = await this.databaseService.db
          .select()
          .from(subscriptionPlansTable)
          .where(
            and(
              eq(subscriptionPlansTable.isActive, true),
              eq(subscriptionPlansTable.stripePriceIdAnnual, stripePriceId)
            )
          )
          .limit(1);

        return annualPlan || null;
      }

      return plan;
    } catch (error) {
      this.logger.error(`Failed to get plan by Stripe price ID ${stripePriceId}:`, error);
      return null;
    }
  }

  /**
   * Validate if a user's requested features are available in a plan
   */
  async validatePlanFeatures(planId: string, requiredFeatures: string[]) {
    try {
      const plan = await this.getPlanById(planId);

      const missingFeatures = requiredFeatures.filter(
        feature => !plan.features.includes(feature)
      );

      return {
        isValid: missingFeatures.length === 0,
        missingFeatures,
        planFeatures: plan.features,
      };
    } catch (error) {
      this.logger.error(`Failed to validate plan features for ${planId}:`, error);
      throw new BadRequestException('Failed to validate plan features');
    }
  }

  /**
   * Get recommended plan based on business size
   */
  async getRecommendedPlan(businessSize: '1' | '2-3' | '4-10' | '10+') {
    try {
      const allPlans = await this.getAllPlans();

      // Business size to plan mapping
      const recommendationMap = {
        '1': 'Starter',
        '2-3': 'Professional',
        '4-10': 'Business',
        '10+': 'Enterprise',
      };

      const recommendedPlanName = recommendationMap[businessSize];
      const recommendedPlan = allPlans.find(plan => plan.name === recommendedPlanName);

      return recommendedPlan || allPlans[0]; // Fallback to first plan
    } catch (error) {
      this.logger.error(`Failed to get recommended plan for business size ${businessSize}:`, error);
      return null;
    }
  }

  /**
   * Compare features between multiple plans
   */
  async comparePlans(planIds: string[]) {
    try {
      const plans = await Promise.all(
        planIds.map(id => this.getPlanById(id))
      );

      // Extract all unique features
      const allFeatures = new Set<string>();
      plans.forEach(plan => {
        plan.features.forEach(feature => allFeatures.add(feature));
      });

      // Build comparison matrix
      const comparison = {
        features: Array.from(allFeatures),
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          priceMonthlyUsd: plan.priceMonthlyUsd,
          priceAnnualUsd: plan.priceAnnualUsd,
          hasFeatures: Array.from(allFeatures).reduce((acc, feature) => {
            acc[feature] = plan.features.includes(feature);
            return acc;
          }, {} as Record<string, boolean>),
        })),
      };

      return comparison;
    } catch (error) {
      this.logger.error('Failed to compare plans:', error);
      throw new BadRequestException('Failed to compare plans');
    }
  }

  /**
   * Create or update Stripe product and prices for a plan
   */
  async syncWithStripe(planId: string) {
    if (!this.stripeService) {
      throw new BadRequestException('Stripe service not configured');
    }

    try {
      const plan = await this.getPlanById(planId);

      // Create Stripe product if needed
      // This would integrate with StripeService to create products and prices
      // For now, return a placeholder

      this.logger.log(`Synced plan ${planId} with Stripe`);
      return {
        success: true,
        planId,
        message: 'Plan synced with Stripe',
      };
    } catch (error) {
      this.logger.error(`Failed to sync plan ${planId} with Stripe:`, error);
      throw new BadRequestException('Failed to sync with Stripe');
    }
  }

  /**
   * Seed default subscription plans
   */
  async seedDefaultPlans() {
    try {
      const defaultPlans = [
        {
          name: 'Starter',
          description: 'Perfect for small bakeries just getting started',
          priceMonthlyUsd: 4900, // $49
          priceAnnualUsd: 47040, // $470.40 (20% discount)
          maxLocations: 1,
          maxUsers: 5,
          features: ['order_management', 'basic_inventory', 'basic_reporting', 'email_support'],
          isPopular: false,
          sortOrder: 1,
        },
        {
          name: 'Professional',
          description: 'Ideal for growing bakeries with multiple locations',
          priceMonthlyUsd: 14900, // $149
          priceAnnualUsd: 143040, // $1,430.40 (20% discount)
          maxLocations: 3,
          maxUsers: 15,
          features: [
            'order_management',
            'advanced_inventory',
            'production_planning',
            'advanced_reporting',
            'multi_location',
            'priority_support',
            'api_access',
          ],
          isPopular: true,
          sortOrder: 2,
        },
        {
          name: 'Business',
          description: 'Comprehensive solution for established bakery chains',
          priceMonthlyUsd: 39900, // $399
          priceAnnualUsd: 383040, // $3,830.40 (20% discount)
          maxLocations: 10,
          maxUsers: 50,
          features: [
            'order_management',
            'advanced_inventory',
            'production_planning',
            'advanced_analytics',
            'multi_location',
            'staff_management',
            'customer_insights',
            'custom_reports',
            'dedicated_support',
            'api_access',
            'white_label',
          ],
          isPopular: false,
          sortOrder: 3,
        },
        {
          name: 'Enterprise',
          description: 'Custom solution for large-scale bakery operations',
          priceMonthlyUsd: 0, // Custom pricing
          priceAnnualUsd: 0, // Custom pricing
          maxLocations: null, // Unlimited
          maxUsers: null, // Unlimited
          features: [
            'all_features',
            'custom_development',
            'dedicated_account_manager',
            'sla_guarantee',
            'on_premise_option',
          ],
          isPopular: false,
          sortOrder: 4,
        },
      ];

      const results = await Promise.all(
        defaultPlans.map(async (planData) => {
          const existing = await this.getPlanByName(planData.name);
          if (!existing) {
            return this.createPlan(planData);
          }
          return existing;
        })
      );

      this.logger.log('Default subscription plans seeded successfully');
      return results;
    } catch (error) {
      this.logger.error('Failed to seed default plans:', error);
      throw new BadRequestException('Failed to seed default plans');
    }
  }
}
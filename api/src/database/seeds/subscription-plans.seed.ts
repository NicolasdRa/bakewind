import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { subscriptionPlansTable } from '../schemas/subscription-plans.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class SubscriptionPlansSeed {
  private readonly logger = new Logger(SubscriptionPlansSeed.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting subscription plans seeding...');

    const defaultPlans = [
      {
        id: 'plan-starter',
        name: 'Starter',
        description: 'Perfect for small bakeries and home-based businesses. Get started with essential features to manage your orders, inventory, and basic analytics.',
        priceMonthlyUsd: 29.99,
        priceAnnualUsd: 299.99,
        maxLocations: 1,
        maxUsers: 2,
        features: [
          'Order Management',
          'Inventory Control',
          'Recipe Management',
          'Customer Database',
          'Sales Analytics',
          'Product Catalog',
          'Email Support',
          'Mobile App Access',
        ],
        stripePriceIdMonthly: 'price_starter_monthly',
        stripePriceIdAnnual: 'price_starter_annual',
        isPopular: false,
        sortOrder: 1,
        isActive: true,
      },
      {
        id: 'plan-professional',
        name: 'Professional',
        description: 'Ideal for growing bakeries with multiple staff members. Advanced features for production planning, custom forms, and enhanced customer management.',
        priceMonthlyUsd: 79.99,
        priceAnnualUsd: 799.99,
        maxLocations: 2,
        maxUsers: 10,
        features: [
          'All Starter features',
          'Production Planning',
          'Custom Order Forms',
          'Supplier Management',
          'Loyalty Program',
          'Advanced Analytics',
          'Staff Management',
          'Seasonal Menus',
          'Priority Support',
          'API Access',
        ],
        stripePriceIdMonthly: 'price_professional_monthly',
        stripePriceIdAnnual: 'price_professional_annual',
        isPopular: true,
        sortOrder: 2,
        isActive: true,
      },
      {
        id: 'plan-business',
        name: 'Business',
        description: 'Designed for established bakeries with multiple locations. Complete business management suite with profit insights and advanced integrations.',
        priceMonthlyUsd: 149.99,
        priceAnnualUsd: 1499.99,
        maxLocations: 5,
        maxUsers: 25,
        features: [
          'All Professional features',
          'Multi-location Support',
          'Profit Insights',
          'Advanced Reporting',
          'Wholesale Management',
          'Custom Integrations',
          'Team Collaboration',
          'Automated Workflows',
          'White-label Options',
          'Phone Support',
          'Training Sessions',
        ],
        stripePriceIdMonthly: 'price_business_monthly',
        stripePriceIdAnnual: 'price_business_annual',
        isPopular: false,
        sortOrder: 3,
        isActive: true,
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        description: 'For large bakery chains and franchises. Enterprise-grade features with unlimited locations, custom development, and dedicated support.',
        priceMonthlyUsd: 299.99,
        priceAnnualUsd: 2999.99,
        maxLocations: null, // Unlimited
        maxUsers: null, // Unlimited
        features: [
          'All Business features',
          'Unlimited Locations',
          'Unlimited Users',
          'Custom Development',
          'Dedicated Support Manager',
          'SLA Guarantees',
          'Advanced Security',
          'Data Migration',
          'Custom Training',
          'Franchise Management',
          'Advanced Integrations',
          'Custom Reports',
          'Priority Feature Requests',
        ],
        stripePriceIdMonthly: 'price_enterprise_monthly',
        stripePriceIdAnnual: 'price_enterprise_annual',
        isPopular: false,
        sortOrder: 4,
        isActive: true,
      },
    ];

    try {
      for (const planData of defaultPlans) {
        // Check if plan already exists
        const [existingPlan] = await this.databaseService.database
          .select()
          .from(subscriptionPlansTable)
          .where(eq(subscriptionPlansTable.id, planData.id))
          .limit(1);

        if (existingPlan) {
          this.logger.log(`Plan ${planData.name} already exists, skipping...`);
          continue;
        }

        // Insert new plan
        await this.databaseService.database
          .insert(subscriptionPlansTable)
          .values(planData);

        this.logger.log(`Created subscription plan: ${planData.name}`);
      }

      this.logger.log('Subscription plans seeding completed successfully');
    } catch (error) {
      this.logger.error('Failed to seed subscription plans:', error);
      throw error;
    }
  }

  async seedTestPlans(): Promise<void> {
    this.logger.log('Starting test subscription plans seeding...');

    const testPlans = [
      {
        id: 'plan-test-free',
        name: 'Test Free',
        description: 'Test plan for development and testing purposes only.',
        priceMonthlyUsd: 0,
        priceAnnualUsd: 0,
        maxLocations: 1,
        maxUsers: 1,
        features: ['Basic Testing', 'Limited Features'],
        stripePriceIdMonthly: 'price_test_free_monthly',
        stripePriceIdAnnual: 'price_test_free_annual',
        isPopular: false,
        sortOrder: 0,
        isActive: true,
      },
      {
        id: 'plan-test-paid',
        name: 'Test Paid',
        description: 'Test paid plan for development and testing purposes only.',
        priceMonthlyUsd: 1.99,
        priceAnnualUsd: 19.99,
        maxLocations: 1,
        maxUsers: 1,
        features: ['Advanced Testing', 'All Features'],
        stripePriceIdMonthly: 'price_test_paid_monthly',
        stripePriceIdAnnual: 'price_test_paid_annual',
        isPopular: false,
        sortOrder: 0,
        isActive: true,
      },
    ];

    try {
      for (const planData of testPlans) {
        // Check if plan already exists
        const [existingPlan] = await this.databaseService.database
          .select()
          .from(subscriptionPlansTable)
          .where(eq(subscriptionPlansTable.id, planData.id))
          .limit(1);

        if (existingPlan) {
          this.logger.log(`Test plan ${planData.name} already exists, updating...`);

          // Update existing test plan
          await this.databaseService.database
            .update(subscriptionPlansTable)
            .set({
              ...planData,
              updatedAt: new Date(),
            })
            .where(eq(subscriptionPlansTable.id, planData.id));
        } else {
          // Insert new test plan
          await this.databaseService.database
            .insert(subscriptionPlansTable)
            .values(planData);
        }

        this.logger.log(`Test plan ready: ${planData.name}`);
      }

      this.logger.log('Test subscription plans seeding completed successfully');
    } catch (error) {
      this.logger.error('Failed to seed test subscription plans:', error);
      throw error;
    }
  }

  async updateStripePriceIds(planUpdates: Array<{ planId: string; monthlyPriceId: string; annualPriceId: string }>): Promise<void> {
    this.logger.log('Updating Stripe price IDs for existing plans...');

    try {
      for (const update of planUpdates) {
        await this.databaseService.database
          .update(subscriptionPlansTable)
          .set({
            stripePriceIdMonthly: update.monthlyPriceId,
            stripePriceIdAnnual: update.annualPriceId,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionPlansTable.id, update.planId));

        this.logger.log(`Updated Stripe price IDs for plan: ${update.planId}`);
      }

      this.logger.log('Stripe price IDs update completed successfully');
    } catch (error) {
      this.logger.error('Failed to update Stripe price IDs:', error);
      throw error;
    }
  }

  async deactivateTestPlans(): Promise<void> {
    this.logger.log('Deactivating test plans...');

    try {
      await this.databaseService.database
        .update(subscriptionPlansTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlansTable.name, 'Test Free'));

      await this.databaseService.database
        .update(subscriptionPlansTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlansTable.name, 'Test Paid'));

      this.logger.log('Test plans deactivated successfully');
    } catch (error) {
      this.logger.error('Failed to deactivate test plans:', error);
      throw error;
    }
  }

  async getSeededPlansCount(): Promise<number> {
    try {
      const plans = await this.databaseService.database
        .select({ id: subscriptionPlansTable.id })
        .from(subscriptionPlansTable);

      return plans.length;
    } catch (error) {
      this.logger.error('Failed to get seeded plans count:', error);
      return 0;
    }
  }

  async validatePlanConsistency(): Promise<{ isValid: boolean; issues: string[] }> {
    this.logger.log('Validating plan consistency...');

    const issues: string[] = [];

    try {
      const plans = await this.databaseService.database
        .select()
        .from(subscriptionPlansTable);

      // Check for required plans
      const requiredPlanIds = ['plan-starter', 'plan-professional', 'plan-business', 'plan-enterprise'];
      const existingPlanIds = plans.map(p => p.id);

      for (const requiredId of requiredPlanIds) {
        if (!existingPlanIds.includes(requiredId)) {
          issues.push(`Missing required plan: ${requiredId}`);
        }
      }

      // Check for pricing consistency
      for (const plan of plans) {
        if (plan.priceAnnualUsd > plan.priceMonthlyUsd * 12) {
          issues.push(`Plan ${plan.id}: Annual price (${plan.priceAnnualUsd}) is higher than 12x monthly price (${plan.priceMonthlyUsd * 12})`);
        }

        if (plan.priceMonthlyUsd <= 0 && !plan.id.includes('test') && !plan.id.includes('free')) {
          issues.push(`Plan ${plan.id}: Monthly price should be greater than 0`);
        }

        if (!plan.stripePriceIdMonthly || !plan.stripePriceIdAnnual) {
          issues.push(`Plan ${plan.id}: Missing Stripe price IDs`);
        }

        if (!plan.features || plan.features.length === 0) {
          issues.push(`Plan ${plan.id}: No features defined`);
        }
      }

      // Check sort order uniqueness among active plans
      const activePlans = plans.filter(p => p.isActive);
      const sortOrders = activePlans.map(p => p.sortOrder);
      const uniqueSortOrders = [...new Set(sortOrders)];

      if (sortOrders.length !== uniqueSortOrders.length) {
        issues.push('Duplicate sort orders found among active plans');
      }

      const isValid = issues.length === 0;

      if (isValid) {
        this.logger.log('Plan consistency validation passed');
      } else {
        this.logger.warn(`Plan consistency validation failed with ${issues.length} issues`);
      }

      return { isValid, issues };
    } catch (error) {
      this.logger.error('Failed to validate plan consistency:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { isValid: false, issues: [`Validation error: ${errorMessage}`] };
    }
  }
}
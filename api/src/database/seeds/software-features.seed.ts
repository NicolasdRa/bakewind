import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { softwareFeaturesTable } from '../schemas/software-features.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class SoftwareFeaturesSeed {
  private readonly logger = new Logger(SoftwareFeaturesSeed.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting software features seeding...');

    const defaultFeatures = [
      // Orders Category - Core order management features
      {
        id: 'feature-order-management',
        name: 'Order Management',
        description:
          'Track and manage customer orders from placement to delivery with real-time status updates and automated notifications.',
        iconName: 'shopping-cart',
        category: 'orders' as const,
        availableInPlans: [
          'plan-starter',
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/orders',
        helpDocUrl: 'https://docs.bakewind.com/features/order-management',
        sortOrder: 1,
        isHighlighted: true,
        isActive: true,
      },
      {
        id: 'feature-custom-order-forms',
        name: 'Custom Order Forms',
        description:
          'Create tailored order forms for different product categories, special occasions, and customer types with conditional fields.',
        iconName: 'clipboard-list',
        category: 'orders' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/custom-forms',
        helpDocUrl: 'https://docs.bakewind.com/features/custom-forms',
        sortOrder: 2,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-order-templates',
        name: 'Order Templates',
        description:
          'Save frequent orders as templates for quick reordering by customers and staff members.',
        iconName: 'copy',
        category: 'orders' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        sortOrder: 3,
        isHighlighted: false,
        isActive: true,
      },

      // Inventory Category - Stock and supply management
      {
        id: 'feature-inventory-control',
        name: 'Inventory Control',
        description:
          'Monitor ingredients and supplies with automatic low-stock alerts, reorder suggestions, and waste tracking.',
        iconName: 'box',
        category: 'inventory' as const,
        availableInPlans: [
          'plan-starter',
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/inventory',
        helpDocUrl: 'https://docs.bakewind.com/features/inventory-control',
        sortOrder: 4,
        isHighlighted: true,
        isActive: true,
      },
      {
        id: 'feature-supplier-management',
        name: 'Supplier Management',
        description:
          'Manage supplier relationships, track deliveries, compare prices, and optimize purchasing decisions.',
        iconName: 'truck',
        category: 'inventory' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/suppliers',
        helpDocUrl: 'https://docs.bakewind.com/features/supplier-management',
        sortOrder: 5,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-cost-tracking',
        name: 'Cost Tracking',
        description:
          'Track ingredient costs, calculate recipe costs automatically, and monitor cost variations over time.',
        iconName: 'calculator',
        category: 'inventory' as const,
        availableInPlans: ['plan-business', 'plan-enterprise'],
        sortOrder: 6,
        isHighlighted: false,
        isActive: true,
      },

      // Production Category - Baking and production planning
      {
        id: 'feature-production-planning',
        name: 'Production Planning',
        description:
          'Plan daily production schedules based on orders, optimize batch sizes, and coordinate kitchen operations.',
        iconName: 'calendar',
        category: 'production' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/production',
        helpDocUrl: 'https://docs.bakewind.com/features/production-planning',
        sortOrder: 7,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-recipe-management',
        name: 'Recipe Management',
        description:
          'Store and scale recipes with automatic cost calculations, yield tracking, and nutritional information.',
        iconName: 'book-open',
        category: 'production' as const,
        availableInPlans: [
          'plan-starter',
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/recipes',
        helpDocUrl: 'https://docs.bakewind.com/features/recipe-management',
        sortOrder: 8,
        isHighlighted: true,
        isActive: true,
      },
      {
        id: 'feature-batch-tracking',
        name: 'Batch Tracking',
        description:
          'Track production batches from ingredients to finished products with full traceability for quality control.',
        iconName: 'layers',
        category: 'production' as const,
        availableInPlans: ['plan-business', 'plan-enterprise'],
        sortOrder: 9,
        isHighlighted: false,
        isActive: true,
      },

      // Analytics Category - Business intelligence and reporting
      {
        id: 'feature-sales-analytics',
        name: 'Sales Analytics',
        description:
          'Track sales performance with detailed reports, trend analysis, and forecasting tools for better business decisions.',
        iconName: 'chart-line',
        category: 'analytics' as const,
        availableInPlans: [
          'plan-starter',
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/analytics',
        helpDocUrl: 'https://docs.bakewind.com/features/sales-analytics',
        sortOrder: 10,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-profit-insights',
        name: 'Profit Insights',
        description:
          'Analyze profitability by product, customer, and location with AI-powered recommendations for optimization.',
        iconName: 'dollar-sign',
        category: 'analytics' as const,
        availableInPlans: ['plan-business', 'plan-enterprise'],
        demoUrl: 'https://demo.bakewind.com/profit-insights',
        helpDocUrl: 'https://docs.bakewind.com/features/profit-insights',
        sortOrder: 11,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-custom-reports',
        name: 'Custom Reports',
        description:
          'Create custom reports and dashboards tailored to your specific business needs and KPIs.',
        iconName: 'file-chart',
        category: 'analytics' as const,
        availableInPlans: ['plan-enterprise'],
        sortOrder: 12,
        isHighlighted: false,
        isActive: true,
      },

      // Customers Category - Customer relationship management
      {
        id: 'feature-customer-database',
        name: 'Customer Database',
        description:
          'Build comprehensive customer profiles with order history, preferences, allergies, and special requirements.',
        iconName: 'users',
        category: 'customers' as const,
        availableInPlans: [
          'plan-starter',
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/customers',
        helpDocUrl: 'https://docs.bakewind.com/features/customer-database',
        sortOrder: 13,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-loyalty-program',
        name: 'Loyalty Program',
        description:
          'Create and manage customer loyalty programs with points, rewards, discounts, and automated campaigns.',
        iconName: 'gift',
        category: 'customers' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/loyalty',
        helpDocUrl: 'https://docs.bakewind.com/features/loyalty-program',
        sortOrder: 14,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-customer-communications',
        name: 'Customer Communications',
        description:
          'Send automated emails, SMS notifications, and marketing campaigns to keep customers engaged.',
        iconName: 'mail',
        category: 'customers' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        sortOrder: 15,
        isHighlighted: false,
        isActive: true,
      },

      // Products Category - Product and menu management
      {
        id: 'feature-product-catalog',
        name: 'Product Catalog',
        description:
          'Manage your complete product catalog with pricing, images, descriptions, and availability scheduling.',
        iconName: 'package',
        category: 'products' as const,
        availableInPlans: [
          'plan-starter',
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/products',
        helpDocUrl: 'https://docs.bakewind.com/features/product-catalog',
        sortOrder: 16,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-seasonal-menus',
        name: 'Seasonal Menus',
        description:
          'Create and schedule seasonal product offerings with automatic activation and promotional campaigns.',
        iconName: 'sun',
        category: 'products' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        demoUrl: 'https://demo.bakewind.com/seasonal',
        helpDocUrl: 'https://docs.bakewind.com/features/seasonal-menus',
        sortOrder: 17,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-custom-products',
        name: 'Custom Products',
        description:
          'Handle custom cake orders and special requests with detailed specification forms and approval workflows.',
        iconName: 'palette',
        category: 'products' as const,
        availableInPlans: [
          'plan-professional',
          'plan-business',
          'plan-enterprise',
        ],
        sortOrder: 18,
        isHighlighted: false,
        isActive: true,
      },
    ];

    try {
      for (const featureData of defaultFeatures) {
        // Check if feature already exists
        const [existingFeature] = await this.databaseService.database
          .select()
          .from(softwareFeaturesTable)
          .where(eq(softwareFeaturesTable.id, featureData.id))
          .limit(1);

        if (existingFeature) {
          this.logger.log(
            `Feature ${featureData.name} already exists, skipping...`,
          );
          continue;
        }

        // Insert new feature
        await this.databaseService.database
          .insert(softwareFeaturesTable)
          .values(featureData);

        this.logger.log(`Created software feature: ${featureData.name}`);
      }

      this.logger.log('Software features seeding completed successfully');
    } catch (error) {
      this.logger.error('Failed to seed software features:', error);
      throw error;
    }
  }

  async seedTestFeatures(): Promise<void> {
    this.logger.log('Starting test software features seeding...');

    const testFeatures = [
      {
        id: 'feature-test-basic',
        name: 'Test Basic Feature',
        description:
          'Basic test feature for development and testing purposes only.',
        iconName: 'test-tube',
        category: 'orders' as const,
        availableInPlans: ['plan-test-free', 'plan-test-paid'],
        sortOrder: 0,
        isHighlighted: false,
        isActive: true,
      },
      {
        id: 'feature-test-advanced',
        name: 'Test Advanced Feature',
        description:
          'Advanced test feature for development and testing purposes only.',
        iconName: 'beaker',
        category: 'analytics' as const,
        availableInPlans: ['plan-test-paid'],
        sortOrder: 0,
        isHighlighted: true,
        isActive: true,
      },
    ];

    try {
      for (const featureData of testFeatures) {
        // Check if feature already exists
        const [existingFeature] = await this.databaseService.database
          .select()
          .from(softwareFeaturesTable)
          .where(eq(softwareFeaturesTable.id, featureData.id))
          .limit(1);

        if (existingFeature) {
          this.logger.log(
            `Test feature ${featureData.name} already exists, updating...`,
          );

          // Update existing test feature
          await this.databaseService.database
            .update(softwareFeaturesTable)
            .set({
              ...featureData,
              updatedAt: new Date(),
            })
            .where(eq(softwareFeaturesTable.id, featureData.id));
        } else {
          // Insert new test feature
          await this.databaseService.database
            .insert(softwareFeaturesTable)
            .values(featureData);
        }

        this.logger.log(`Test feature ready: ${featureData.name}`);
      }

      this.logger.log('Test software features seeding completed successfully');
    } catch (error) {
      this.logger.error('Failed to seed test software features:', error);
      throw error;
    }
  }

  async updateFeaturePlans(
    featureUpdates: Array<{ featureId: string; availableInPlans: string[] }>,
  ): Promise<void> {
    this.logger.log('Updating feature plan availability...');

    try {
      for (const update of featureUpdates) {
        await this.databaseService.database
          .update(softwareFeaturesTable)
          .set({
            availableInPlans: update.availableInPlans,
            updatedAt: new Date(),
          })
          .where(eq(softwareFeaturesTable.id, update.featureId));

        this.logger.log(
          `Updated plan availability for feature: ${update.featureId}`,
        );
      }

      this.logger.log(
        'Feature plan availability update completed successfully',
      );
    } catch (error) {
      this.logger.error('Failed to update feature plan availability:', error);
      throw error;
    }
  }

  async deactivateTestFeatures(): Promise<void> {
    this.logger.log('Deactivating test features...');

    try {
      await this.databaseService.database
        .update(softwareFeaturesTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(softwareFeaturesTable.name, 'Test Basic Feature'));

      await this.databaseService.database
        .update(softwareFeaturesTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(softwareFeaturesTable.name, 'Test Advanced Feature'));

      this.logger.log('Test features deactivated successfully');
    } catch (error) {
      this.logger.error('Failed to deactivate test features:', error);
      throw error;
    }
  }

  async getSeededFeaturesCount(): Promise<number> {
    try {
      const features = await this.databaseService.database
        .select({ id: softwareFeaturesTable.id })
        .from(softwareFeaturesTable);

      return features.length;
    } catch (error) {
      this.logger.error('Failed to get seeded features count:', error);
      return 0;
    }
  }

  async getFeaturesByCategory(): Promise<Record<string, number>> {
    try {
      const features = await this.databaseService.database
        .select({ category: softwareFeaturesTable.category })
        .from(softwareFeaturesTable)
        .where(eq(softwareFeaturesTable.isActive, true));

      const categoryCount: Record<string, number> = {};

      for (const feature of features) {
        categoryCount[feature.category] =
          (categoryCount[feature.category] || 0) + 1;
      }

      return categoryCount;
    } catch (error) {
      this.logger.error('Failed to get features by category:', error);
      return {};
    }
  }

  async validateFeatureConsistency(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    this.logger.log('Validating feature consistency...');

    const issues: string[] = [];

    try {
      const features = await this.databaseService.database
        .select()
        .from(softwareFeaturesTable);

      // Check for required categories
      const requiredCategories = [
        'orders',
        'inventory',
        'production',
        'analytics',
        'customers',
        'products',
      ] as const;
      const existingCategories = [...new Set(features.map((f) => f.category))];

      for (const requiredCategory of requiredCategories) {
        if (!existingCategories.includes(requiredCategory as any)) {
          issues.push(`Missing features in category: ${requiredCategory}`);
        }
      }

      // Check for highlighted features
      const highlightedFeatures = features.filter(
        (f) => f.isHighlighted && f.isActive,
      );
      if (highlightedFeatures.length < 3) {
        issues.push(
          `Only ${highlightedFeatures.length} highlighted features found, recommend at least 3`,
        );
      }
      if (highlightedFeatures.length > 5) {
        issues.push(
          `Too many highlighted features (${highlightedFeatures.length}), recommend max 5`,
        );
      }

      // Check for features in starter plan
      const starterFeatures = features.filter(
        (f) => f.availableInPlans.includes('plan-starter') && f.isActive,
      );
      if (starterFeatures.length < 5) {
        issues.push(
          `Only ${starterFeatures.length} features in starter plan, recommend at least 5`,
        );
      }

      // Check sort order consistency
      const activeFeaturesWithSortOrder = features.filter(
        (f) => f.isActive && f.sortOrder > 0,
      );
      const sortOrders = activeFeaturesWithSortOrder.map((f) => f.sortOrder);
      const uniqueSortOrders = [...new Set(sortOrders)];

      if (sortOrders.length !== uniqueSortOrders.length) {
        issues.push('Duplicate sort orders found among active features');
      }

      // Check for missing required fields
      for (const feature of features) {
        if (!feature.name || feature.name.trim().length === 0) {
          issues.push(`Feature ${feature.id}: Missing name`);
        }

        if (!feature.description || feature.description.trim().length === 0) {
          issues.push(`Feature ${feature.id}: Missing description`);
        }

        if (!feature.iconName || feature.iconName.trim().length === 0) {
          issues.push(`Feature ${feature.id}: Missing icon name`);
        }

        if (
          !feature.availableInPlans ||
          feature.availableInPlans.length === 0
        ) {
          issues.push(`Feature ${feature.id}: No plans specified`);
        }

        // Check if all referenced plans exist (would need to query plans table)
        // This could be enhanced with a join query to subscription plans
      }

      const isValid = issues.length === 0;

      if (isValid) {
        this.logger.log('Feature consistency validation passed');
      } else {
        this.logger.warn(
          `Feature consistency validation failed with ${issues.length} issues`,
        );
      }

      return { isValid, issues };
    } catch (error) {
      this.logger.error('Failed to validate feature consistency:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { isValid: false, issues: [`Validation error: ${errorMessage}`] };
    }
  }

  async generateFeatureMatrix(): Promise<Record<string, string[]>> {
    this.logger.log('Generating feature availability matrix...');

    try {
      const features = await this.databaseService.database
        .select({
          name: softwareFeaturesTable.name,
          availableInPlans: softwareFeaturesTable.availableInPlans,
        })
        .from(softwareFeaturesTable)
        .where(eq(softwareFeaturesTable.isActive, true));

      const matrix: Record<string, string[]> = {};

      for (const feature of features) {
        for (const planId of feature.availableInPlans) {
          if (!matrix[planId]) {
            matrix[planId] = [];
          }
          matrix[planId].push(feature.name);
        }
      }

      this.logger.log('Feature matrix generated successfully');
      return matrix;
    } catch (error) {
      this.logger.error('Failed to generate feature matrix:', error);
      return {};
    }
  }
}

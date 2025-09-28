import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { softwareFeaturesTable } from '../database/schemas/software-features.schema';

export interface CreateFeatureData {
  name: string;
  description: string;
  iconName: string;
  category: 'orders' | 'inventory' | 'production' | 'analytics' | 'customers' | 'products';
  availableInPlans: string[];
  demoUrl?: string;
  helpDocUrl?: string;
  sortOrder: number;
  isHighlighted?: boolean;
}

export interface UpdateFeatureData {
  description?: string;
  iconName?: string;
  category?: 'orders' | 'inventory' | 'production' | 'analytics' | 'customers' | 'products';
  availableInPlans?: string[];
  demoUrl?: string;
  helpDocUrl?: string;
  sortOrder?: number;
  isHighlighted?: boolean;
  isActive?: boolean;
}

@Injectable()
export class SoftwareFeaturesService {
  private readonly logger = new Logger(SoftwareFeaturesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all active software features sorted by display order
   */
  async getAllFeatures(includeInactive = false) {
    try {
      const features = await this.databaseService.db
        .select()
        .from(softwareFeaturesTable)
        .where(includeInactive ? undefined : eq(softwareFeaturesTable.isActive, true))
        .orderBy(asc(softwareFeaturesTable.sortOrder));

      return features;
    } catch (error) {
      this.logger.error('Failed to get software features:', error);
      throw new BadRequestException('Failed to retrieve software features');
    }
  }

  /**
   * Get features by category
   */
  async getFeaturesByCategory(category: string) {
    try {
      const features = await this.databaseService.db
        .select()
        .from(softwareFeaturesTable)
        .where(and(
          eq(softwareFeaturesTable.isActive, true),
          eq(softwareFeaturesTable.category, category as any)
        ))
        .orderBy(asc(softwareFeaturesTable.sortOrder));

      return features;
    } catch (error) {
      this.logger.error(`Failed to get features for category ${category}:`, error);
      throw new BadRequestException('Failed to retrieve features by category');
    }
  }

  /**
   * Get highlighted features for landing page hero section
   */
  async getHighlightedFeatures() {
    try {
      const features = await this.databaseService.db
        .select()
        .from(softwareFeaturesTable)
        .where(and(
          eq(softwareFeaturesTable.isActive, true),
          eq(softwareFeaturesTable.isHighlighted, true)
        ))
        .orderBy(asc(softwareFeaturesTable.sortOrder))
        .limit(3); // Limit to top 3 highlighted features

      return features;
    } catch (error) {
      this.logger.error('Failed to get highlighted features:', error);
      throw new BadRequestException('Failed to retrieve highlighted features');
    }
  }

  /**
   * Get a specific feature by ID
   */
  async getFeatureById(featureId: string) {
    try {
      const [feature] = await this.databaseService.db
        .select()
        .from(softwareFeaturesTable)
        .where(eq(softwareFeaturesTable.id, featureId))
        .limit(1);

      if (!feature) {
        throw new NotFoundException('Software feature not found');
      }

      return feature;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get feature ${featureId}:`, error);
      throw new BadRequestException('Failed to retrieve software feature');
    }
  }

  /**
   * Get features available in a specific plan
   */
  async getFeaturesByPlanId(planId: string) {
    try {
      // Get all features
      const allFeatures = await this.getAllFeatures();

      // Filter features that include this plan ID
      const planFeatures = allFeatures.filter(feature =>
        feature.availableInPlans.includes(planId)
      );

      return planFeatures;
    } catch (error) {
      this.logger.error(`Failed to get features for plan ${planId}:`, error);
      throw new BadRequestException('Failed to retrieve features for plan');
    }
  }

  /**
   * Get features available in multiple plans (for comparison)
   */
  async getFeaturesByPlanIds(planIds: string[]) {
    try {
      const allFeatures = await this.getAllFeatures();

      // Create a map of features by plan
      const featuresByPlan = planIds.reduce((acc, planId) => {
        acc[planId] = allFeatures.filter(feature =>
          feature.availableInPlans.includes(planId)
        );
        return acc;
      }, {} as Record<string, typeof allFeatures>);

      return featuresByPlan;
    } catch (error) {
      this.logger.error('Failed to get features by plan IDs:', error);
      throw new BadRequestException('Failed to retrieve features for plans');
    }
  }

  /**
   * Create a new software feature (admin only)
   */
  async createFeature(featureData: CreateFeatureData) {
    try {
      // Check if feature name already exists
      const [existing] = await this.databaseService.db
        .select()
        .from(softwareFeaturesTable)
        .where(eq(softwareFeaturesTable.name, featureData.name))
        .limit(1);

      if (existing) {
        throw new BadRequestException('Feature name already exists');
      }

      const [newFeature] = await this.databaseService.db
        .insert(softwareFeaturesTable)
        .values({
          ...featureData,
          isActive: true,
        })
        .returning();

      this.logger.log(`Created software feature ${newFeature.id} - ${newFeature.name}`);
      return newFeature;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to create software feature:', error);
      throw new BadRequestException('Failed to create software feature');
    }
  }

  /**
   * Update an existing software feature (admin only)
   */
  async updateFeature(featureId: string, updateData: UpdateFeatureData) {
    try {
      // Verify feature exists
      await this.getFeatureById(featureId);

      const [updatedFeature] = await this.databaseService.db
        .update(softwareFeaturesTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(softwareFeaturesTable.id, featureId))
        .returning();

      this.logger.log(`Updated software feature ${featureId}`);
      return updatedFeature;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update feature ${featureId}:`, error);
      throw new BadRequestException('Failed to update software feature');
    }
  }

  /**
   * Soft delete a software feature (deactivate)
   */
  async deleteFeature(featureId: string) {
    try {
      const [deactivatedFeature] = await this.databaseService.db
        .update(softwareFeaturesTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(
          eq(softwareFeaturesTable.id, featureId),
          eq(softwareFeaturesTable.isActive, true)
        ))
        .returning({ id: softwareFeaturesTable.id });

      if (!deactivatedFeature) {
        throw new NotFoundException('Software feature not found or already deactivated');
      }

      this.logger.log(`Deactivated software feature ${featureId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete feature ${featureId}:`, error);
      throw new BadRequestException('Failed to delete software feature');
    }
  }

  /**
   * Get feature categories with counts
   */
  async getFeatureCategories() {
    try {
      const features = await this.getAllFeatures();

      const categories = features.reduce((acc, feature) => {
        if (!acc[feature.category]) {
          acc[feature.category] = {
            name: feature.category,
            count: 0,
            features: [],
          };
        }
        acc[feature.category].count++;
        acc[feature.category].features.push({
          id: feature.id,
          name: feature.name,
          iconName: feature.iconName,
        });
        return acc;
      }, {} as Record<string, any>);

      return Object.values(categories);
    } catch (error) {
      this.logger.error('Failed to get feature categories:', error);
      throw new BadRequestException('Failed to retrieve feature categories');
    }
  }

  /**
   * Compare features across different plans
   */
  async compareFeatures(planIds: string[]) {
    try {
      const allFeatures = await this.getAllFeatures();

      // Build comparison matrix
      const comparison = allFeatures.map(feature => ({
        id: feature.id,
        name: feature.name,
        description: feature.description,
        category: feature.category,
        iconName: feature.iconName,
        availability: planIds.reduce((acc, planId) => {
          acc[planId] = feature.availableInPlans.includes(planId);
          return acc;
        }, {} as Record<string, boolean>),
      }));

      return {
        features: comparison,
        planIds,
        totalFeatures: comparison.length,
      };
    } catch (error) {
      this.logger.error('Failed to compare features:', error);
      throw new BadRequestException('Failed to compare features');
    }
  }

  /**
   * Seed default software features
   */
  async seedDefaultFeatures() {
    try {
      const defaultFeatures = [
        // Orders Category
        {
          name: 'Order Management',
          description: 'Track and manage customer orders from placement to delivery with real-time status updates',
          iconName: 'shopping-cart',
          category: 'orders' as const,
          availableInPlans: ['plan-starter', 'plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 1,
          isHighlighted: true,
        },
        {
          name: 'Custom Order Forms',
          description: 'Create custom order forms for different product categories and customer types',
          iconName: 'clipboard-list',
          category: 'orders' as const,
          availableInPlans: ['plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 2,
        },

        // Inventory Category
        {
          name: 'Inventory Control',
          description: 'Monitor ingredients and supplies with automatic low-stock alerts and reorder suggestions',
          iconName: 'box',
          category: 'inventory' as const,
          availableInPlans: ['plan-starter', 'plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 3,
          isHighlighted: true,
        },
        {
          name: 'Supplier Management',
          description: 'Manage supplier relationships, track deliveries, and optimize purchasing decisions',
          iconName: 'truck',
          category: 'inventory' as const,
          availableInPlans: ['plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 4,
        },

        // Production Category
        {
          name: 'Production Planning',
          description: 'Plan daily production schedules based on orders and optimize batch sizes',
          iconName: 'calendar',
          category: 'production' as const,
          availableInPlans: ['plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 5,
        },
        {
          name: 'Recipe Management',
          description: 'Store and scale recipes with automatic cost calculations and yield tracking',
          iconName: 'book-open',
          category: 'production' as const,
          availableInPlans: ['plan-starter', 'plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 6,
          isHighlighted: true,
        },

        // Analytics Category
        {
          name: 'Sales Analytics',
          description: 'Track sales performance with detailed reports and trend analysis',
          iconName: 'chart-line',
          category: 'analytics' as const,
          availableInPlans: ['plan-starter', 'plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 7,
        },
        {
          name: 'Profit Insights',
          description: 'Analyze profitability by product, customer, and location with AI-powered recommendations',
          iconName: 'dollar-sign',
          category: 'analytics' as const,
          availableInPlans: ['plan-business', 'plan-enterprise'],
          sortOrder: 8,
        },

        // Customers Category
        {
          name: 'Customer Database',
          description: 'Build customer profiles with order history, preferences, and special requirements',
          iconName: 'users',
          category: 'customers' as const,
          availableInPlans: ['plan-starter', 'plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 9,
        },
        {
          name: 'Loyalty Program',
          description: 'Create and manage customer loyalty programs with rewards and discounts',
          iconName: 'gift',
          category: 'customers' as const,
          availableInPlans: ['plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 10,
        },

        // Products Category
        {
          name: 'Product Catalog',
          description: 'Manage your complete product catalog with pricing, images, and descriptions',
          iconName: 'package',
          category: 'products' as const,
          availableInPlans: ['plan-starter', 'plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 11,
        },
        {
          name: 'Seasonal Menus',
          description: 'Create and schedule seasonal product offerings with automatic activation',
          iconName: 'sun',
          category: 'products' as const,
          availableInPlans: ['plan-professional', 'plan-business', 'plan-enterprise'],
          sortOrder: 12,
        },
      ];

      const results = await Promise.all(
        defaultFeatures.map(async (featureData) => {
          const [existing] = await this.databaseService.db
            .select()
            .from(softwareFeaturesTable)
            .where(eq(softwareFeaturesTable.name, featureData.name))
            .limit(1);

          if (!existing) {
            return this.createFeature(featureData);
          }
          return existing;
        })
      );

      this.logger.log('Default software features seeded successfully');
      return results;
    } catch (error) {
      this.logger.error('Failed to seed default features:', error);
      throw new BadRequestException('Failed to seed default features');
    }
  }

  /**
   * Get feature availability matrix for pricing page
   */
  async getFeatureAvailabilityMatrix() {
    try {
      const features = await this.getAllFeatures();

      // Group features by category
      const categorizedFeatures = features.reduce((acc, feature) => {
        if (!acc[feature.category]) {
          acc[feature.category] = [];
        }
        acc[feature.category].push({
          id: feature.id,
          name: feature.name,
          description: feature.description,
          iconName: feature.iconName,
          availableInPlans: feature.availableInPlans,
        });
        return acc;
      }, {} as Record<string, any[]>);

      return categorizedFeatures;
    } catch (error) {
      this.logger.error('Failed to get feature availability matrix:', error);
      throw new BadRequestException('Failed to retrieve feature availability matrix');
    }
  }
}
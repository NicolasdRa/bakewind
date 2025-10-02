import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { softwareFeaturesTable } from '../database/schemas/software-features.schema';

export interface CreateSoftwareFeatureDto {
  name: string;
  description: string;
  iconName: string;
  category: 'orders' | 'inventory' | 'production' | 'analytics' | 'customers' | 'products';
  availableInPlans?: string[];
  demoUrl?: string | null;
  helpDocUrl?: string | null;
  sortOrder: number;
  isHighlighted?: boolean;
  isActive?: boolean;
}

export interface UpdateSoftwareFeatureDto {
  name?: string;
  description?: string;
  iconName?: string;
  category?: 'orders' | 'inventory' | 'production' | 'analytics' | 'customers' | 'products';
  availableInPlans?: string[];
  demoUrl?: string | null;
  helpDocUrl?: string | null;
  sortOrder?: number;
  isHighlighted?: boolean;
  isActive?: boolean;
}

@Injectable()
export class SoftwareFeaturesService {
  constructor(private readonly db: DatabaseService) {}

  async create(createDto: CreateSoftwareFeatureDto) {
    const [newFeature] = await this.db.database
      .insert(softwareFeaturesTable)
      .values({
        ...createDto,
        availableInPlans: createDto.availableInPlans || [],
        isHighlighted: createDto.isHighlighted ?? false,
        isActive: createDto.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.formatFeature(newFeature);
  }

  async findAll(onlyActive = false) {
    const whereCondition = onlyActive
      ? eq(softwareFeaturesTable.isActive, true)
      : undefined;

    const features = await this.db.database
      .select()
      .from(softwareFeaturesTable)
      .where(whereCondition)
      .orderBy(asc(softwareFeaturesTable.sortOrder));

    return features.map(feature => this.formatFeature(feature));
  }

  async findById(id: string) {
    const [feature] = await this.db.database
      .select()
      .from(softwareFeaturesTable)
      .where(eq(softwareFeaturesTable.id, id));

    if (!feature) {
      throw new NotFoundException(`Software feature with ID ${id} not found`);
    }

    return this.formatFeature(feature);
  }

  async findByName(name: string) {
    const [feature] = await this.db.database
      .select()
      .from(softwareFeaturesTable)
      .where(eq(softwareFeaturesTable.name, name));

    return feature ? this.formatFeature(feature) : null;
  }

  async findByCategory(category: string) {
    const features = await this.db.database
      .select()
      .from(softwareFeaturesTable)
      .where(
        and(
          eq(softwareFeaturesTable.category, category as any),
          eq(softwareFeaturesTable.isActive, true)
        )
      )
      .orderBy(asc(softwareFeaturesTable.sortOrder));

    return features.map(feature => this.formatFeature(feature));
  }

  async getHighlightedFeatures() {
    const features = await this.db.database
      .select()
      .from(softwareFeaturesTable)
      .where(
        and(
          eq(softwareFeaturesTable.isActive, true),
          eq(softwareFeaturesTable.isHighlighted, true)
        )
      )
      .orderBy(asc(softwareFeaturesTable.sortOrder));

    return features.map(feature => this.formatFeature(feature));
  }

  async getFeaturesForPlan(planId: string) {
    const allFeatures = await this.findAll(true);

    return allFeatures.filter(feature =>
      feature.availableInPlans.includes(planId)
    );
  }

  async getFeaturesForPlans(planIds: string[]) {
    const allFeatures = await this.findAll(true);

    return allFeatures.filter(feature =>
      feature.availableInPlans.some((planId: string) => planIds.includes(planId))
    );
  }

  async update(id: string, updateDto: UpdateSoftwareFeatureDto) {
    const existingFeature = await this.findById(id);

    const updateData: any = {
      ...updateDto,
      updatedAt: new Date(),
    };

    if (updateDto.availableInPlans) {
      updateData.availableInPlans = updateDto.availableInPlans;
    }

    const [updatedFeature] = await this.db.database
      .update(softwareFeaturesTable)
      .set(updateData)
      .where(eq(softwareFeaturesTable.id, id))
      .returning();

    return this.formatFeature(updatedFeature);
  }

  async setHighlighted(id: string, isHighlighted: boolean) {
    const existingFeature = await this.findById(id);

    const [updatedFeature] = await this.db.database
      .update(softwareFeaturesTable)
      .set({
        isHighlighted,
        updatedAt: new Date(),
      })
      .where(eq(softwareFeaturesTable.id, id))
      .returning();

    return this.formatFeature(updatedFeature);
  }

  async deactivate(id: string) {
    const existingFeature = await this.findById(id);

    const [deactivatedFeature] = await this.db.database
      .update(softwareFeaturesTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(softwareFeaturesTable.id, id))
      .returning();

    return this.formatFeature(deactivatedFeature);
  }

  async activate(id: string) {
    const existingFeature = await this.findById(id);

    const [activatedFeature] = await this.db.database
      .update(softwareFeaturesTable)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(softwareFeaturesTable.id, id))
      .returning();

    return this.formatFeature(activatedFeature);
  }

  async reorderFeatures(featureOrders: { id: string; sortOrder: number }[]) {
    const updatePromises = featureOrders.map(({ id, sortOrder }) =>
      this.db.database
        .update(softwareFeaturesTable)
        .set({
          sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(softwareFeaturesTable.id, id))
        .returning()
    );

    await Promise.all(updatePromises);

    return this.findAll();
  }

  async addFeatureToPlan(featureId: string, planId: string) {
    const feature = await this.findById(featureId);

    if (!feature.availableInPlans.includes(planId)) {
      const updatedPlans = [...feature.availableInPlans, planId];

      const [updatedFeature] = await this.db.database
        .update(softwareFeaturesTable)
        .set({
          availableInPlans: updatedPlans,
          updatedAt: new Date(),
        })
        .where(eq(softwareFeaturesTable.id, featureId))
        .returning();

      return this.formatFeature(updatedFeature);
    }

    return feature;
  }

  async removeFeatureFromPlan(featureId: string, planId: string) {
    const feature = await this.findById(featureId);

    if (feature.availableInPlans.includes(planId)) {
      const updatedPlans = feature.availableInPlans.filter((id: string) => id !== planId);

      const [updatedFeature] = await this.db.database
        .update(softwareFeaturesTable)
        .set({
          availableInPlans: updatedPlans,
          updatedAt: new Date(),
        })
        .where(eq(softwareFeaturesTable.id, featureId))
        .returning();

      return this.formatFeature(updatedFeature);
    }

    return feature;
  }

  async getFeaturesByCategories() {
    const features = await this.findAll(true);

    const byCategory: Record<string, any[]> = {};

    features.forEach(feature => {
      if (!byCategory[feature.category]) {
        byCategory[feature.category] = [];
      }
      byCategory[feature.category].push(feature);
    });

    return byCategory;
  }

  // Alias for backwards compatibility with the controller
  async getFeaturesByCategory(category: string) {
    const features = await this.db.database
      .select()
      .from(softwareFeaturesTable)
      .where(and(eq(softwareFeaturesTable.category, category as any), eq(softwareFeaturesTable.isActive, true)))
      .orderBy(asc(softwareFeaturesTable.sortOrder));

    return features.map(this.formatFeature);
  }

  // Method for getting all features
  async getAllFeatures() {
    return this.findAll(true);
  }

  // Method for getting feature categories
  async getFeatureCategories() {
    const categories = await this.db.database
      .selectDistinct({ category: softwareFeaturesTable.category })
      .from(softwareFeaturesTable)
      .where(eq(softwareFeaturesTable.isActive, true));

    return categories.map(row => row.category);
  }

  // Method for getting feature availability matrix
  async getFeatureAvailabilityMatrix() {
    const features = await this.findAll(true);

    const matrix: Record<string, string[]> = {};

    features.forEach(feature => {
      feature.availableInPlans.forEach((planId: string) => {
        if (!matrix[planId]) {
          matrix[planId] = [];
        }
        matrix[planId].push(feature.id);
      });
    });

    return matrix;
  }

  // Method for comparing features across plans
  async compareFeatures(planIds: string[]) {
    const features = await this.findAll(true);

    return features.map(feature => ({
      id: feature.id,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      availability: planIds.reduce((acc, planId) => {
        acc[planId] = feature.availableInPlans.includes(planId);
        return acc;
      }, {} as Record<string, boolean>)
    }));
  }

  // Alias for getFeaturesForPlan with different name
  async getFeaturesByPlanId(planId: string) {
    return this.getFeaturesForPlan(planId);
  }

  // Method for getting single feature by ID
  async getFeatureById(featureId: string) {
    return this.findById(featureId);
  }

  // Method for creating a feature
  async createFeature(createDto: CreateSoftwareFeatureDto) {
    return this.create(createDto);
  }

  // Method for updating a feature
  async updateFeature(featureId: string, updateDto: UpdateSoftwareFeatureDto) {
    return this.update(featureId, updateDto);
  }

  // Method for deleting/deactivating a feature
  async deleteFeature(featureId: string) {
    return this.deactivate(featureId);
  }

  // Method for seeding default features
  async seedDefaultFeatures() {
    // This would typically be handled by a dedicated seeding service
    // For now, return success message
    return { message: 'Default features seeding not implemented in this service' };
  }

  async getFeatureComparison(planIds: string[]) {
    const allFeatures = await this.findAll(true);

    return allFeatures.map(feature => ({
      id: feature.id,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      availability: planIds.map(planId => ({
        planId,
        included: feature.availableInPlans.includes(planId),
      })),
    }));
  }

  async searchFeatures(query: string) {
    const allFeatures = await this.findAll(true);

    const searchLower = query.toLowerCase();

    return allFeatures.filter(feature =>
      feature.name.toLowerCase().includes(searchLower) ||
      feature.description.toLowerCase().includes(searchLower) ||
      feature.category.toLowerCase().includes(searchLower)
    );
  }

  private formatFeature(feature: any) {
    return {
      ...feature,
      availableInPlans: typeof feature.availableInPlans === 'string'
        ? JSON.parse(feature.availableInPlans)
        : feature.availableInPlans,
    };
  }

  async getFeatureStats() {
    const features = await this.findAll();

    const stats = {
      total: features.length,
      active: features.filter(f => f.isActive).length,
      highlighted: features.filter(f => f.isHighlighted).length,
      byCategory: {} as Record<string, number>,
      withDemo: features.filter(f => f.demoUrl).length,
      withHelp: features.filter(f => f.helpDocUrl).length,
    };

    features.forEach(feature => {
      stats.byCategory[feature.category] = (stats.byCategory[feature.category] || 0) + 1;
    });

    return stats;
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { widgetConfigurations } from '../database/schemas/widget-configurations';
import { UpdateWidgetConfigDto } from './dto/widget-config.dto';

@Injectable()
export class WidgetsService {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Get widget configuration for a user
   * @param userId - User ID
   * @returns Widget configuration or throws NotFoundException
   */
  async getConfig(userId: string) {
    const db = this.database.database;

    const [config] = await db
      .select()
      .from(widgetConfigurations)
      .where(eq(widgetConfigurations.userId, userId))
      .limit(1);

    if (!config) {
      throw new NotFoundException('Widget configuration not found');
    }

    return {
      id: config.id,
      user_id: config.userId,
      layout_type: config.layoutType,
      widgets: config.widgets,
      created_at: config.createdAt,
      updated_at: config.updatedAt,
    };
  }

  /**
   * Update or create widget configuration for a user
   * @param userId - User ID
   * @param dto - Widget configuration data
   * @returns Updated widget configuration
   */
  async updateConfig(userId: string, dto: UpdateWidgetConfigDto) {
    const db = this.database.database;

    // Check if config exists
    const [existingConfig] = await db
      .select()
      .from(widgetConfigurations)
      .where(eq(widgetConfigurations.userId, userId))
      .limit(1);

    if (existingConfig) {
      // Update existing
      const [updated] = await db
        .update(widgetConfigurations)
        .set({
          layoutType: dto.layout_type,
          widgets: dto.widgets as unknown as typeof widgetConfigurations.widgets.dataType,
          updatedAt: new Date(),
        })
        .where(eq(widgetConfigurations.userId, userId))
        .returning();

      return {
        id: updated.id,
        user_id: updated.userId,
        layout_type: updated.layoutType,
        widgets: updated.widgets,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      };
    } else {
      // Create new
      const [created] = await db
        .insert(widgetConfigurations)
        .values({
          userId,
          layoutType: dto.layout_type,
          widgets: dto.widgets as unknown as typeof widgetConfigurations.widgets.dataType,
        })
        .returning();

      return {
        id: created.id,
        user_id: created.userId,
        layout_type: created.layoutType,
        widgets: created.widgets,
        created_at: created.createdAt,
        updated_at: created.updatedAt,
      };
    }
  }

  /**
   * Create default widget configuration for a new user
   * @param userId - User ID
   * @returns Created widget configuration
   */
  async createDefault(userId: string) {
    const db = this.database.database;

    const defaultWidgets = [
      {
        id: 'default-metrics',
        type: 'metrics' as const,
        position: { x: 0, y: 0, w: 2, h: 1 },
        config: {},
      },
      {
        id: 'default-orders',
        type: 'orders' as const,
        position: { x: 2, y: 0, w: 2, h: 2 },
        config: {},
      },
    ];

    const [created] = await db
      .insert(widgetConfigurations)
      .values({
        userId,
        layoutType: 'grid',
        widgets: defaultWidgets as unknown as typeof widgetConfigurations.widgets.dataType,
      })
      .returning();

    return {
      id: created.id,
      user_id: created.userId,
      layout_type: created.layoutType,
      widgets: created.widgets,
      created_at: created.createdAt,
      updated_at: created.updatedAt,
    };
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';
import { DatabaseService } from '../database/database.service';
import { inventoryItems, inventoryConsumptionTracking } from '../database/schemas';
import { notInArray, lt } from 'drizzle-orm';

@Injectable()
export class InventorySchedulerService {
  private readonly logger = new Logger(InventorySchedulerService.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Daily job to recalculate consumption metrics for all inventory items
   * Runs every day at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'daily-consumption-calculation',
    timeZone: 'America/New_York', // Adjust timezone as needed
  })
  async handleDailyConsumptionCalculation() {
    this.logger.log('Starting daily consumption calculation job...');

    try {
      // Get all active inventory items
      const items = await this.databaseService.database
        .select({ id: inventoryItems.id, name: inventoryItems.name })
        .from(inventoryItems);

      this.logger.log(`Found ${items.length} inventory items to process`);

      let successCount = 0;
      let failureCount = 0;

      // Process each item
      for (const item of items) {
        try {
          await this.inventoryService.recalculate(item.id);
          successCount++;
          this.logger.debug(`Recalculated consumption for item: ${item.name} (${item.id})`);
        } catch (error) {
          failureCount++;
          this.logger.error(
            `Failed to recalculate consumption for item: ${item.name} (${item.id})`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Daily consumption calculation completed. Success: ${successCount}, Failures: ${failureCount}`,
      );
    } catch (error) {
      this.logger.error('Daily consumption calculation job failed', error.stack);
    }
  }

  /**
   * Weekly cleanup job to:
   * 1. Remove orphaned consumption tracking records (inventory item no longer exists)
   * 2. Log items with stale calculations (not updated in 30+ days)
   * Runs every Sunday at 3:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-consumption-cleanup',
    timeZone: 'America/New_York',
  })
  async handleWeeklyCleanup() {
    this.logger.log('Starting weekly consumption data cleanup...');

    try {
      // 1. Remove orphaned tracking records (inventory items that no longer exist)
      const validItemIds = await this.databaseService.database
        .select({ id: inventoryItems.id })
        .from(inventoryItems);

      const validIds = validItemIds.map((item) => item.id);

      let orphanedCount = 0;
      if (validIds.length > 0) {
        // Delete tracking records where inventory item doesn't exist
        const deleted = await this.databaseService.database
          .delete(inventoryConsumptionTracking)
          .where(notInArray(inventoryConsumptionTracking.inventoryItemId, validIds))
          .returning({ id: inventoryConsumptionTracking.id });

        orphanedCount = deleted.length;
        if (orphanedCount > 0) {
          this.logger.warn(`Removed ${orphanedCount} orphaned consumption tracking records`);
        }
      } else {
        // If no inventory items exist, clean up all tracking records
        const deleted = await this.databaseService.database
          .delete(inventoryConsumptionTracking)
          .returning({ id: inventoryConsumptionTracking.id });

        orphanedCount = deleted.length;
        if (orphanedCount > 0) {
          this.logger.warn(`Removed ${orphanedCount} orphaned consumption tracking records (no inventory items exist)`);
        }
      }

      // 2. Log items with stale calculations (not updated in 30+ days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const staleRecords = await this.databaseService.database
        .select({
          inventoryItemId: inventoryConsumptionTracking.inventoryItemId,
          lastCalculatedAt: inventoryConsumptionTracking.lastCalculatedAt,
        })
        .from(inventoryConsumptionTracking)
        .where(lt(inventoryConsumptionTracking.lastCalculatedAt, thirtyDaysAgo));

      if (staleRecords.length > 0) {
        this.logger.warn(
          `Found ${staleRecords.length} inventory items with stale consumption data (>30 days old). ` +
            `Consider running recalculation for these items.`,
        );
      }

      this.logger.log(
        `Weekly cleanup completed. Orphaned records removed: ${orphanedCount}, Stale records found: ${staleRecords.length}`,
      );
    } catch (error) {
      this.logger.error('Weekly cleanup job failed', error.stack);
    }
  }
}

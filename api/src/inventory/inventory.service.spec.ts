import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { DatabaseService } from '../database/database.service';

describe('InventoryService', () => {
  let service: InventoryService;

  // Mock database service
  const mockDatabaseService = {
    database: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInventory', () => {
    it('should return all inventory items without filters', async () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Flour',
          currentStock: '100',
          minimumStock: '20',
          unit: 'kg',
          category: 'ingredient',
        },
        {
          id: 'item-2',
          name: 'Sugar',
          currentStock: '50',
          minimumStock: '10',
          unit: 'kg',
          category: 'ingredient',
        },
      ];

      const mockTracking = [
        {
          inventoryItemId: 'item-1',
          avgDailyConsumption: '10',
          customReorderThreshold: null,
          customLeadTimeDays: null,
        },
      ];

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockItems),
        }),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue(mockTracking),
      });

      const result = await service.getInventory(false);

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('item-1');
      expect(result[0]!.name).toBe('Flour');
      expect(result[0]!.current_stock).toBe(100);
      expect(result[0]!.consumption_tracking).toBeDefined();
      expect(result[1]!.consumption_tracking).toBeNull();
    });

    it('should filter by category', async () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Box',
          currentStock: '100',
          minimumStock: '20',
          unit: 'units',
          category: 'packaging',
        },
      ];

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockItems),
        }),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getInventory(false, 'packaging');

      expect(result).toHaveLength(1);
      expect(result[0]!.category).toBe('packaging');
    });

    it('should filter low stock items when lowStockOnly is true', async () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Flour',
          currentStock: '5', // Low stock
          minimumStock: '20',
          unit: 'kg',
          category: 'ingredient',
        },
        {
          id: 'item-2',
          name: 'Sugar',
          currentStock: '100', // High stock
          minimumStock: '10',
          unit: 'kg',
          category: 'ingredient',
        },
      ];

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockItems),
        }),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getInventory(true);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('item-1');
      expect(result[0]!.low_stock).toBe(true);
    });

    it('should calculate days_of_supply_remaining correctly', async () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Flour',
          currentStock: '100',
          minimumStock: '20',
          unit: 'kg',
          category: 'ingredient',
        },
      ];

      const mockTracking = [
        {
          inventoryItemId: 'item-1',
          avgDailyConsumption: '10',
          customReorderThreshold: null,
          customLeadTimeDays: null,
        },
      ];

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockItems),
        }),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue(mockTracking),
      });

      const result = await service.getInventory(false);

      expect(result[0]!.consumption_tracking?.days_of_supply_remaining).toBe(
        10,
      );
    });
  });

  describe('getConsumptionTracking', () => {
    it('should return consumption tracking data for an item', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockTracking = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
        avgDailyConsumption: '10',
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date('2025-01-01'),
        calculationMethod: 'historical_orders',
        customReorderThreshold: null,
        customLeadTimeDays: null,
        sampleSize: 10,
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockTracking]),
            }),
          }),
        });

      const result = await service.getConsumptionTracking('item-1');

      expect(result.id).toBe('tracking-1');
      expect(result.avg_daily_consumption).toBe(10);
      expect(result.days_of_supply_remaining).toBe(10);
      expect(result.predicted_stockout_date).toBeDefined();
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.getConsumptionTracking('invalid-id'),
      ).rejects.toThrow('Inventory item not found');
    });

    it('should throw NotFoundException if no tracking data exists', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      await expect(service.getConsumptionTracking('item-1')).rejects.toThrow(
        'No consumption tracking data found',
      );
    });

    it('should return 999 days remaining when consumption is zero', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockTracking = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
        avgDailyConsumption: '0',
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date('2025-01-01'),
        calculationMethod: 'manual',
        customReorderThreshold: null,
        customLeadTimeDays: null,
        sampleSize: 0,
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockTracking]),
            }),
          }),
        });

      const result = await service.getConsumptionTracking('item-1');

      expect(result.days_of_supply_remaining).toBe(999);
      expect(result.predicted_stockout_date).toBeNull();
    });
  });

  describe('setCustomThreshold', () => {
    it('should update existing tracking record', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockExisting = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
        avgDailyConsumption: '10',
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date(),
        calculationMethod: 'historical_orders',
        customReorderThreshold: null,
        customLeadTimeDays: null,
        sampleSize: 10,
      };

      const mockUpdated = {
        ...mockExisting,
        customReorderThreshold: '50',
        customLeadTimeDays: 5,
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExisting]),
            }),
          }),
        });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.setCustomThreshold('item-1', {
        custom_reorder_threshold: 50,
        custom_lead_time_days: 5,
      });

      expect(result.custom_reorder_threshold).toBe(50);
      expect(result.custom_lead_time_days).toBe(5);
    });

    it('should create new tracking record if none exists', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockCreated = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
        avgDailyConsumption: '0',
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date(),
        calculationMethod: 'manual',
        customReorderThreshold: '30',
        customLeadTimeDays: null,
        sampleSize: 0,
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await service.setCustomThreshold('item-1', {
        custom_reorder_threshold: 30,
      });

      expect(result.custom_reorder_threshold).toBe(30);
      expect(result.calculation_method).toBe('manual');
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.setCustomThreshold('invalid-id', {
          custom_reorder_threshold: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if update fails', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockExisting = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExisting]),
            }),
          }),
        });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.setCustomThreshold('item-1', {
          custom_reorder_threshold: 50,
        }),
      ).rejects.toThrow('Failed to update consumption tracking');
    });
  });

  describe('deleteCustomThreshold', () => {
    it('should clear custom threshold for tracking record', async () => {
      const mockTracking = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
      };

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTracking]),
          }),
        }),
      });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await service.deleteCustomThreshold('item-1');

      expect(mockDatabaseService.database.update).toHaveBeenCalled();
    });

    it('should do nothing if no tracking record exists', async () => {
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await service.deleteCustomThreshold('item-1');

      expect(mockDatabaseService.database.update).not.toHaveBeenCalled();
    });
  });

  describe('recalculate', () => {
    // Helper to create a chainable mock for the consumption data query with multiple joins
    const createConsumptionQueryMock = (resolvedData: any[]) => ({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockResolvedValue(resolvedData),
                }),
              }),
            }),
          }),
        }),
      }),
    });

    it('should calculate consumption from recent orders', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      // Mock consumption data: each row represents an order of a product that uses this ingredient
      // Consumption = orderQuantity * ingredientQuantity / recipeYield
      const mockConsumptionData = [
        {
          orderQuantity: 2,
          ingredientQuantity: '0.5',
          recipeYield: 1,
          orderDate: new Date(),
        }, // 2 * 0.5 / 1 = 1.0
        {
          orderQuantity: 3,
          ingredientQuantity: '0.5',
          recipeYield: 1,
          orderDate: new Date(),
        }, // 3 * 0.5 / 1 = 1.5
        {
          orderQuantity: 4,
          ingredientQuantity: '0.5',
          recipeYield: 1,
          orderDate: new Date(),
        }, // 4 * 0.5 / 1 = 2.0
      ];
      // Total = 4.5, avg daily = 4.5 / 7 = 0.642857...

      const mockExisting = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
      };

      const mockUpdated = {
        ...mockExisting,
        avgDailyConsumption: '0.642857142857143',
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date(),
        calculationMethod: 'historical_orders',
        sampleSize: 3,
        customReorderThreshold: null,
        customLeadTimeDays: null,
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce(createConsumptionQueryMock(mockConsumptionData))
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExisting]),
            }),
          }),
        });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.recalculate('item-1');

      expect(result.calculation_method).toBe('historical_orders');
      expect(result.sample_size).toBe(3);
      expect(result.avg_daily_consumption).toBeCloseTo(0.64, 2);
    });

    it('should create tracking record if none exists', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      // One order: 5 units of product, recipe uses 0.2kg flour per unit
      const mockConsumptionData = [
        {
          orderQuantity: 5,
          ingredientQuantity: '0.2',
          recipeYield: 1,
          orderDate: new Date(),
        }, // 5 * 0.2 / 1 = 1.0
      ];

      const mockCreated = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
        avgDailyConsumption: '0.142857142857143', // 1.0 / 7
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date(),
        calculationMethod: 'historical_orders',
        sampleSize: 1,
        customReorderThreshold: null,
        customLeadTimeDays: null,
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce(createConsumptionQueryMock(mockConsumptionData))
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await service.recalculate('item-1');

      expect(result.calculation_method).toBe('historical_orders');
      expect(result.sample_size).toBe(1);
      expect(result.avg_daily_consumption).toBeCloseTo(0.14, 2);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.recalculate('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle zero orders in calculation period', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockExisting = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
      };

      const mockUpdated = {
        ...mockExisting,
        avgDailyConsumption: '0',
        sampleSize: 0,
        calculationMethod: 'historical_orders',
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date(),
        customReorderThreshold: null,
        customLeadTimeDays: null,
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockItem]),
            }),
          }),
        })
        .mockReturnValueOnce(createConsumptionQueryMock([]))
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExisting]),
            }),
          }),
        });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.recalculate('item-1');

      expect(result.avg_daily_consumption).toBe(0);
      expect(result.sample_size).toBe(0);
    });
  });

  describe('private helper methods via public methods', () => {
    describe('calculateLowStock (via getInventory)', () => {
      it('should use minimum stock threshold when no tracking exists', async () => {
        const mockItems = [
          {
            id: 'item-1',
            name: 'Flour',
            currentStock: '15', // Below minimum of 20
            minimumStock: '20',
            unit: 'kg',
            category: 'ingredient',
          },
        ];

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockItems),
          }),
        });

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockResolvedValue([]),
        });

        const result = await service.getInventory(false);

        expect(result[0]!.low_stock).toBe(true);
      });

      it('should use custom threshold when set', async () => {
        const mockItems = [
          {
            id: 'item-1',
            name: 'Flour',
            currentStock: '40',
            minimumStock: '20',
            unit: 'kg',
            category: 'ingredient',
          },
        ];

        const mockTracking = [
          {
            inventoryItemId: 'item-1',
            avgDailyConsumption: '5',
            customReorderThreshold: '50', // Item is below 50
            customLeadTimeDays: null,
          },
        ];

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockItems),
          }),
        });

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockResolvedValue(mockTracking),
        });

        const result = await service.getInventory(false);

        expect(result[0]!.low_stock).toBe(true);
      });

      it('should use predictive calculation when tracking exists', async () => {
        const mockItems = [
          {
            id: 'item-1',
            name: 'Flour',
            currentStock: '30', // 30 / 10 = 3 days remaining < (3 lead + 1 buffer)
            minimumStock: '20',
            unit: 'kg',
            category: 'ingredient',
          },
        ];

        const mockTracking = [
          {
            inventoryItemId: 'item-1',
            avgDailyConsumption: '10',
            customReorderThreshold: null,
            customLeadTimeDays: null,
          },
        ];

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockItems),
          }),
        });

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockResolvedValue(mockTracking),
        });

        const result = await service.getInventory(false);

        expect(result[0]!.low_stock).toBe(true);
      });

      it('should not flag as low stock when consumption is zero', async () => {
        const mockItems = [
          {
            id: 'item-1',
            name: 'Flour',
            currentStock: '5',
            minimumStock: '20',
            unit: 'kg',
            category: 'ingredient',
          },
        ];

        const mockTracking = [
          {
            inventoryItemId: 'item-1',
            avgDailyConsumption: '0',
            customReorderThreshold: null,
            customLeadTimeDays: null,
          },
        ];

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockItems),
          }),
        });

        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockResolvedValue(mockTracking),
        });

        const result = await service.getInventory(false);

        expect(result[0]!.low_stock).toBe(false);
      });
    });

    describe('calculateStockoutDate (via getConsumptionTracking)', () => {
      it('should calculate correct stockout date', async () => {
        const mockItem = {
          id: 'item-1',
          currentStock: '100', // 100 / 10 = 10 days
        };

        const mockTracking = {
          id: 'tracking-1',
          inventoryItemId: 'item-1',
          avgDailyConsumption: '10',
          calculationPeriodDays: 7,
          lastCalculatedAt: new Date(),
          calculationMethod: 'historical_orders',
          customReorderThreshold: null,
          customLeadTimeDays: null,
          sampleSize: 10,
        };

        mockDatabaseService.database.select
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockItem]),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockTracking]),
              }),
            }),
          });

        const result = await service.getConsumptionTracking('item-1');

        expect(result.predicted_stockout_date).toBeDefined();
        expect(result.predicted_stockout_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Verify it's approximately 10 days in the future
        const stockoutDate = new Date(result.predicted_stockout_date!);
        const today = new Date();
        const daysDiff = Math.ceil(
          (stockoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBeGreaterThanOrEqual(9);
        expect(daysDiff).toBeLessThanOrEqual(11);
      });

      it('should return null for stockout date when consumption is zero', async () => {
        const mockItem = {
          id: 'item-1',
          currentStock: '100',
        };

        const mockTracking = {
          id: 'tracking-1',
          inventoryItemId: 'item-1',
          avgDailyConsumption: '0',
          calculationPeriodDays: 7,
          lastCalculatedAt: new Date(),
          calculationMethod: 'manual',
          customReorderThreshold: null,
          customLeadTimeDays: null,
          sampleSize: 0,
        };

        mockDatabaseService.database.select
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockItem]),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockTracking]),
              }),
            }),
          });

        const result = await service.getConsumptionTracking('item-1');

        expect(result.predicted_stockout_date).toBeNull();
      });
    });
  });

  describe('getInventoryItem', () => {
    it('should return an inventory item by id', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Flour',
        category: 'ingredient',
        unit: 'kg',
        currentStock: '100',
        minimumStock: '20',
        reorderPoint: '30',
        reorderQuantity: '50',
        costPerUnit: '2.50',
        supplier: 'Mill Co',
        location: 'Storage A',
        notes: 'High quality wheat flour',
        expirationDate: null,
        lastRestocked: new Date('2025-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockItem]),
          }),
        }),
      });

      const result = await service.getInventoryItem('item-1');

      expect(result.id).toBe('item-1');
      expect(result.name).toBe('Flour');
      expect(result.currentStock).toBe(100);
      expect(result.minimumStock).toBe(20);
      expect(result.costPerUnit).toBe(2.5);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getInventoryItem('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createInventoryItem', () => {
    it('should create a new inventory item', async () => {
      const createDto = {
        name: 'Sugar',
        category: 'ingredient' as const,
        unit: 'kg' as const,
        currentStock: 50,
        minimumStock: 10,
        reorderPoint: 15,
        reorderQuantity: 30,
        costPerUnit: 1.5,
        supplier: 'Sugar Co',
        location: 'Storage B',
        notes: 'White sugar',
      };

      const mockCreated = {
        id: 'item-new',
        name: 'Sugar',
        category: 'ingredient',
        unit: 'kg',
        currentStock: '50',
        minimumStock: '10',
        reorderPoint: '15',
        reorderQuantity: '30',
        costPerUnit: '1.50',
        supplier: 'Sugar Co',
        location: 'Storage B',
        notes: 'White sugar',
        expirationDate: null,
        lastRestocked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await service.createInventoryItem(createDto);

      expect(result.id).toBe('item-new');
      expect(result.name).toBe('Sugar');
      expect(result.currentStock).toBe(50);
      expect(result.costPerUnit).toBe(1.5);
    });

    it('should throw error if creation fails', async () => {
      const createDto = {
        name: 'Sugar',
        category: 'ingredient' as const,
        unit: 'kg' as const,
        currentStock: 50,
        minimumStock: 10,
        reorderPoint: 15,
        reorderQuantity: 30,
        costPerUnit: 1.5,
      };

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.createInventoryItem(createDto)).rejects.toThrow(
        'Failed to create inventory item',
      );
    });
  });

  describe('updateInventoryItem', () => {
    it('should update an existing inventory item', async () => {
      const mockExisting = {
        id: 'item-1',
        name: 'Flour',
        currentStock: '100',
      };

      const updateDto = {
        name: 'Organic Flour',
        currentStock: 150,
      };

      const mockUpdated = {
        id: 'item-1',
        name: 'Organic Flour',
        category: 'ingredient',
        unit: 'kg',
        currentStock: '150',
        minimumStock: '20',
        reorderPoint: '30',
        reorderQuantity: '50',
        costPerUnit: '3.00',
        supplier: 'Organic Mill',
        location: 'Storage A',
        notes: null,
        expirationDate: null,
        lastRestocked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExisting]),
          }),
        }),
      });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.updateInventoryItem('item-1', updateDto);

      expect(result.id).toBe('item-1');
      expect(result.name).toBe('Organic Flour');
      expect(result.currentStock).toBe(150);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.updateInventoryItem('invalid-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if update fails', async () => {
      const mockExisting = {
        id: 'item-1',
        name: 'Flour',
      };

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExisting]),
          }),
        }),
      });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.updateInventoryItem('item-1', { name: 'New Name' }),
      ).rejects.toThrow('Failed to update inventory item');
    });

    it('should handle partial updates correctly', async () => {
      const mockExisting = {
        id: 'item-1',
        name: 'Flour',
      };

      const mockUpdated = {
        id: 'item-1',
        name: 'Flour',
        category: 'ingredient',
        unit: 'kg',
        currentStock: '200',
        minimumStock: '20',
        reorderPoint: '30',
        reorderQuantity: '50',
        costPerUnit: '2.50',
        supplier: null,
        location: null,
        notes: null,
        expirationDate: null,
        lastRestocked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExisting]),
          }),
        }),
      });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      const result = await service.updateInventoryItem('item-1', {
        currentStock: 200,
      });

      expect(result.name).toBe('Flour'); // Unchanged
      expect(result.currentStock).toBe(200); // Updated
    });
  });

  describe('deleteInventoryItem', () => {
    it('should delete an inventory item successfully', async () => {
      const mockExisting = {
        id: 'item-1',
        name: 'Flour',
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExisting]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // Not used in any recipes
            }),
          }),
        });

      mockDatabaseService.database.delete
        .mockReturnValueOnce({
          where: jest.fn().mockResolvedValue(undefined), // Delete tracking
        })
        .mockReturnValueOnce({
          where: jest.fn().mockResolvedValue(undefined), // Delete item
        });

      await expect(
        service.deleteInventoryItem('item-1'),
      ).resolves.not.toThrow();
      expect(mockDatabaseService.database.delete).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.deleteInventoryItem('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if item is used in recipes', async () => {
      const mockExisting = {
        id: 'item-1',
        name: 'Flour',
      };

      const mockRecipeIngredient = {
        id: 'recipe-ing-1',
        recipeId: 'recipe-1',
        ingredientId: 'item-1',
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExisting]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockRecipeIngredient]), // Used in recipes
            }),
          }),
        });

      await expect(service.deleteInventoryItem('item-1')).rejects.toThrow(
        /Cannot delete inventory item because it is used in one or more recipes/,
      );
    });

    it('should delete associated consumption tracking before deleting item', async () => {
      const mockExisting = {
        id: 'item-1',
        name: 'Flour',
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExisting]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // Not used in recipes
            }),
          }),
        });

      const deleteTrackingMock = jest.fn().mockResolvedValue(undefined);
      const deleteItemMock = jest.fn().mockResolvedValue(undefined);

      mockDatabaseService.database.delete
        .mockReturnValueOnce({
          where: deleteTrackingMock,
        })
        .mockReturnValueOnce({
          where: deleteItemMock,
        });

      await service.deleteInventoryItem('item-1');

      // Verify delete was called twice (tracking first, then item)
      expect(mockDatabaseService.database.delete).toHaveBeenCalledTimes(2);
    });
  });
});

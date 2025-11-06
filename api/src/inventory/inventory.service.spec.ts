import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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

      expect(result[0]!.consumption_tracking?.days_of_supply_remaining).toBe(10);
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

      await expect(service.getConsumptionTracking('invalid-id')).rejects.toThrow(
        'Inventory item not found',
      );
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
    it('should calculate consumption from recent orders', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockOrders = [
        { quantity: 10, orderDate: new Date() },
        { quantity: 15, orderDate: new Date() },
        { quantity: 20, orderDate: new Date() },
      ];

      const mockExisting = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
      };

      const mockUpdated = {
        ...mockExisting,
        avgDailyConsumption: '6.428571428571429', // (10+15+20)/7
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date(),
        calculationMethod: 'historical_orders',
        sampleSize: 3,
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
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue(mockOrders),
              }),
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

      const result = await service.recalculate('item-1');

      expect(result.calculation_method).toBe('historical_orders');
      expect(result.sample_size).toBe(3);
      expect(result.avg_daily_consumption).toBeCloseTo(6.43, 2);
    });

    it('should create tracking record if none exists', async () => {
      const mockItem = {
        id: 'item-1',
        currentStock: '100',
      };

      const mockOrders = [{ quantity: 35, orderDate: new Date() }];

      const mockCreated = {
        id: 'tracking-1',
        inventoryItemId: 'item-1',
        avgDailyConsumption: '5',
        calculationPeriodDays: 7,
        lastCalculatedAt: new Date(),
        calculationMethod: 'historical_orders',
        sampleSize: 1,
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
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue(mockOrders),
              }),
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

      const result = await service.recalculate('item-1');

      expect(result.calculation_method).toBe('historical_orders');
      expect(result.sample_size).toBe(1);
      expect(result.avg_daily_consumption).toBe(5);
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
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue([]),
              }),
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
});

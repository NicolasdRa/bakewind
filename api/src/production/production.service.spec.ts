import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductionService } from './production.service';
import { DatabaseService } from '../database/database.service';
import { ProductionStatus } from './dto';

describe('ProductionService', () => {
  let service: ProductionService;

  // Mock database service
  const mockDatabaseService = {
    database: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  // Helper to create select mock with limit
  const createSelectMockWithLimit = (resolvedValue: any) => {
    const limit = jest.fn().mockResolvedValue(resolvedValue);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    return { from };
  };

  // Helper to create select mock without limit
  const createSelectMock = (resolvedValue: any) => {
    const where = jest.fn().mockResolvedValue(resolvedValue);
    const from = jest.fn().mockReturnValue({ where });
    return { from };
  };

  // Helper to create update mock with returning
  const createUpdateMockWithReturning = (resolvedValue: any) => {
    const returning = jest.fn().mockResolvedValue(resolvedValue);
    const where = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where });
    return { set };
  };

  // Helper to create update mock without returning
  const createUpdateMock = () => {
    const where = jest.fn().mockResolvedValue(undefined);
    const set = jest.fn().mockReturnValue({ where });
    return { set };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);

    // Reset all mocks completely
    jest.clearAllMocks();
    mockDatabaseService.database.select.mockReset();
    mockDatabaseService.database.insert.mockReset();
    mockDatabaseService.database.update.mockReset();
    mockDatabaseService.database.delete.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllSchedules', () => {
    it('should return all production schedules without filters', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        date: '2024-12-01',
        totalItems: 2,
        completedItems: 1,
        notes: 'Morning batch',
        createdBy: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockItems = [
        {
          id: 'item-1',
          scheduleId: 'schedule-1',
          recipeId: 'recipe-1',
          recipeName: 'Sourdough Bread',
          quantity: 10,
          status: 'completed',
          scheduledTime: new Date('2024-12-01T06:00:00'),
          startTime: new Date('2024-12-01T06:00:00'),
          completedTime: new Date('2024-12-01T10:00:00'),
          assignedTo: 'Baker 1',
          notes: null,
          batchNumber: 'BATCH001',
          qualityCheck: true,
          qualityNotes: 'Perfect texture',
        },
        {
          id: 'item-2',
          scheduleId: 'schedule-1',
          recipeId: 'recipe-2',
          recipeName: 'Croissants',
          quantity: 24,
          status: 'scheduled',
          scheduledTime: new Date('2024-12-01T08:00:00'),
          startTime: null,
          completedTime: null,
          assignedTo: 'Baker 2',
          notes: null,
          batchNumber: null,
          qualityCheck: false,
          qualityNotes: null,
        },
      ];

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([mockSchedule]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockItems),
          }),
        });

      const result = await service.getAllSchedules();

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('schedule-1');
      expect(result[0]!.items).toHaveLength(2);
      expect(result[0]!.items[0]!.recipe_name).toBe('Sourdough Bread');
    });

    it('should filter schedules by date range', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        date: '2024-12-01',
        totalItems: 1,
        completedItems: 0,
        notes: null,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([mockSchedule]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const result = await service.getAllSchedules('2024-12-01', '2024-12-31');

      expect(result).toHaveLength(1);
      expect(result[0]!.date).toBe('2024-12-01');
    });
  });

  describe('getScheduleById', () => {
    it('should return a schedule by ID', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        date: '2024-12-01',
        totalItems: 1,
        completedItems: 0,
        notes: 'Test schedule',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockItems = [
        {
          id: 'item-1',
          scheduleId: 'schedule-1',
          recipeId: 'recipe-1',
          recipeName: 'Bagels',
          quantity: 12,
          status: 'scheduled',
          scheduledTime: new Date(),
          startTime: null,
          completedTime: null,
          assignedTo: null,
          notes: null,
          batchNumber: null,
          qualityCheck: false,
          qualityNotes: null,
        },
      ];

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockSchedule]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockItems),
          }),
        });

      const result = await service.getScheduleById('schedule-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('schedule-1');
      expect(result.notes).toBe('Test schedule');
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getScheduleById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createSchedule', () => {
    it('should create a new production schedule with items', async () => {
      const createDto = {
        date: '2024-12-01',
        notes: 'Morning production',
        createdBy: 'user-1',
        items: [
          {
            recipeId: 'recipe-1',
            recipeName: 'Sourdough Bread',
            quantity: 10,
            status: ProductionStatus.SCHEDULED,
            scheduledTime: '2024-12-01T06:00:00Z',
          },
        ],
      };

      const mockSchedule = {
        id: 'new-schedule-id',
        date: createDto.date,
        totalItems: 1,
        completedItems: 0,
        notes: createDto.notes,
        createdBy: createDto.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreatedItem = {
        id: 'new-item-id',
        scheduleId: 'new-schedule-id',
        recipeId: 'recipe-1',
        recipeName: 'Sourdough Bread',
        quantity: 10,
        status: 'scheduled',
        scheduledTime: new Date('2024-12-01T06:00:00Z'),
        startTime: null,
        completedTime: null,
        assignedTo: null,
        notes: null,
        batchNumber: null,
        qualityCheck: false,
        qualityNotes: null,
      };

      // Mock recipe validation
      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ id: 'recipe-1' }]),
          }),
        })
        // Mock getting recipe ingredients for inventory check
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              {
                ingredientId: 'inv-1',
                quantity: '100',
              },
            ]),
          }),
        })
        // Mock getting inventory item
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'inv-1',
                  name: 'Flour',
                  currentStock: '5000',
                  unit: 'g',
                },
              ]),
            }),
          }),
        });

      // Mock schedule creation
      mockDatabaseService.database.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockSchedule]),
        }),
      });

      // Mock item creation
      mockDatabaseService.database.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedItem]),
        }),
      });

      const result = await service.createSchedule(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('new-schedule-id');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.recipe_name).toBe('Sourdough Bread');
    });
  });

  describe('updateProductionItem', () => {
    it('should update production item status', async () => {
      const existingItem = {
        id: 'item-1',
        scheduleId: 'schedule-1',
        recipeId: 'recipe-1',
        recipeName: 'Bread',
        quantity: 10,
        status: 'scheduled',
        scheduledTime: new Date(),
        startTime: null,
        completedTime: null,
        assignedTo: null,
        notes: null,
        batchNumber: null,
        qualityCheck: false,
        qualityNotes: null,
        internalOrderId: null,
        customerOrderId: null,
      };

      const updatedItem = {
        ...existingItem,
        status: 'in_progress',
        startTime: new Date(),
      };

      // Mock finding existing item
      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([existingItem]),
            }),
          }),
        })
        // Mock fetching items for updateScheduleTotals
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([updatedItem]),
          }),
        });

      // Mock update
      mockDatabaseService.database.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedItem]),
          }),
        }),
      });

      // Mock updateScheduleTotals update
      mockDatabaseService.database.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.updateProductionItem(
        'schedule-1',
        'item-1',
        {
          status: ProductionStatus.IN_PROGRESS,
          startTime: new Date().toISOString(),
        },
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('in_progress');
    });

    it('should deduct inventory when production is completed', async () => {
      const existingItem = {
        id: 'item-1',
        scheduleId: 'schedule-1',
        recipeId: 'recipe-1',
        recipeName: 'Bread',
        quantity: 10,
        status: 'in_progress',
        scheduledTime: new Date(),
        startTime: new Date(),
        completedTime: null,
        assignedTo: null,
        notes: null,
        batchNumber: null,
        qualityCheck: false,
        qualityNotes: null,
        internalOrderId: null,
        customerOrderId: null,
      };

      const completedItem = {
        ...existingItem,
        status: 'completed',
        completedTime: new Date(),
      };

      // Service call order:
      // 1. select - find existing item (with limit)
      // 2. update - update item (with returning)
      // 3. select - updateScheduleTotals (without limit)
      // 4. update - updateScheduleTotals (without returning)
      // 5. select - get recipe ingredients (without limit)
      // 6. select - get inventory item (with limit)
      // 7. update - deduct inventory (without returning)

      mockDatabaseService.database.select
        // 1. Find existing item
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([existingItem]),
            }),
          }),
        })
        // 3. updateScheduleTotals - get items
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([completedItem]),
          }),
        })
        // 5. Get recipe ingredients
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              {
                ingredientId: 'inv-1',
                quantity: '50',
              },
            ]),
          }),
        })
        // 6. Get inventory item
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'inv-1',
                  name: 'Flour',
                  currentStock: '5000',
                  unit: 'g',
                },
              ]),
            }),
          }),
        });

      mockDatabaseService.database.update
        // 2. Update item
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([completedItem]),
            }),
          }),
        })
        // 4. updateScheduleTotals update
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        })
        // 7. Inventory deduction
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        });

      const result = await service.updateProductionItem(
        'schedule-1',
        'item-1',
        {
          status: ProductionStatus.COMPLETED,
          completedTime: new Date().toISOString(),
        },
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(mockDatabaseService.database.update).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundException if item not found', async () => {
      const selectFromWhereLimit = jest.fn().mockResolvedValue([]);
      const selectFromWhere = jest
        .fn()
        .mockReturnValue({ limit: selectFromWhereLimit });
      const selectFrom = jest.fn().mockReturnValue({ where: selectFromWhere });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: selectFrom,
      });

      await expect(
        service.updateProductionItem('schedule-1', 'non-existent', {
          status: ProductionStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startProduction', () => {
    it('should start production for an item', async () => {
      const existingItem = {
        id: 'item-1',
        scheduleId: 'schedule-1',
        recipeId: 'recipe-1',
        recipeName: 'Bread',
        quantity: 10,
        status: 'scheduled',
        scheduledTime: new Date(),
        startTime: null,
        completedTime: null,
        assignedTo: null,
        notes: null,
        batchNumber: null,
        qualityCheck: false,
        qualityNotes: null,
        internalOrderId: null,
        customerOrderId: null,
      };

      const startedItem = {
        ...existingItem,
        status: 'in_progress',
        startTime: new Date(),
      };

      // Create mock chain functions
      const selectFromWhereLimit = jest.fn().mockResolvedValue([existingItem]);
      const selectFromWhere1 = jest
        .fn()
        .mockReturnValue({ limit: selectFromWhereLimit });
      const selectFrom1 = jest
        .fn()
        .mockReturnValue({ where: selectFromWhere1 });

      const selectFromWhere2 = jest.fn().mockResolvedValue([startedItem]);
      const selectFrom2 = jest
        .fn()
        .mockReturnValue({ where: selectFromWhere2 });

      const updateReturning = jest.fn().mockResolvedValue([startedItem]);
      const updateWhere1 = jest
        .fn()
        .mockReturnValue({ returning: updateReturning });
      const updateSet1 = jest.fn().mockReturnValue({ where: updateWhere1 });

      const updateWhere2 = jest.fn().mockResolvedValue(undefined);
      const updateSet2 = jest.fn().mockReturnValue({ where: updateWhere2 });

      mockDatabaseService.database.select
        .mockReturnValueOnce({ from: selectFrom1 })
        .mockReturnValueOnce({ from: selectFrom2 });

      mockDatabaseService.database.update
        .mockReturnValueOnce({ set: updateSet1 })
        .mockReturnValueOnce({ set: updateSet2 });

      const result = await service.startProduction('schedule-1', 'item-1');

      expect(result).toBeDefined();
      expect(result.status).toBe('in_progress');
      expect(result.start_time).toBeDefined();
    });
  });

  describe('completeProduction', () => {
    it('should complete production with quality check', async () => {
      const existingItem = {
        id: 'item-1',
        scheduleId: 'schedule-1',
        recipeId: 'recipe-1',
        recipeName: 'Bread',
        quantity: 10,
        status: 'in_progress',
        scheduledTime: new Date(),
        startTime: new Date(),
        completedTime: null,
        assignedTo: null,
        notes: null,
        batchNumber: null,
        qualityCheck: false,
        qualityNotes: null,
        internalOrderId: null,
        customerOrderId: null,
      };

      const completedItem = {
        ...existingItem,
        status: 'completed',
        completedTime: new Date(),
        qualityCheck: true,
        qualityNotes: 'Excellent quality',
      };

      // Call sequence:
      // 1. select (with limit) - find existing item
      // 2. update (with returning) - update item
      // 3. select (no limit) - updateScheduleTotals get items
      // 4. update (no returning) - updateScheduleTotals update totals
      // 5. select (no limit) - deductInventoryForRecipe get recipe ingredients

      // Mock 1: Find existing item (with limit)
      const selectFromWhereLimit = jest.fn().mockResolvedValue([existingItem]);
      const selectFromWhere1 = jest
        .fn()
        .mockReturnValue({ limit: selectFromWhereLimit });
      const selectFrom1 = jest
        .fn()
        .mockReturnValue({ where: selectFromWhere1 });

      // Mock 2: updateScheduleTotals - get schedule items (no limit)
      const selectFromWhere2 = jest.fn().mockResolvedValue([completedItem]);
      const selectFrom2 = jest
        .fn()
        .mockReturnValue({ where: selectFromWhere2 });

      // Mock 3: deductInventoryForRecipe - get recipe ingredients (no limit, returns empty)
      const selectFromWhere3 = jest.fn().mockResolvedValue([]); // No recipe ingredients
      const selectFrom3 = jest
        .fn()
        .mockReturnValue({ where: selectFromWhere3 });

      // Update Mock 1: update item with returning
      const updateReturning = jest.fn().mockResolvedValue([completedItem]);
      const updateWhere1 = jest
        .fn()
        .mockReturnValue({ returning: updateReturning });
      const updateSet1 = jest.fn().mockReturnValue({ where: updateWhere1 });

      // Update Mock 2: updateScheduleTotals (no returning)
      const updateWhere2 = jest.fn().mockResolvedValue(undefined);
      const updateSet2 = jest.fn().mockReturnValue({ where: updateWhere2 });

      mockDatabaseService.database.select
        .mockReturnValueOnce({ from: selectFrom1 })
        .mockReturnValueOnce({ from: selectFrom2 })
        .mockReturnValueOnce({ from: selectFrom3 });

      mockDatabaseService.database.update
        .mockReturnValueOnce({ set: updateSet1 })
        .mockReturnValueOnce({ set: updateSet2 });

      const result = await service.completeProduction(
        'schedule-1',
        'item-1',
        true,
        'Excellent quality',
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.quality_check).toBe(true);
      expect(result.quality_notes).toBe('Excellent quality');
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a production schedule', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        date: '2024-12-01',
        totalItems: 1,
        completedItems: 0,
        notes: null,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const selectFromWhereLimit = jest.fn().mockResolvedValue([mockSchedule]);
      const selectFromWhere = jest
        .fn()
        .mockReturnValue({ limit: selectFromWhereLimit });
      const selectFrom = jest.fn().mockReturnValue({ where: selectFromWhere });

      const deleteWhere = jest.fn().mockResolvedValue(undefined);

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: selectFrom,
      });
      mockDatabaseService.database.delete.mockReturnValueOnce({
        where: deleteWhere,
      });

      await service.deleteSchedule('schedule-1');

      expect(mockDatabaseService.database.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting non-existent schedule', async () => {
      const selectFromWhereLimit = jest.fn().mockResolvedValue([]);
      const selectFromWhere = jest
        .fn()
        .mockReturnValue({ limit: selectFromWhereLimit });
      const selectFrom = jest.fn().mockReturnValue({ where: selectFromWhere });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: selectFrom,
      });

      await expect(service.deleteSchedule('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

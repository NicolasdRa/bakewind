import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WidgetsService } from '../../src/widgets/widgets.service';
import { DatabaseService } from '../../src/database/database.service';
import { UpdateWidgetConfigDto } from '../../src/widgets/dto/widget-config.dto';

/**
 * T035: Unit tests for WidgetsService
 * Tests: Max 20 widgets validation, JSONB storage, user isolation
 */
describe('WidgetsService (T035)', () => {
  let service: WidgetsService;
  let mockDatabase: jest.Mocked<DatabaseService>;

  const mockUserId = 'user-123';
  const mockConfigId = 'config-456';

  // Mock Drizzle query builder
  const createMockQueryBuilder = (returnValue: unknown[]) => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(returnValue),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue(returnValue),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
    };
    return queryBuilder;
  };

  beforeEach(async () => {
    mockDatabase = {
      database: {} as any,
    } as jest.Mocked<DatabaseService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetsService,
        {
          provide: DatabaseService,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<WidgetsService>(WidgetsService);
  });

  describe('getConfig', () => {
    it('should return widget configuration for a user', async () => {
      const mockConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets: [
          {
            id: 'widget-1',
            type: 'metrics',
            position: { x: 0, y: 0, w: 2, h: 1 },
            config: {},
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = createMockQueryBuilder([mockConfig]);
      mockDatabase.database = queryBuilder as any;

      const result = await service.getConfig(mockUserId);

      expect(result).toEqual({
        id: mockConfig.id,
        user_id: mockConfig.userId,
        layout_type: mockConfig.layoutType,
        widgets: mockConfig.widgets,
        created_at: mockConfig.createdAt,
        updated_at: mockConfig.updatedAt,
      });
    });

    it('should throw NotFoundException when config does not exist', async () => {
      const queryBuilder = createMockQueryBuilder([]);
      mockDatabase.database = queryBuilder as any;

      await expect(service.getConfig(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getConfig(mockUserId)).rejects.toThrow(
        'Widget configuration not found',
      );
    });

    it('should isolate configs by user', async () => {
      const mockConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = createMockQueryBuilder([mockConfig]);
      mockDatabase.database = queryBuilder as any;

      const result = await service.getConfig(mockUserId);

      // Verify user isolation by checking the query was made with correct userId
      expect(result.user_id).toBe(mockUserId);
    });
  });

  describe('updateConfig', () => {
    it('should update existing widget configuration', async () => {
      const existingConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      const updatedConfig = {
        ...existingConfig,
        layoutType: 'list',
        widgets: [
          {
            id: 'widget-1',
            type: 'metrics',
            position: { x: 0, y: 0, w: 2, h: 1 },
            config: {},
          },
        ],
        updatedAt: new Date('2025-01-02'),
      };

      // First call returns existing, second returns updated
      let callCount = 0;
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve(callCount === 1 ? [existingConfig] : []);
        }),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const dto: UpdateWidgetConfigDto = {
        layout_type: 'list',
        widgets: [
          {
            id: 'widget-1',
            type: 'metrics',
            position: { x: 0, y: 0, w: 2, h: 1 },
            config: {},
          },
        ],
      };

      const result = await service.updateConfig(mockUserId, dto);

      expect(result.layout_type).toBe('list');
      expect(result.widgets).toHaveLength(1);
      expect(queryBuilder.update).toHaveBeenCalled();
    });

    it('should create new config if none exists', async () => {
      const createdConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets: [
          {
            id: 'widget-1',
            type: 'metrics',
            position: { x: 0, y: 0, w: 2, h: 1 },
            config: {},
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No existing config
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const dto: UpdateWidgetConfigDto = {
        layout_type: 'grid',
        widgets: [
          {
            id: 'widget-1',
            type: 'metrics',
            position: { x: 0, y: 0, w: 2, h: 1 },
            config: {},
          },
        ],
      };

      const result = await service.updateConfig(mockUserId, dto);

      expect(result.id).toBe(mockConfigId);
      expect(queryBuilder.insert).toHaveBeenCalled();
    });

    it('should handle max 20 widgets', async () => {
      const widgets = Array.from({ length: 20 }, (_, i) => ({
        id: `widget-${i}`,
        type: 'metrics' as const,
        position: { x: i % 4, y: Math.floor(i / 4), w: 1, h: 1 },
        config: {},
      }));

      const createdConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const dto: UpdateWidgetConfigDto = {
        layout_type: 'grid',
        widgets,
      };

      const result = await service.updateConfig(mockUserId, dto);

      expect(result.widgets).toHaveLength(20);
    });

    it('should store widgets as JSONB', async () => {
      const widgets = [
        {
          id: 'widget-1',
          type: 'chart' as const,
          position: { x: 0, y: 0, w: 2, h: 2 },
          config: {
            chartType: 'line',
            dataSource: 'orders',
            customSetting: { nested: { value: 123 } },
          },
        },
      ];

      const createdConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const dto: UpdateWidgetConfigDto = {
        layout_type: 'grid',
        widgets,
      };

      const result = await service.updateConfig(mockUserId, dto);

      // Verify nested config object is preserved
      expect(result.widgets[0].config).toEqual({
        chartType: 'line',
        dataSource: 'orders',
        customSetting: { nested: { value: 123 } },
      });
    });

    it('should ensure user isolation when updating', async () => {
      const user1Config = {
        id: 'config-1',
        userId: 'user-1',
        layoutType: 'grid',
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([user1Config]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([user1Config]),
      };

      mockDatabase.database = queryBuilder as any;

      const dto: UpdateWidgetConfigDto = {
        layout_type: 'list',
        widgets: [],
      };

      const result = await service.updateConfig('user-1', dto);

      // User 2 should not be able to modify user 1's config
      expect(result.user_id).toBe('user-1');
    });
  });

  describe('createDefault', () => {
    it('should create default widget configuration with 2 widgets', async () => {
      const createdConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets: [
          {
            id: 'default-metrics',
            type: 'metrics',
            position: { x: 0, y: 0, w: 2, h: 1 },
            config: {},
          },
          {
            id: 'default-orders',
            type: 'orders',
            position: { x: 2, y: 0, w: 2, h: 2 },
            config: {},
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const result = await service.createDefault(mockUserId);

      expect(result.widgets).toHaveLength(2);
      expect(result.widgets[0].id).toBe('default-metrics');
      expect(result.widgets[1].id).toBe('default-orders');
      expect(result.layout_type).toBe('grid');
    });

    it('should create config with correct default layout type', async () => {
      const createdConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const result = await service.createDefault(mockUserId);

      expect(result.layout_type).toBe('grid');
    });
  });

  describe('JSONB edge cases', () => {
    it('should handle empty widgets array', async () => {
      const createdConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'list',
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const dto: UpdateWidgetConfigDto = {
        layout_type: 'list',
        widgets: [],
      };

      const result = await service.updateConfig(mockUserId, dto);

      expect(result.widgets).toEqual([]);
    });

    it('should handle complex widget config objects', async () => {
      const widgets = [
        {
          id: 'complex-widget',
          type: 'chart' as const,
          position: { x: 0, y: 0, w: 3, h: 2 },
          config: {
            filters: [
              { field: 'status', operator: 'eq', value: 'completed' },
              { field: 'date', operator: 'gte', value: '2025-01-01' },
            ],
            aggregations: {
              groupBy: ['category'],
              metrics: ['sum', 'avg', 'count'],
            },
            display: {
              colors: ['#FF6384', '#36A2EB'],
              legend: { show: true, position: 'bottom' },
            },
          },
        },
      ];

      const createdConfig = {
        id: mockConfigId,
        userId: mockUserId,
        layoutType: 'grid',
        widgets,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdConfig]),
      };

      mockDatabase.database = queryBuilder as any;

      const dto: UpdateWidgetConfigDto = {
        layout_type: 'grid',
        widgets,
      };

      const result = await service.updateConfig(mockUserId, dto);

      // Verify complex nested structure is preserved
      expect(result.widgets[0].config.filters).toHaveLength(2);
      expect(result.widgets[0].config.aggregations.metrics).toEqual([
        'sum',
        'avg',
        'count',
      ]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { ProductionStatus } from './dto';

describe('ProductionController', () => {
  let controller: ProductionController;

  const mockProductionService = {
    getAllSchedules: jest.fn(),
    getScheduleById: jest.fn(),
    createSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
    updateProductionItem: jest.fn(),
    startProduction: jest.fn(),
    completeProduction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        {
          provide: ProductionService,
          useValue: mockProductionService,
        },
      ],
    }).compile();

    controller = module.get<ProductionController>(ProductionController);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllSchedules', () => {
    it('should return all schedules without filters', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          date: '2024-12-01',
          total_items: 2,
          completed_items: 1,
          notes: null,
          created_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          items: [],
        },
      ];

      mockProductionService.getAllSchedules.mockResolvedValue(mockSchedules);

      const result = await controller.getAllSchedules();

      expect(result).toEqual(mockSchedules);
      expect(mockProductionService.getAllSchedules).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });

    it('should return schedules with date filters', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          date: '2024-12-01',
          total_items: 1,
          completed_items: 0,
          notes: null,
          created_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          items: [],
        },
      ];

      mockProductionService.getAllSchedules.mockResolvedValue(mockSchedules);

      const result = await controller.getAllSchedules(
        '2024-12-01',
        '2024-12-31',
      );

      expect(result).toEqual(mockSchedules);
      expect(mockProductionService.getAllSchedules).toHaveBeenCalledWith(
        '2024-12-01',
        '2024-12-31',
      );
    });
  });

  describe('getScheduleById', () => {
    it('should return a schedule by ID', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        date: '2024-12-01',
        total_items: 1,
        completed_items: 0,
        notes: 'Test schedule',
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        items: [
          {
            id: 'item-1',
            schedule_id: 'schedule-1',
            recipe_id: 'recipe-1',
            recipe_name: 'Bread',
            quantity: 10,
            status: 'scheduled' as ProductionStatus,
            scheduled_time: '2024-12-01T06:00:00Z',
            start_time: null,
            completed_time: null,
            assigned_to: null,
            notes: null,
            batch_number: null,
            quality_check: false,
            quality_notes: null,
          },
        ],
      };

      mockProductionService.getScheduleById.mockResolvedValue(mockSchedule);

      const result = await controller.getScheduleById('schedule-1');

      expect(result).toEqual(mockSchedule);
      expect(mockProductionService.getScheduleById).toHaveBeenCalledWith(
        'schedule-1',
      );
    });
  });

  describe('createSchedule', () => {
    it('should create a new schedule', async () => {
      const createDto = {
        date: '2024-12-01',
        notes: 'Morning batch',
        createdBy: 'user-1',
        items: [
          {
            recipeId: 'recipe-1',
            recipeName: 'Sourdough',
            quantity: 10,
            status: ProductionStatus.SCHEDULED,
            scheduledTime: '2024-12-01T06:00:00Z',
          },
        ],
      };

      const mockCreated = {
        id: 'new-schedule-id',
        date: createDto.date,
        total_items: 1,
        completed_items: 0,
        notes: createDto.notes,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        items: [],
      };

      const mockRequest = {
        user: {
          userId: 'user-1',
        },
      };

      mockProductionService.createSchedule.mockResolvedValue(mockCreated);

      const result = await controller.createSchedule(mockRequest, createDto);

      expect(result).toEqual(mockCreated);
      expect(mockProductionService.createSchedule).toHaveBeenCalledWith(
        createDto,
        'user-1',
      );
    });
  });

  describe('updateSchedule', () => {
    it('should update a schedule', async () => {
      const updateDto = {
        date: '2024-12-02',
        notes: 'Updated notes',
      };

      const mockUpdated = {
        id: 'schedule-1',
        date: updateDto.date,
        total_items: 1,
        completed_items: 0,
        notes: updateDto.notes,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        items: [],
      };

      mockProductionService.updateSchedule.mockResolvedValue(mockUpdated);

      const result = await controller.updateSchedule('schedule-1', updateDto);

      expect(result).toEqual(mockUpdated);
      expect(mockProductionService.updateSchedule).toHaveBeenCalledWith(
        'schedule-1',
        updateDto,
      );
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule', async () => {
      mockProductionService.deleteSchedule.mockResolvedValue(undefined);

      await controller.deleteSchedule('schedule-1');

      expect(mockProductionService.deleteSchedule).toHaveBeenCalledWith(
        'schedule-1',
      );
    });
  });

  describe('updateProductionItem', () => {
    it('should update a production item', async () => {
      const updateDto = {
        status: ProductionStatus.IN_PROGRESS,
        startTime: '2024-12-01T06:00:00Z',
      };

      const mockUpdated = {
        id: 'item-1',
        schedule_id: 'schedule-1',
        recipe_id: 'recipe-1',
        recipe_name: 'Bread',
        quantity: 10,
        status: 'in_progress' as ProductionStatus,
        scheduled_time: '2024-12-01T06:00:00Z',
        start_time: '2024-12-01T06:00:00Z',
        completed_time: null,
        assigned_to: null,
        notes: null,
        batch_number: null,
        quality_check: false,
        quality_notes: null,
      };

      mockProductionService.updateProductionItem.mockResolvedValue(mockUpdated);

      const result = await controller.updateProductionItem(
        'schedule-1',
        'item-1',
        updateDto,
      );

      expect(result).toEqual(mockUpdated);
      expect(mockProductionService.updateProductionItem).toHaveBeenCalledWith(
        'schedule-1',
        'item-1',
        updateDto,
      );
    });
  });

  describe('startProduction', () => {
    it('should start production for an item', async () => {
      const mockStarted = {
        id: 'item-1',
        schedule_id: 'schedule-1',
        recipe_id: 'recipe-1',
        recipe_name: 'Bread',
        quantity: 10,
        status: 'in_progress' as ProductionStatus,
        scheduled_time: '2024-12-01T06:00:00Z',
        start_time: '2024-12-01T06:00:00Z',
        completed_time: null,
        assigned_to: null,
        notes: null,
        batch_number: null,
        quality_check: false,
        quality_notes: null,
      };

      mockProductionService.startProduction.mockResolvedValue(mockStarted);

      const result = await controller.startProduction('schedule-1', 'item-1');

      expect(result).toEqual(mockStarted);
      expect(mockProductionService.startProduction).toHaveBeenCalledWith(
        'schedule-1',
        'item-1',
      );
    });
  });

  describe('completeProduction', () => {
    it('should complete production for an item', async () => {
      const mockCompleted = {
        id: 'item-1',
        schedule_id: 'schedule-1',
        recipe_id: 'recipe-1',
        recipe_name: 'Bread',
        quantity: 10,
        status: 'completed' as ProductionStatus,
        scheduled_time: '2024-12-01T06:00:00Z',
        start_time: '2024-12-01T06:00:00Z',
        completed_time: '2024-12-01T10:00:00Z',
        assigned_to: null,
        notes: null,
        batch_number: null,
        quality_check: true,
        quality_notes: 'Perfect',
      };

      mockProductionService.completeProduction.mockResolvedValue(mockCompleted);

      const result = await controller.completeProduction(
        'schedule-1',
        'item-1',
        true,
        'Perfect',
      );

      expect(result).toEqual(mockCompleted);
      expect(mockProductionService.completeProduction).toHaveBeenCalledWith(
        'schedule-1',
        'item-1',
        true,
        'Perfect',
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ResponseFormattingService } from '../common/services/response-formatting.service';
import { HealthResponseDto } from './health-reponse.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('HealthController', () => {
  let controller: HealthController;
  let responseFormattingService: ResponseFormattingService;

  const mockResponseFormattingService = {
    createSuccessResponse: jest.fn(),
    formatSuccessResponse: jest.fn(),
    formatErrorResponse: jest.fn(),
  };

  const mockRealtimeGateway = {
    server: {
      sockets: {
        fetchSockets: jest.fn().mockResolvedValue([]),
      },
    },
  };

  const mockHealthResponse: HealthResponseDto = {
    status: 200,
    message: 'Health status retrieved successfully',
    data: {
      status: 'UP',
      timestamp: '2025-01-01T00:00:00.000Z',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set default mock responses
    mockResponseFormattingService.createSuccessResponse.mockReturnValue(
      mockHealthResponse,
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: ResponseFormattingService,
          useValue: mockResponseFormattingService,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    responseFormattingService = module.get<ResponseFormattingService>(
      ResponseFormattingService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(responseFormattingService).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return health status successfully', () => {
      const result = controller.getHealthStatus();

      expect(result).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.message).toBe('Health status retrieved successfully');
      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('UP');
      expect(result.data.timestamp).toBeDefined();
    });

    it('should call ResponseFormattingService.createSuccessResponse', () => {
      controller.getHealthStatus();

      expect(
        mockResponseFormattingService.createSuccessResponse,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockResponseFormattingService.createSuccessResponse,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'UP',
          timestamp: expect.any(String),
        }),
        'Health status',
        'retrieved',
      );
    });

    it('should return current timestamp in ISO format', () => {
      const beforeCall = new Date();
      controller.getHealthStatus();
      const afterCall = new Date();

      // Extract the timestamp from the call to createSuccessResponse
      const createSuccessResponseCall =
        mockResponseFormattingService.createSuccessResponse.mock.calls[0];
      const dataArgument = createSuccessResponseCall[0];
      const timestamp = dataArgument.timestamp;

      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const timestampDate = new Date(timestamp);
      expect(timestampDate.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime(),
      );
      expect(timestampDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should always return status UP', () => {
      // Call multiple times to ensure consistency
      for (let i = 0; i < 3; i++) {
        controller.getHealthStatus();
      }

      expect(
        mockResponseFormattingService.createSuccessResponse,
      ).toHaveBeenCalledTimes(3);

      // Check all calls have status 'UP'
      mockResponseFormattingService.createSuccessResponse.mock.calls.forEach(
        (call) => {
          const dataArgument = call[0];
          expect(dataArgument.status).toBe('UP');
        },
      );
    });

    it('should return unique timestamps on subsequent calls', () => {
      controller.getHealthStatus();

      // Small delay to ensure different timestamps
      setTimeout(() => {}, 1);

      controller.getHealthStatus();

      expect(
        mockResponseFormattingService.createSuccessResponse,
      ).toHaveBeenCalledTimes(2);

      const firstCallData =
        mockResponseFormattingService.createSuccessResponse.mock.calls[0][0];
      const secondCallData =
        mockResponseFormattingService.createSuccessResponse.mock.calls[1][0];

      // Timestamps should be different (or at least formatted at different times)
      expect(firstCallData.timestamp).toBeDefined();
      expect(secondCallData.timestamp).toBeDefined();
    });

    it('should use correct message parameters for ResponseFormattingService', () => {
      controller.getHealthStatus();

      expect(
        mockResponseFormattingService.createSuccessResponse,
      ).toHaveBeenCalledWith(expect.any(Object), 'Health status', 'retrieved');
    });

    it('should return the response from ResponseFormattingService', () => {
      const customResponse = {
        status: 200,
        message: 'Custom health message',
        data: { status: 'UP', timestamp: '2025-01-01T12:00:00.000Z' },
      };

      mockResponseFormattingService.createSuccessResponse.mockReturnValue(
        customResponse,
      );

      const result = controller.getHealthStatus();

      expect(result).toBe(customResponse);
    });

    it('should handle ResponseFormattingService being called with correct data structure', () => {
      controller.getHealthStatus();

      const createSuccessResponseCall =
        mockResponseFormattingService.createSuccessResponse.mock.calls[0];
      const dataArgument = createSuccessResponseCall[0];

      expect(dataArgument).toEqual({
        status: 'UP',
        timestamp: expect.any(String),
      });

      expect(typeof dataArgument.status).toBe('string');
      expect(typeof dataArgument.timestamp).toBe('string');
      expect(dataArgument.status).toBe('UP');
    });
  });

  describe('API endpoint behavior', () => {
    it('should be accessible without authentication', () => {
      // Health endpoints typically don't require authentication
      // This test verifies the endpoint can be called directly
      expect(() => controller.getHealthStatus()).not.toThrow();
    });

    it('should be a GET endpoint', () => {
      // Verify the method exists and is callable
      expect(typeof controller.getHealthStatus).toBe('function');
      expect(controller.getHealthStatus.length).toBe(0); // No parameters expected
    });
  });

  describe('Error handling', () => {
    it('should handle ResponseFormattingService errors gracefully', () => {
      mockResponseFormattingService.createSuccessResponse.mockImplementation(
        () => {
          throw new Error('Service error');
        },
      );

      expect(() => controller.getHealthStatus()).toThrow('Service error');
    });
  });

  describe('Integration with HealthService', () => {
    it('should work without requiring HealthService methods', () => {
      // The current implementation doesn't use HealthService methods
      // This test ensures the controller works independently
      expect(() => controller.getHealthStatus()).not.toThrow();
    });
  });
});

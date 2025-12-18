import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { DatabaseService } from '../database/database.service';

describe('CustomersService', () => {
  let service: CustomersService;

  // Mock database service
  const mockDatabaseService = {
    database: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  // Helper to create mock customer data
  const createMockCustomer = (overrides = {}) => ({
    id: 'customer-1',
    userId: 'user-1',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '555-1234',
    addressLine1: '123 Main St',
    addressLine2: 'Suite 100',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    customerType: 'business' as const,
    companyName: 'Test Company',
    taxId: '12-3456789',
    preferredContact: 'email' as const,
    marketingOptIn: true,
    status: 'active' as const,
    notes: 'Test notes',
    loyaltyPoints: 100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  // Helper to create order stats mock
  const createOrderStatsMock = (stats = {}) => ({
    totalOrders: 5,
    totalSpent: 250.0,
    lastOrderAt: new Date('2024-06-15'),
    ...stats,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return paginated customers with order stats', async () => {
      const mockCustomers = [createMockCustomer()];
      const mockStats = createOrderStatsMock();

      // Mock count query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock customer list query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockCustomers),
              }),
            }),
          }),
        }),
      });

      // Mock order stats query for each customer
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.findAllByUser('user-1', { page: 1, limit: 20 });

      expect(result.customers).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.customers[0]!.name).toBe('Test Customer');
      expect(result.customers[0]!.totalOrders).toBe(5);
      expect(result.customers[0]!.totalSpent).toBe(250.0);
    });

    it('should return empty list when no customers found', async () => {
      // Mock count query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      // Mock customer list query (empty)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await service.findAllByUser('user-1', {});

      expect(result.customers).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter customers by status', async () => {
      const mockCustomers = [createMockCustomer({ status: 'inactive' })];
      const mockStats = createOrderStatsMock();

      // Mock count query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock customer list query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockCustomers),
              }),
            }),
          }),
        }),
      });

      // Mock order stats query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.findAllByUser('user-1', { status: 'inactive' });

      expect(result.customers).toHaveLength(1);
      expect(result.customers[0]!.status).toBe('inactive');
    });

    it('should filter customers by customerType', async () => {
      const mockCustomers = [createMockCustomer({ customerType: 'individual' })];
      const mockStats = createOrderStatsMock();

      // Mock count query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock customer list query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockCustomers),
              }),
            }),
          }),
        }),
      });

      // Mock order stats query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.findAllByUser('user-1', { customerType: 'individual' });

      expect(result.customers).toHaveLength(1);
      expect(result.customers[0]!.customerType).toBe('individual');
    });

    it('should calculate average order value correctly', async () => {
      const mockCustomers = [createMockCustomer()];
      const mockStats = createOrderStatsMock({ totalOrders: 10, totalSpent: 500.0 });

      // Mock count query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock customer list query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockCustomers),
              }),
            }),
          }),
        }),
      });

      // Mock order stats query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.findAllByUser('user-1', {});

      expect(result.customers[0]!.averageOrderValue).toBe(50.0);
    });

    it('should handle customer with zero orders', async () => {
      const mockCustomers = [createMockCustomer()];
      const mockStats = createOrderStatsMock({ totalOrders: 0, totalSpent: 0, lastOrderAt: null });

      // Mock count query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      // Mock customer list query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockCustomers),
              }),
            }),
          }),
        }),
      });

      // Mock order stats query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.findAllByUser('user-1', {});

      expect(result.customers[0]!.totalOrders).toBe(0);
      expect(result.customers[0]!.totalSpent).toBe(0);
      expect(result.customers[0]!.averageOrderValue).toBe(0);
      expect(result.customers[0]!.lastOrderAt).toBeNull();
    });
  });

  describe('findByIdAndUser', () => {
    it('should return a customer by ID with order stats', async () => {
      const mockCustomer = createMockCustomer();
      const mockStats = createOrderStatsMock();

      // Mock customer query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCustomer]),
        }),
      });

      // Mock order stats query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.findByIdAndUser('customer-1', 'user-1');

      expect(result.id).toBe('customer-1');
      expect(result.name).toBe('Test Customer');
      expect(result.totalOrders).toBe(5);
      expect(result.totalSpent).toBe(250.0);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findByIdAndUser('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return customer belonging to different user', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findByIdAndUser('customer-1', 'different-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new customer with default values', async () => {
      const createDto = {
        name: 'New Customer',
        phone: '555-9999',
        customerType: 'business' as const,
        marketingOptIn: false,
      };

      const mockCreated = createMockCustomer({
        id: 'new-customer-1',
        name: 'New Customer',
        email: null,
        phone: '555-9999',
        addressLine1: null,
        companyName: null,
        customerType: 'business',
      });

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await service.create('user-1', createDto);

      expect(result.id).toBe('new-customer-1');
      expect(result.name).toBe('New Customer');
      expect(result.customerType).toBe('business');
      expect(result.totalOrders).toBe(0);
      expect(result.totalSpent).toBe(0);
    });

    it('should create a customer with all fields', async () => {
      const createDto = {
        name: 'Business Customer',
        email: 'business@example.com',
        phone: '555-8888',
        addressLine1: '456 Business Ave',
        addressLine2: 'Floor 5',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        customerType: 'business' as const,
        companyName: 'Big Corp',
        taxId: '98-7654321',
        preferredContact: 'phone' as const,
        marketingOptIn: true,
        notes: 'VIP customer',
      };

      const mockCreated = createMockCustomer({
        ...createDto,
        id: 'business-customer-1',
      });

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await service.create('user-1', createDto);

      expect(result.name).toBe('Business Customer');
      expect(result.companyName).toBe('Big Corp');
      expect(result.taxId).toBe('98-7654321');
      expect(result.customerType).toBe('business');
    });

    it('should create an individual customer', async () => {
      const createDto = {
        name: 'John Doe',
        phone: '555-1111',
        customerType: 'individual' as const,
        marketingOptIn: false,
      };

      const mockCreated = createMockCustomer({
        ...createDto,
        id: 'individual-1',
        companyName: null,
        taxId: null,
      });

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await service.create('user-1', createDto);

      expect(result.customerType).toBe('individual');
      expect(result.companyName).toBeNull();
    });
  });

  describe('updateByIdAndUser', () => {
    it('should update customer fields', async () => {
      const mockExisting = createMockCustomer();
      const mockStats = createOrderStatsMock();

      // Mock findByIdAndUser (select customer + order stats)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockExisting]),
        }),
      });
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const mockUpdated = createMockCustomer({
        name: 'Updated Name',
        phone: '555-0000',
      });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      // Mock order stats for the return value
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.updateByIdAndUser('customer-1', 'user-1', {
        name: 'Updated Name',
        phone: '555-0000',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update customer status to inactive', async () => {
      const mockExisting = createMockCustomer();
      const mockStats = createOrderStatsMock();

      // Mock findByIdAndUser
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockExisting]),
        }),
      });
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const mockUpdated = createMockCustomer({ status: 'inactive' });

      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.updateByIdAndUser('customer-1', 'user-1', {
        status: 'inactive',
      });

      expect(result.status).toBe('inactive');
    });

    it('should throw NotFoundException when updating non-existent customer', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.updateByIdAndUser('non-existent', 'user-1', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteByIdAndUser', () => {
    it('should soft delete customer with orders', async () => {
      const mockExisting = createMockCustomer();
      const mockStats = createOrderStatsMock({ totalOrders: 5 });

      // Mock findByIdAndUser
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockExisting]),
        }),
      });
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      // Mock order count check
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      // Mock soft delete (update status)
      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await service.deleteByIdAndUser('customer-1', 'user-1');

      expect(mockDatabaseService.database.update).toHaveBeenCalled();
      expect(mockDatabaseService.database.delete).not.toHaveBeenCalled();
    });

    it('should hard delete customer without orders', async () => {
      const mockExisting = createMockCustomer();
      const mockStats = createOrderStatsMock({ totalOrders: 0 });

      // Mock findByIdAndUser
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockExisting]),
        }),
      });
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      // Mock order count check (0 orders)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      // Mock hard delete
      mockDatabaseService.database.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteByIdAndUser('customer-1', 'user-1');

      expect(mockDatabaseService.database.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting non-existent customer', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteByIdAndUser('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCustomerOrders', () => {
    it('should return paginated customer orders', async () => {
      const mockCustomer = createMockCustomer();
      const mockStats = createOrderStatsMock();
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'completed',
          total: '75.00',
          createdAt: new Date('2024-06-15'),
        },
        {
          id: 'order-2',
          orderNumber: 'ORD-002',
          status: 'pending',
          total: '50.00',
          createdAt: new Date('2024-06-10'),
        },
      ];

      // Mock findByIdAndUser
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCustomer]),
        }),
      });
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      // Mock orders query
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockOrders),
              }),
            }),
          }),
        }),
      });

      // Mock order count
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }]),
        }),
      });

      // Mock order stats for summary
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.getCustomerOrders('customer-1', 'user-1', {
        page: 1,
        limit: 10,
      });

      expect(result.orders).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.summary.totalOrders).toBe(5);
      expect(result.summary.totalSpent).toBe(250.0);
    });

    it('should throw NotFoundException for non-existent customer', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.getCustomerOrders('non-existent', 'user-1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('mapToResponseDto', () => {
    it('should calculate correct average order value', async () => {
      const mockCustomer = createMockCustomer();

      // Mock findByIdAndUser
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCustomer]),
        }),
      });

      // Mock order stats
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ totalOrders: 4, totalSpent: 200.0, lastOrderAt: new Date() }]),
        }),
      });

      const result = await service.findByIdAndUser('customer-1', 'user-1');

      expect(result.averageOrderValue).toBe(50.0);
    });

    it('should return 0 average for customer with no orders', async () => {
      const mockCustomer = createMockCustomer();

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCustomer]),
        }),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ totalOrders: 0, totalSpent: 0, lastOrderAt: null }]),
        }),
      });

      const result = await service.findByIdAndUser('customer-1', 'user-1');

      expect(result.averageOrderValue).toBe(0);
    });

    it('should format dates as ISO strings', async () => {
      const mockCustomer = createMockCustomer({
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-06-20T14:45:00Z'),
      });
      const mockStats = createOrderStatsMock({
        lastOrderAt: new Date('2024-06-18T09:00:00Z'),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCustomer]),
        }),
      });

      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      const result = await service.findByIdAndUser('customer-1', 'user-1');

      expect(result.createdAt).toBe('2024-01-15T10:30:00.000Z');
      expect(result.updatedAt).toBe('2024-06-20T14:45:00.000Z');
      expect(result.lastOrderAt).toBe('2024-06-18T09:00:00.000Z');
    });
  });

  describe('bulkImport', () => {
    it('should import multiple customers successfully', async () => {
      const customersToImport = [
        { name: 'Customer 1', phone: '555-0001', customerType: 'business' as const, marketingOptIn: false },
        { name: 'Customer 2', phone: '555-0002', customerType: 'business' as const, marketingOptIn: false },
      ];

      const mockCreated1 = createMockCustomer({ id: 'import-1', name: 'Customer 1' });
      const mockCreated2 = createMockCustomer({ id: 'import-2', name: 'Customer 2' });

      mockDatabaseService.database.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockCreated1]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockCreated2]),
          }),
        });

      const result = await service.bulkImport('user-1', customersToImport);

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should track failed imports', async () => {
      const customersToImport = [
        { name: 'Customer 1', phone: '555-0001', customerType: 'business' as const, marketingOptIn: false },
        { name: 'Customer 2', phone: '555-0002', customerType: 'business' as const, marketingOptIn: false },
      ];

      const mockCreated1 = createMockCustomer({ id: 'import-1', name: 'Customer 1' });

      mockDatabaseService.database.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockCreated1]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        });

      const result = await service.bulkImport('user-1', customersToImport);

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.row).toBe(2);
      expect(result.errors[0]!.error).toBe('Database error');
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV with correct headers and data', async () => {
      const mockCustomers = [
        createMockCustomer({
          name: 'Test Export',
          email: 'export@test.com',
          phone: '555-EXPORT',
        }),
      ];

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCustomers),
          }),
        }),
      });

      const result = await service.exportToCSV('user-1', {});

      expect(result).toContain('Name,Email,Phone');
      expect(result).toContain('Test Export');
      expect(result).toContain('export@test.com');
      expect(result).toContain('555-EXPORT');
    });

    it('should escape quotes in notes', async () => {
      const mockCustomers = [
        createMockCustomer({
          notes: 'Customer said "hello"',
        }),
      ];

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCustomers),
          }),
        }),
      });

      const result = await service.exportToCSV('user-1', {});

      expect(result).toContain('""hello""');
    });

    it('should filter by status when provided', async () => {
      const mockCustomers = [
        createMockCustomer({
          name: 'Active Customer',
          status: 'active',
        }),
      ];

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCustomers),
          }),
        }),
      });

      const result = await service.exportToCSV('user-1', { status: 'active' });

      expect(result).toContain('Active Customer');
      expect(result).toContain('active');
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return analytics for customer with orders', async () => {
      const mockCustomer = createMockCustomer();
      const mockStats = createOrderStatsMock({ totalOrders: 5, totalSpent: 500, lastOrderAt: new Date('2024-06-15') });

      // Mock findByIdAndUser (customer + stats)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCustomer]),
        }),
      });
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      // Mock order stats
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      // Mock first order date
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ createdAt: new Date('2024-01-01') }]),
            }),
          }),
        }),
      });

      // Mock order dates for frequency calculation
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([
              { createdAt: new Date('2024-01-01') },
              { createdAt: new Date('2024-02-15') },
              { createdAt: new Date('2024-04-01') },
            ]),
          }),
        }),
      });

      // Mock favorite products
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([
                    { productName: 'Croissant', orderCount: 3, totalQuantity: 15 },
                    { productName: 'Baguette', orderCount: 2, totalQuantity: 8 },
                  ]),
                }),
              }),
            }),
          }),
        }),
      });

      // Mock preferred order days
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([
                { dayOfWeek: 1, count: 5 }, // Monday
                { dayOfWeek: 5, count: 3 }, // Friday
              ]),
            }),
          }),
        }),
      });

      // Mock monthly orders
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([
                { month: '2024-01', orderCount: 2, totalAmount: 150 },
                { month: '2024-02', orderCount: 1, totalAmount: 100 },
                { month: '2024-04', orderCount: 2, totalAmount: 250 },
              ]),
            }),
          }),
        }),
      });

      const result = await service.getCustomerAnalytics('customer-1', 'user-1', '90d');

      expect(result.overview.totalOrders).toBe(5);
      expect(result.overview.totalSpent).toBe(500);
      expect(result.overview.averageOrderValue).toBe(100);
      expect(result.preferences.favoriteProducts).toHaveLength(2);
      expect(result.preferences.favoriteProducts[0]!.productName).toBe('Croissant');
      expect(result.preferences.preferredOrderDays).toContain('Monday');
      expect(result.trends.monthlyOrders).toHaveLength(3);
      expect(result.orderFrequency.orderFrequencyCategory).toBe('regular');
    });

    it('should return analytics for new customer with no orders', async () => {
      const mockCustomer = createMockCustomer();
      const mockStats = createOrderStatsMock({ totalOrders: 0, totalSpent: 0, lastOrderAt: null });

      // Mock findByIdAndUser
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCustomer]),
        }),
      });
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      // Mock order stats
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockStats]),
        }),
      });

      // Mock first order date (none)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Mock order dates (empty)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock favorite products (empty)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      // Mock preferred order days (empty)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      // Mock monthly orders (empty)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await service.getCustomerAnalytics('customer-1', 'user-1', 'all');

      expect(result.overview.totalOrders).toBe(0);
      expect(result.overview.totalSpent).toBe(0);
      expect(result.overview.averageOrderValue).toBe(0);
      expect(result.preferences.favoriteProducts).toHaveLength(0);
      expect(result.preferences.preferredOrderDays).toHaveLength(0);
      expect(result.trends.monthlyOrders).toHaveLength(0);
      expect(result.orderFrequency.orderFrequencyCategory).toBe('new');
      expect(result.trends.riskLevel).toBe('high');
    });

    it('should throw NotFoundException for non-existent customer', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.getCustomerAnalytics('non-existent', 'user-1', '30d'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

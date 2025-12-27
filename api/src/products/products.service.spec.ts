import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { DatabaseService } from '../database/database.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const mockTenantId = 'test-tenant-id';

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
        ProductsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products without filters', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Sourdough Bread',
          description: 'Artisan sourdough',
          category: 'bread',
          status: 'active',
          basePrice: '5.99',
          costOfGoods: '2.50',
          recipeId: null,
          recipeName: null,
          estimatedPrepTime: 120,
          allergens: ['gluten'],
          tags: ['artisan', 'popular'],
          imageUrl: null,
          nutritionalInfo: { calories: 250, protein: 8 },
          availableSeasons: null,
          minimumOrderQuantity: 1,
          storageInstructions: 'Store in cool, dry place',
          shelfLife: 72,
          customizable: false,
          customizationOptions: null,
          popularityScore: 10,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      const result = await service.getProducts(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Sourdough Bread');
      expect(result[0]!.basePrice).toBe(5.99);
      expect(result[0]!.costOfGoods).toBe(2.5);
      // Calculated fields
      expect(result[0]!.margin).toBeCloseTo(58.26, 2); // (5.99 - 2.50) / 5.99 * 100
      expect(result[0]!.markup).toBeCloseTo(139.6, 1); // (5.99 - 2.50) / 2.50 * 100
      expect(result[0]!.profit).toBeCloseTo(3.49, 2); // 5.99 - 2.50
      expect(result[0]!.marginWarning).toBe(false); // margin > 20%
    });

    it('should return products filtered by category', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Croissant',
          category: 'pastry',
          status: 'active',
          basePrice: '3.50',
          costOfGoods: '1.20',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      const result = await service.getProducts(mockTenantId, 'pastry');

      expect(result).toHaveLength(1);
      expect(result[0]!.category).toBe('pastry');
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Chocolate Cake',
        description: 'Rich chocolate layer cake',
        category: 'cake',
        status: 'active',
        basePrice: '25.00',
        costOfGoods: '10.00',
        recipeId: null,
        recipeName: null,
        estimatedPrepTime: 180,
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['celebration', 'chocolate'],
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        minimumOrderQuantity: 1,
        storageInstructions: 'Refrigerate',
        shelfLife: 48,
        customizable: true,
        customizationOptions: [
          {
            name: 'Message',
            type: 'text',
            required: false,
          },
        ],
        popularityScore: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProduct]),
        }),
      });

      const result = await service.getProductById('product-1', mockTenantId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Chocolate Cake');
      expect(result.basePrice).toBe(25.0);
      expect(result.customizable).toBe(true);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.getProductById('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const createDto = {
        name: 'Baguette',
        description: 'Traditional French bread',
        category: 'bread' as const,
        status: 'active' as const,
        basePrice: 3.5,
        costOfGoods: 1.2,
        recipeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        estimatedPrepTime: 60,
        allergens: ['gluten'],
        tags: ['french', 'classic'],
        minimumOrderQuantity: 1,
        shelfLife: 24,
        customizable: false,
      };

      const mockCreated = {
        id: 'new-product-id',
        ...createDto,
        basePrice: '3.50',
        costOfGoods: '1.20',
        recipeId: null,
        recipeName: null,
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        storageInstructions: null,
        customizationOptions: null,
        popularityScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await service.createProduct(createDto, mockTenantId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Baguette');
      expect(result.basePrice).toBe(3.5);
      expect(result.popularityScore).toBe(0);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const existingProduct = {
        id: 'product-1',
        name: 'Old Name',
        basePrice: '10.00',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto = {
        name: 'New Name',
        basePrice: 12.5,
        status: 'inactive' as const,
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateDto,
        basePrice: '12.50',
        updatedAt: new Date(),
      };

      // Mock getProductById
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([existingProduct]),
        }),
      });

      // Mock update
      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedProduct]),
          }),
        }),
      });

      const result = await service.updateProduct('product-1', updateDto, mockTenantId);

      expect(result.name).toBe('New Name');
      expect(result.basePrice).toBe(12.5);
      expect(result.status).toBe('inactive');
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        service.updateProduct('non-existent', { name: 'Test' }, mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        basePrice: '5.00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getProductById
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProduct]),
        }),
      });

      // Mock delete
      mockDatabaseService.database.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteProduct('product-1', mockTenantId);

      expect(mockDatabaseService.database.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteProduct('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getActiveProducts', () => {
    it('should return only active products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Active Product',
          status: 'active',
          basePrice: '5.00',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      const result = await service.getActiveProducts(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('active');
    });
  });

  describe('calculatePopularity', () => {
    it('should calculate popularity based on order counts', async () => {
      const productId = 'product-1';
      const customerOrderCount = 5;
      const internalOrderCount = 3;

      const mockProduct = {
        id: productId,
        name: 'Popular Product',
        popularityScore: 0,
        basePrice: '5.00',
        category: 'bread',
        status: 'active',
        description: 'Test product',
        costOfGoods: null,
        recipeId: null,
        recipeName: null,
        estimatedPrepTime: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        minimumOrderQuantity: 1,
        storageInstructions: null,
        shelfLife: null,
        customizable: false,
        customizationOptions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProduct = {
        ...mockProduct,
        popularityScore: customerOrderCount + internalOrderCount,
      };

      // Mock getProductById check
      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockProduct]),
          }),
        })
        // Mock customer order count query
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: customerOrderCount }]),
          }),
        })
        // Mock internal order count query
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: internalOrderCount }]),
          }),
        });

      // Mock update
      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedProduct]),
          }),
        }),
      });

      const result = await service.calculatePopularity(productId, mockTenantId);

      expect(result.popularityScore).toBe(8); // 5 + 3
      expect(mockDatabaseService.database.select).toHaveBeenCalledTimes(3);
    });

    it('should handle products with no orders', async () => {
      const productId = 'product-1';

      const mockProduct = {
        id: productId,
        name: 'Unpopular Product',
        popularityScore: 0,
        basePrice: '5.00',
        category: 'bread',
        status: 'active',
        description: 'Test product',
        costOfGoods: null,
        recipeId: null,
        recipeName: null,
        estimatedPrepTime: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        minimumOrderQuantity: 1,
        storageInstructions: null,
        shelfLife: null,
        customizable: false,
        customizationOptions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getProductById check first
      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockProduct]),
          }),
        })
        // Mock both counts as 0
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]),
          }),
        });

      // Mock update
      mockDatabaseService.database.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      });

      const result = await service.calculatePopularity(productId, mockTenantId);

      expect(result.popularityScore).toBe(0);
    });
  });

  describe('margin calculations', () => {
    it('should calculate margin, markup, and profit correctly', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        basePrice: '10.00',
        costOfGoods: '6.00',
        category: 'bread',
        status: 'active',
        description: 'Test',
        recipeId: null,
        recipeName: null,
        estimatedPrepTime: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        minimumOrderQuantity: 1,
        storageInstructions: null,
        shelfLife: null,
        customizable: false,
        customizationOptions: null,
        popularityScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProduct]),
        }),
      });

      const result = await service.getProductById('product-1', mockTenantId);

      // Margin = (10 - 6) / 10 * 100 = 40%
      expect(result.margin).toBeCloseTo(40, 2);
      // Markup = (10 - 6) / 6 * 100 = 66.67%
      expect(result.markup).toBeCloseTo(66.67, 2);
      // Profit = 10 - 6 = 4
      expect(result.profit).toBeCloseTo(4, 2);
      // Margin > 20%, so no warning
      expect(result.marginWarning).toBe(false);
    });

    it('should set marginWarning to true when margin is below threshold', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Low Margin Product',
        basePrice: '10.00',
        costOfGoods: '9.00', // Only 10% margin
        category: 'bread',
        status: 'active',
        description: 'Test',
        recipeId: null,
        recipeName: null,
        estimatedPrepTime: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        minimumOrderQuantity: 1,
        storageInstructions: null,
        shelfLife: null,
        customizable: false,
        customizationOptions: null,
        popularityScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProduct]),
        }),
      });

      const result = await service.getProductById('product-1', mockTenantId);

      // Margin = (10 - 9) / 10 * 100 = 10%
      expect(result.margin).toBeCloseTo(10, 2);
      // Margin < 20%, so warning should be true
      expect(result.marginWarning).toBe(true);
    });

    it('should handle products without costOfGoods', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'No Cost Product',
        basePrice: '10.00',
        costOfGoods: null,
        category: 'bread',
        status: 'active',
        description: 'Test',
        recipeId: null,
        recipeName: null,
        estimatedPrepTime: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        minimumOrderQuantity: 1,
        storageInstructions: null,
        shelfLife: null,
        customizable: false,
        customizationOptions: null,
        popularityScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProduct]),
        }),
      });

      const result = await service.getProductById('product-1', mockTenantId);

      // All calculated fields should be null
      expect(result.margin).toBeNull();
      expect(result.markup).toBeNull();
      expect(result.profit).toBeNull();
      expect(result.marginWarning).toBe(false);
    });
  });

  describe('recalculateAllPopularity', () => {
    it('should recalculate popularity for all products', async () => {
      const mockProducts = [{ id: 'product-1' }, { id: 'product-2' }];

      const createMockProduct = (id: string, index: number) => ({
        id,
        name: `Product ${index + 1}`,
        popularityScore: 8,
        basePrice: '5.00',
        category: 'bread',
        status: 'active',
        description: 'Test',
        costOfGoods: null,
        recipeId: null,
        recipeName: null,
        estimatedPrepTime: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        nutritionalInfo: null,
        availableSeasons: null,
        minimumOrderQuantity: 1,
        storageInstructions: null,
        shelfLife: null,
        customizable: false,
        customizationOptions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock fetching all product IDs (with where chain)
      mockDatabaseService.database.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock calculatePopularity calls for each product
      // Each call needs: getProductById, customer count, internal count
      for (let i = 0; i < mockProducts.length; i++) {
        const productMock = createMockProduct(mockProducts[i]!.id, i);

        // Mock getProductById check
        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([productMock]),
          }),
        });

        // Mock customer order count
        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 5 }]),
          }),
        });

        // Mock internal order count
        mockDatabaseService.database.select.mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 3 }]),
          }),
        });

        mockDatabaseService.database.update.mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([productMock]),
            }),
          }),
        });
      }

      const result = await service.recalculateAllPopularity(mockTenantId);

      expect(result.updated).toBe(2);
    });
  });
});

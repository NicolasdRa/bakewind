import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { DatabaseService } from '../database/database.service';

describe('RecipesService', () => {
  let service: RecipesService;
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
        RecipesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecipes', () => {
    it('should return all recipes without filters', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Sourdough Bread',
        category: 'bread',
        description: 'Traditional sourdough',
        prepTime: 120,
        cookTime: 45,
        yield: 2,
        yieldUnit: 'loaves',
        costPerUnit: '1.50',
        sellingPrice: '5.00',
        productId: null,
        productName: null,
        instructions: ['Mix ingredients', 'Knead dough', 'Let rise', 'Bake'],
        nutritionalInfo: { calories: 250, protein: 8 },
        allergens: ['gluten'],
        tags: ['artisan', 'popular'],
        imageUrl: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockIngredients = [
        {
          id: 'ing-1',
          recipeId: 'recipe-1',
          ingredientId: 'inv-1',
          ingredientName: 'Flour',
          quantity: '500',
          unit: 'g',
          cost: '1.50',
          notes: null,
        },
        {
          id: 'ing-2',
          recipeId: 'recipe-1',
          ingredientId: 'inv-2',
          ingredientName: 'Water',
          quantity: '350',
          unit: 'ml',
          cost: '0.10',
          notes: null,
        },
      ];

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([mockRecipe]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockIngredients),
          }),
        });

      const result = await service.getRecipes(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Sourdough Bread');
      expect(result[0]!.totalTime).toBe(165); // 120 + 45
      expect(result[0]!.ingredients).toHaveLength(2);
      expect(result[0]!.totalIngredientCost).toBeCloseTo(1.6, 2);
      expect(result[0]!.costPerUnit).toBe(1.5);
      expect(result[0]!.margin).toBeCloseTo(70, 1); // (5 - 1.5) / 5 * 100
    });

    it('should filter recipes by category', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Croissant',
        category: 'pastry',
        description: 'Flaky pastry',
        prepTime: 180,
        cookTime: 20,
        yield: 12,
        yieldUnit: 'pieces',
        costPerUnit: '0.50',
        sellingPrice: '2.50',
        productId: null,
        productName: null,
        instructions: ['Prepare dough'],
        nutritionalInfo: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([mockRecipe]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const result = await service.getRecipes(mockTenantId, 'pastry');

      expect(result).toHaveLength(1);
      expect(result[0]!.category).toBe('pastry');
    });
  });

  describe('getRecipeById', () => {
    it('should return a recipe by ID', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Chocolate Cake',
        category: 'cake',
        description: 'Rich chocolate cake',
        prepTime: 30,
        cookTime: 35,
        yield: 1,
        yieldUnit: 'cake',
        costPerUnit: '8.00',
        sellingPrice: '25.00',
        productId: null,
        productName: null,
        instructions: ['Mix', 'Bake'],
        nutritionalInfo: { calories: 450 },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['celebration'],
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockIngredients = [
        {
          id: 'ing-1',
          recipeId: 'recipe-1',
          ingredientId: 'inv-1',
          ingredientName: 'Chocolate',
          quantity: '200',
          unit: 'g',
          cost: '5.00',
          notes: 'Premium dark chocolate',
        },
      ];

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockRecipe]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockIngredients),
          }),
        });

      const result = await service.getRecipeById('recipe-1', mockTenantId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Chocolate Cake');
      expect(result.totalTime).toBe(65);
      expect(result.ingredients[0]!.notes).toBe('Premium dark chocolate');
    });

    it('should throw NotFoundException if recipe not found', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.getRecipeById('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRecipe', () => {
    it('should create a new recipe with ingredients', async () => {
      const createDto = {
        name: 'Baguette',
        category: 'bread' as const,
        description: 'French bread',
        prepTime: 60,
        cookTime: 25,
        yield: 3,
        yieldUnit: 'loaves',
        sellingPrice: 3.5,
        instructions: ['Mix', 'Knead', 'Proof', 'Bake'],
        ingredients: [
          {
            ingredientId: 'inv-1',
            ingredientName: 'Flour',
            quantity: 500,
            unit: 'g',
            cost: 1.2,
          },
          {
            ingredientId: 'inv-2',
            ingredientName: 'Yeast',
            quantity: 10,
            unit: 'g',
            cost: 0.3,
          },
        ],
        isActive: true,
      };

      const mockCreated = {
        id: 'new-recipe-id',
        name: createDto.name,
        category: createDto.category,
        description: createDto.description,
        prepTime: createDto.prepTime,
        cookTime: createDto.cookTime,
        yield: createDto.yield,
        yieldUnit: createDto.yieldUnit,
        costPerUnit: '0.5000', // (1.2 + 0.3) / 3
        sellingPrice: '3.50',
        productId: null,
        productName: null,
        instructions: createDto.instructions,
        nutritionalInfo: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockCreated]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockResolvedValue(undefined),
        });

      // Mock for fetching ingredients after creation
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'ing-1',
              recipeId: 'new-recipe-id',
              ingredientId: 'inv-1',
              ingredientName: 'Flour',
              quantity: '500',
              unit: 'g',
              cost: '1.2000',
              notes: null,
            },
            {
              id: 'ing-2',
              recipeId: 'new-recipe-id',
              ingredientId: 'inv-2',
              ingredientName: 'Yeast',
              quantity: '10',
              unit: 'g',
              cost: '0.3000',
              notes: null,
            },
          ]),
        }),
      });

      const result = await service.createRecipe(createDto, mockTenantId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Baguette');
      expect(result.costPerUnit).toBe(0.5);
      expect(result.totalIngredientCost).toBeCloseTo(1.5, 2);
    });
  });

  describe('margin calculations', () => {
    it('should calculate margin, markup, and profit correctly', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Test Recipe',
        category: 'bread',
        description: 'Test',
        prepTime: 60,
        cookTime: 30,
        yield: 1,
        yieldUnit: 'unit',
        costPerUnit: '6.00',
        sellingPrice: '10.00',
        productId: null,
        productName: null,
        instructions: ['Test'],
        nutritionalInfo: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockRecipe]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const result = await service.getRecipeById('recipe-1', mockTenantId);

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
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Low Margin Recipe',
        category: 'bread',
        description: 'Test',
        prepTime: 60,
        cookTime: 30,
        yield: 1,
        yieldUnit: 'unit',
        costPerUnit: '9.00', // Only 10% margin
        sellingPrice: '10.00',
        productId: null,
        productName: null,
        instructions: ['Test'],
        nutritionalInfo: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockRecipe]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const result = await service.getRecipeById('recipe-1', mockTenantId);

      // Margin = (10 - 9) / 10 * 100 = 10%
      expect(result.margin).toBeCloseTo(10, 2);
      // Margin < 20%, so warning should be true
      expect(result.marginWarning).toBe(true);
    });

    it('should handle recipes without selling price', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'No Price Recipe',
        category: 'bread',
        description: 'Test',
        prepTime: 60,
        cookTime: 30,
        yield: 1,
        yieldUnit: 'unit',
        costPerUnit: '5.00',
        sellingPrice: null,
        productId: null,
        productName: null,
        instructions: ['Test'],
        nutritionalInfo: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockRecipe]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      const result = await service.getRecipeById('recipe-1', mockTenantId);

      // All calculated fields should be null
      expect(result.margin).toBeNull();
      expect(result.markup).toBeNull();
      expect(result.profit).toBeNull();
      expect(result.marginWarning).toBe(false);
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Test Recipe',
        category: 'bread',
        description: 'Test',
        prepTime: 60,
        cookTime: 30,
        yield: 1,
        yieldUnit: 'unit',
        costPerUnit: '5.00',
        sellingPrice: null,
        productId: null,
        productName: null,
        instructions: ['Test'],
        nutritionalInfo: null,
        allergens: null,
        tags: null,
        imageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getRecipeById
      mockDatabaseService.database.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockRecipe]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      // Mock delete
      mockDatabaseService.database.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteRecipe('recipe-1', mockTenantId);

      expect(mockDatabaseService.database.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting non-existent recipe', async () => {
      mockDatabaseService.database.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteRecipe('non-existent', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

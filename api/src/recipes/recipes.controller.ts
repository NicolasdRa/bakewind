import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { RecipesService } from './recipes.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeDto,
  RecipeCategory,
  createRecipeSchema,
  updateRecipeSchema,
} from './dto/recipe.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('recipes')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  /**
   * Get all recipes with optional filters
   * GET /recipes?category=bread&search=sourdough&isActive=true
   */
  @Get()
  @Roles(
    'ADMIN',
    'OWNER',
    'MANAGER',
    'HEAD_BAKER',
    'BAKER',
    'HEAD_PASTRY_CHEF',
    'PASTRY_CHEF',
  )
  async getRecipes(
    @CurrentTenant() tenantId: string,
    @Query('category') category?: RecipeCategory,
    @Query('search') search?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ): Promise<RecipeDto[]> {
    return this.recipesService.getRecipes(tenantId, category, search, isActive);
  }

  /**
   * Get active recipes only
   * GET /recipes/active
   */
  @Get('active')
  @Roles(
    'ADMIN',
    'OWNER',
    'MANAGER',
    'HEAD_BAKER',
    'BAKER',
    'HEAD_PASTRY_CHEF',
    'PASTRY_CHEF',
  )
  async getActiveRecipes(@CurrentTenant() tenantId: string): Promise<RecipeDto[]> {
    return this.recipesService.getActiveRecipes(tenantId);
  }

  /**
   * Get recipes by category
   * GET /recipes/category/:category
   */
  @Get('category/:category')
  @Roles(
    'ADMIN',
    'OWNER',
    'MANAGER',
    'HEAD_BAKER',
    'BAKER',
    'HEAD_PASTRY_CHEF',
    'PASTRY_CHEF',
  )
  async getRecipesByCategory(
    @CurrentTenant() tenantId: string,
    @Param('category') category: RecipeCategory,
  ): Promise<RecipeDto[]> {
    return this.recipesService.getRecipesByCategory(tenantId, category);
  }

  /**
   * Get a single recipe by ID
   * GET /recipes/:recipeId
   */
  @Get(':recipeId')
  @Roles(
    'ADMIN',
    'OWNER',
    'MANAGER',
    'HEAD_BAKER',
    'BAKER',
    'HEAD_PASTRY_CHEF',
    'PASTRY_CHEF',
  )
  async getRecipe(
    @CurrentTenant() tenantId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<RecipeDto> {
    return this.recipesService.getRecipeById(recipeId, tenantId);
  }

  /**
   * Create a new recipe
   * POST /recipes
   */
  @Post()
  @Roles('ADMIN', 'OWNER', 'MANAGER', 'HEAD_BAKER', 'HEAD_PASTRY_CHEF')
  async createRecipe(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(createRecipeSchema)) dto: CreateRecipeDto,
  ): Promise<RecipeDto> {
    return this.recipesService.createRecipe(dto, tenantId);
  }

  /**
   * Update an existing recipe
   * PUT /recipes/:recipeId
   */
  @Put(':recipeId')
  @Roles('ADMIN', 'OWNER', 'MANAGER', 'HEAD_BAKER', 'HEAD_PASTRY_CHEF')
  async updateRecipe(
    @CurrentTenant() tenantId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Body(new ZodValidationPipe(updateRecipeSchema)) dto: UpdateRecipeDto,
  ): Promise<RecipeDto> {
    return this.recipesService.updateRecipe(recipeId, dto, tenantId);
  }

  /**
   * Delete a recipe
   * DELETE /recipes/:recipeId
   */
  @Delete(':recipeId')
  @Roles('ADMIN', 'OWNER', 'MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRecipe(
    @CurrentTenant() tenantId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<void> {
    return this.recipesService.deleteRecipe(recipeId, tenantId);
  }

  /**
   * Recalculate recipe cost based on current ingredient prices
   * POST /recipes/:recipeId/recalculate-cost
   */
  @Post(':recipeId/recalculate-cost')
  @Roles('ADMIN', 'OWNER', 'MANAGER', 'HEAD_BAKER', 'HEAD_PASTRY_CHEF')
  async recalculateRecipeCost(
    @CurrentTenant() tenantId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<RecipeDto> {
    return this.recipesService.recalculateRecipeCost(recipeId, tenantId);
  }
}

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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  /**
   * Get all recipes with optional filters
   * GET /recipes?category=bread&search=sourdough&isActive=true
   */
  @Get()
  @Roles('ADMIN', 'MANAGER', 'HEAD_BAKER', 'BAKER', 'HEAD_PASTRY_CHEF', 'PASTRY_CHEF')
  async getRecipes(
    @Query('category') category?: RecipeCategory,
    @Query('search') search?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ): Promise<RecipeDto[]> {
    return this.recipesService.getRecipes(category, search, isActive);
  }

  /**
   * Get active recipes only
   * GET /recipes/active
   */
  @Get('active')
  @Roles('ADMIN', 'MANAGER', 'HEAD_BAKER', 'BAKER', 'HEAD_PASTRY_CHEF', 'PASTRY_CHEF')
  async getActiveRecipes(): Promise<RecipeDto[]> {
    return this.recipesService.getActiveRecipes();
  }

  /**
   * Get recipes by category
   * GET /recipes/category/:category
   */
  @Get('category/:category')
  @Roles('ADMIN', 'MANAGER', 'HEAD_BAKER', 'BAKER', 'HEAD_PASTRY_CHEF', 'PASTRY_CHEF')
  async getRecipesByCategory(
    @Param('category') category: RecipeCategory,
  ): Promise<RecipeDto[]> {
    return this.recipesService.getRecipesByCategory(category);
  }

  /**
   * Get a single recipe by ID
   * GET /recipes/:recipeId
   */
  @Get(':recipeId')
  @Roles('ADMIN', 'MANAGER', 'HEAD_BAKER', 'BAKER', 'HEAD_PASTRY_CHEF', 'PASTRY_CHEF')
  async getRecipe(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<RecipeDto> {
    return this.recipesService.getRecipeById(recipeId);
  }

  /**
   * Create a new recipe
   * POST /recipes
   */
  @Post()
  @Roles('ADMIN', 'MANAGER', 'HEAD_BAKER', 'HEAD_PASTRY_CHEF')
  async createRecipe(
    @Body(new ZodValidationPipe(createRecipeSchema)) dto: CreateRecipeDto,
  ): Promise<RecipeDto> {
    return this.recipesService.createRecipe(dto);
  }

  /**
   * Update an existing recipe
   * PUT /recipes/:recipeId
   */
  @Put(':recipeId')
  @Roles('ADMIN', 'MANAGER', 'HEAD_BAKER', 'HEAD_PASTRY_CHEF')
  async updateRecipe(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Body(new ZodValidationPipe(updateRecipeSchema)) dto: UpdateRecipeDto,
  ): Promise<RecipeDto> {
    return this.recipesService.updateRecipe(recipeId, dto);
  }

  /**
   * Delete a recipe
   * DELETE /recipes/:recipeId
   */
  @Delete(':recipeId')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRecipe(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<void> {
    return this.recipesService.deleteRecipe(recipeId);
  }

  /**
   * Recalculate recipe cost based on current ingredient prices
   * POST /recipes/:recipeId/recalculate-cost
   */
  @Post(':recipeId/recalculate-cost')
  @Roles('ADMIN', 'MANAGER', 'HEAD_BAKER', 'HEAD_PASTRY_CHEF')
  async recalculateRecipeCost(
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<RecipeDto> {
    return this.recipesService.recalculateRecipeCost(recipeId);
  }
}

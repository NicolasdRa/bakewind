import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProductsService } from './products.service';
import {
  createProductSchema,
  updateProductSchema,
  CreateProductDto,
  UpdateProductDto,
  ProductCategory,
  ProductStatus,
} from './dto/product.dto';

@ApiTags('products')
@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ProductsController {
  // Products CRUD endpoints
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products with optional filters' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: [
      'bread',
      'pastry',
      'cake',
      'cookie',
      'sandwich',
      'beverage',
      'seasonal',
      'custom',
    ],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'seasonal', 'discontinued'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProducts(
    @CurrentTenant() tenantId: string,
    @Query('category') category?: ProductCategory,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
  ) {
    return this.productsService.getProducts(tenantId, category, status, search);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get only active products' })
  @ApiResponse({ status: 200, description: 'Active products retrieved' })
  async getActiveProducts(@CurrentTenant() tenantId: string) {
    return this.productsService.getActiveProducts(tenantId);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products by category retrieved' })
  async getProductsByCategory(
    @CurrentTenant() tenantId: string,
    @Param('category') category: ProductCategory,
  ) {
    return this.productsService.getProductsByCategory(tenantId, category);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
  ) {
    return this.productsService.getProductById(productId, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createProduct(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(createProductSchema))
    dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(dto, tenantId);
  }

  @Put(':productId')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(updateProductSchema))
    dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(productId, dto, tenantId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
  ) {
    await this.productsService.deleteProduct(productId, tenantId);
  }

  @Post(':productId/calculate-popularity')
  @ApiOperation({
    summary: 'Calculate and update product popularity based on order counts',
    description:
      'Recalculates popularity score by counting customer orders and internal orders containing this product',
  })
  @ApiResponse({
    status: 200,
    description: 'Popularity score calculated and updated',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async calculatePopularity(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
  ) {
    return this.productsService.calculatePopularity(productId, tenantId);
  }

  @Post('recalculate-all-popularity')
  @ApiOperation({
    summary: 'Recalculate popularity for all products',
    description:
      'Batch update all product popularity scores based on order counts. Useful for scheduled jobs or manual refresh.',
  })
  @ApiResponse({
    status: 200,
    description: 'All product popularity scores recalculated',
  })
  async recalculateAllPopularity(@CurrentTenant() tenantId: string) {
    return this.productsService.recalculateAllPopularity(tenantId);
  }

  @Post(':productId/sync-from-recipe')
  @ApiOperation({
    summary: 'Sync product cost from linked recipe',
    description:
      "Updates costOfGoods from the linked recipe's costPerUnit. Implements Layer 2 of Dual-Layer Cost Calculation.",
  })
  @ApiResponse({
    status: 200,
    description: 'Product cost synced from recipe successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or not linked to a recipe',
  })
  async syncCostFromRecipe(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
  ) {
    return this.productsService.syncCostFromRecipe(productId, tenantId);
  }

  @Post('sync-all-from-recipes')
  @ApiOperation({
    summary: 'Sync costs for all products linked to recipes',
    description:
      'Batch update all recipe-linked products with current recipe costs. Useful after ingredient prices change.',
  })
  @ApiResponse({
    status: 200,
    description: 'All recipe-linked product costs synced',
  })
  async syncAllCostsFromRecipes(@CurrentTenant() tenantId: string) {
    return this.productsService.syncAllCostsFromRecipes(tenantId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SoftwareFeaturesService } from './software-features.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Features')
@Controller('features')
export class FeaturesController {
  constructor(private readonly softwareFeaturesService: SoftwareFeaturesService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for public endpoint
  @ApiOperation({ summary: 'Get all active software features' })
  @ApiQuery({
    name: 'category',
    description: 'Filter features by category',
    required: false,
    enum: ['orders', 'inventory', 'production', 'analytics', 'customers', 'products'],
  })
  @ApiQuery({
    name: 'highlighted',
    description: 'Get only highlighted features for landing page',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: 200,
    description: 'List of software features',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          iconName: { type: 'string' },
          category: {
            type: 'string',
            enum: ['orders', 'inventory', 'production', 'analytics', 'customers', 'products']
          },
          availableInPlans: { type: 'array', items: { type: 'string' } },
          demoUrl: { type: 'string', nullable: true },
          helpDocUrl: { type: 'string', nullable: true },
          sortOrder: { type: 'number' },
          isHighlighted: { type: 'boolean' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getFeatures(
    @Query('category') category?: string,
    @Query('highlighted') highlighted?: string
  ) {
    if (highlighted === 'true') {
      return this.softwareFeaturesService.getHighlightedFeatures();
    }

    if (category) {
      return this.softwareFeaturesService.getFeaturesByCategory(category);
    }

    return this.softwareFeaturesService.getAllFeatures();
  }

  @Public()
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get feature categories with counts' })
  @ApiResponse({
    status: 200,
    description: 'List of feature categories',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' },
          features: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                iconName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async getFeatureCategories() {
    return this.softwareFeaturesService.getFeatureCategories();
  }

  @Public()
  @Get('matrix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get feature availability matrix for pricing page' })
  @ApiResponse({
    status: 200,
    description: 'Feature availability matrix organized by category',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            iconName: { type: 'string' },
            availableInPlans: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async getFeatureMatrix() {
    return this.softwareFeaturesService.getFeatureAvailabilityMatrix();
  }

  @Public()
  @Get('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare features across multiple plans' })
  @ApiQuery({
    name: 'planIds',
    description: 'Comma-separated list of plan IDs to compare',
    required: true,
    type: 'string',
    example: 'plan-starter,plan-professional,plan-business',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature comparison matrix',
    schema: {
      type: 'object',
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              iconName: { type: 'string' },
              availability: { type: 'object' },
            },
          },
        },
        planIds: { type: 'array', items: { type: 'string' } },
        totalFeatures: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid plan IDs',
  })
  async compareFeatures(@Query('planIds') planIds: string) {
    if (!planIds) {
      throw new BadRequestException('planIds query parameter is required');
    }

    const planIdArray = planIds.split(',').map(id => id.trim());
    if (planIdArray.length < 2) {
      throw new BadRequestException('At least 2 plan IDs are required for comparison');
    }

    return this.softwareFeaturesService.compareFeatures(planIdArray);
  }

  @Public()
  @Get('plans/:planId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get features available in a specific plan' })
  @ApiParam({ name: 'planId', description: 'Plan ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Features available in the specified plan',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          iconName: { type: 'string' },
          category: { type: 'string' },
          demoUrl: { type: 'string', nullable: true },
          helpDocUrl: { type: 'string', nullable: true },
          sortOrder: { type: 'number' },
          isHighlighted: { type: 'boolean' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async getFeaturesByPlan(@Param('planId') planId: string) {
    return this.softwareFeaturesService.getFeaturesByPlanId(planId);
  }

  @Public()
  @Get(':featureId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific feature by ID' })
  @ApiParam({ name: 'featureId', description: 'Feature ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Feature details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        iconName: { type: 'string' },
        category: { type: 'string' },
        availableInPlans: { type: 'array', items: { type: 'string' } },
        demoUrl: { type: 'string', nullable: true },
        helpDocUrl: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isHighlighted: { type: 'boolean' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Feature not found',
  })
  async getFeature(@Param('featureId') featureId: string) {
    return this.softwareFeaturesService.getFeatureById(featureId);
  }

  // Admin endpoints below require authentication

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new software feature (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Feature created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid feature data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async createFeature(
    @Body() createFeatureDto: {
      name: string;
      description: string;
      iconName: string;
      category: 'orders' | 'inventory' | 'production' | 'analytics' | 'customers' | 'products';
      availableInPlans: string[];
      demoUrl?: string;
      helpDocUrl?: string;
      sortOrder: number;
      isHighlighted?: boolean;
    }
  ) {
    return this.softwareFeaturesService.createFeature(createFeatureDto);
  }

  @Patch(':featureId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a software feature (Admin only)' })
  @ApiParam({ name: 'featureId', description: 'Feature ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Feature updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid feature data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Feature not found',
  })
  async updateFeature(
    @Param('featureId') featureId: string,
    @Body() updateFeatureDto: {
      description?: string;
      iconName?: string;
      category?: 'orders' | 'inventory' | 'production' | 'analytics' | 'customers' | 'products';
      availableInPlans?: string[];
      demoUrl?: string;
      helpDocUrl?: string;
      sortOrder?: number;
      isHighlighted?: boolean;
      isActive?: boolean;
    }
  ) {
    return this.softwareFeaturesService.updateFeature(featureId, updateFeatureDto);
  }

  @Delete(':featureId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate a software feature (Admin only)' })
  @ApiParam({ name: 'featureId', description: 'Feature ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Feature deactivated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Feature not found',
  })
  async deleteFeature(@Param('featureId') featureId: string) {
    return this.softwareFeaturesService.deleteFeature(featureId);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Seed default software features (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Default features seeded successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async seedDefaultFeatures() {
    return this.softwareFeaturesService.seedDefaultFeatures();
  }
}
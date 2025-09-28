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
  Request,
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
import { SubscriptionPlansService } from './subscription-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Public()
  @Get('plans')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for public endpoint
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          priceMonthlyUsd: { type: 'number' },
          priceAnnualUsd: { type: 'number' },
          maxLocations: { type: 'number', nullable: true },
          maxUsers: { type: 'number', nullable: true },
          features: { type: 'array', items: { type: 'string' } },
          stripePriceIdMonthly: { type: 'string' },
          stripePriceIdAnnual: { type: 'string' },
          isPopular: { type: 'boolean' },
          sortOrder: { type: 'number' },
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
  async getPlans() {
    return this.subscriptionPlansService.getAllPlans();
  }

  @Public()
  @Get('plans/:planId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific subscription plan by ID' })
  @ApiParam({ name: 'planId', description: 'Plan ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        priceMonthlyUsd: { type: 'number' },
        priceAnnualUsd: { type: 'number' },
        maxLocations: { type: 'number', nullable: true },
        maxUsers: { type: 'number', nullable: true },
        features: { type: 'array', items: { type: 'string' } },
        stripePriceIdMonthly: { type: 'string' },
        stripePriceIdAnnual: { type: 'string' },
        isPopular: { type: 'boolean' },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async getPlan(@Param('planId') planId: string) {
    return this.subscriptionPlansService.getPlanById(planId);
  }

  @Public()
  @Get('plans/compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare multiple subscription plans' })
  @ApiQuery({
    name: 'planIds',
    description: 'Comma-separated list of plan IDs to compare',
    required: true,
    type: 'string',
    example: 'plan-1,plan-2,plan-3'
  })
  @ApiResponse({
    status: 200,
    description: 'Plan comparison matrix',
    schema: {
      type: 'object',
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              priceMonthlyUsd: { type: 'number' },
              priceAnnualUsd: { type: 'number' },
              hasFeatures: { type: 'object' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid plan IDs',
  })
  async comparePlans(@Query('planIds') planIds: string) {
    if (!planIds) {
      throw new BadRequestException('planIds query parameter is required');
    }

    const planIdArray = planIds.split(',').map(id => id.trim());
    if (planIdArray.length < 2) {
      throw new BadRequestException('At least 2 plan IDs are required for comparison');
    }

    return this.subscriptionPlansService.comparePlans(planIdArray);
  }

  @Public()
  @Get('plans/recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recommended plan based on business size' })
  @ApiQuery({
    name: 'businessSize',
    description: 'Business size category',
    required: true,
    enum: ['1', '2-3', '4-10', '10+']
  })
  @ApiResponse({
    status: 200,
    description: 'Recommended subscription plan',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        priceMonthlyUsd: { type: 'number' },
        priceAnnualUsd: { type: 'number' },
        maxLocations: { type: 'number', nullable: true },
        maxUsers: { type: 'number', nullable: true },
        features: { type: 'array', items: { type: 'string' } },
        isPopular: { type: 'boolean' },
        sortOrder: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid business size',
  })
  async getRecommendedPlan(@Query('businessSize') businessSize: '1' | '2-3' | '4-10' | '10+') {
    if (!businessSize || !['1', '2-3', '4-10', '10+'].includes(businessSize)) {
      throw new BadRequestException('Valid businessSize is required (1, 2-3, 4-10, 10+)');
    }

    const plan = await this.subscriptionPlansService.getRecommendedPlan(businessSize);
    if (!plan) {
      throw new NotFoundException('No recommended plan found');
    }

    return plan;
  }

  // Admin endpoints below require authentication

  @Post('plans')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new subscription plan (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid plan data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async createPlan(
    @Body() createPlanDto: {
      name: string;
      description: string;
      priceMonthlyUsd: number;
      priceAnnualUsd: number;
      maxLocations?: number;
      maxUsers?: number;
      features: string[];
      stripePriceIdMonthly?: string;
      stripePriceIdAnnual?: string;
      isPopular?: boolean;
      sortOrder: number;
    }
  ) {
    return this.subscriptionPlansService.createPlan(createPlanDto);
  }

  @Patch('plans/:planId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a subscription plan (Admin only)' })
  @ApiParam({ name: 'planId', description: 'Plan ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid plan data',
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
    description: 'Plan not found',
  })
  async updatePlan(
    @Param('planId') planId: string,
    @Body() updatePlanDto: {
      description?: string;
      priceMonthlyUsd?: number;
      priceAnnualUsd?: number;
      maxLocations?: number;
      maxUsers?: number;
      features?: string[];
      stripePriceIdMonthly?: string;
      stripePriceIdAnnual?: string;
      isPopular?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return this.subscriptionPlansService.updatePlan(planId, updatePlanDto);
  }

  @Delete('plans/:planId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate a subscription plan (Admin only)' })
  @ApiParam({ name: 'planId', description: 'Plan ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Plan deactivated successfully',
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
    description: 'Plan not found',
  })
  async deletePlan(@Param('planId') planId: string) {
    return this.subscriptionPlansService.deletePlan(planId);
  }

  @Post('plans/seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Seed default subscription plans (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Default plans seeded successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async seedDefaultPlans() {
    return this.subscriptionPlansService.seedDefaultPlans();
  }

  @Post('plans/:planId/sync-stripe')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sync plan with Stripe (Admin only)' })
  @ApiParam({ name: 'planId', description: 'Plan ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Plan synced with Stripe successfully',
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
    description: 'Plan not found',
  })
  async syncPlanWithStripe(@Param('planId') planId: string) {
    return this.subscriptionPlansService.syncWithStripe(planId);
  }
}
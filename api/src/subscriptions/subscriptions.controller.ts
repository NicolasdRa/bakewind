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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanResponseDto,
  SubscriptionPlanQueryDto,
} from './dto/subscription-plans.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plans retrieved',
    type: [SubscriptionPlanResponseDto],
  })
  async getSubscriptionPlans(
    @Query() query: SubscriptionPlanQueryDto,
  ): Promise<SubscriptionPlanResponseDto[]> {
    const onlyActive = query.active === 'true' || query.active === undefined;
    return this.subscriptionPlansService.findAll(onlyActive);
  }

  @Public()
  @Get('plans/popular')
  @ApiOperation({ summary: 'Get popular subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'Popular subscription plans retrieved',
    type: [SubscriptionPlanResponseDto],
  })
  async getPopularPlans(): Promise<SubscriptionPlanResponseDto[]> {
    return this.subscriptionPlansService.getPopularPlans();
  }

  @Public()
  @Get('plans/compare')
  @ApiOperation({ summary: 'Compare multiple subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'Plan comparison data retrieved',
  })
  async comparePlans(@Query('planIds') planIds: string) {
    const planIdArray = planIds.split(',').filter((id) => id.trim());
    return this.subscriptionPlansService.comparePlans(planIdArray);
  }

  @Public()
  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan retrieved',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async getSubscriptionPlan(
    @Param('id') id: string,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('plans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new subscription plan (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async createSubscriptionPlan(
    @Body() createPlanDto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.create(createPlanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan updated',
    type: SubscriptionPlanResponseDto,
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
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.update(id, updatePlanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate subscription plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan activated',
    type: SubscriptionPlanResponseDto,
  })
  async activatePlan(
    @Param('id') id: string,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.activate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate subscription plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan deactivated',
    type: SubscriptionPlanResponseDto,
  })
  async deactivatePlan(
    @Param('id') id: string,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.deactivate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id/popular')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set plan as popular (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Plan popularity status updated',
    type: SubscriptionPlanResponseDto,
  })
  async setPopular(
    @Param('id') id: string,
    @Body('isPopular') isPopular: boolean,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.setPopular(id, isPopular);
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder subscription plans (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Plans reordered successfully',
    type: [SubscriptionPlanResponseDto],
  })
  async reorderPlans(
    @Body() planOrders: { id: string; sortOrder: number }[],
  ): Promise<SubscriptionPlanResponseDto[]> {
    return this.subscriptionPlansService.reorderPlans(planOrders);
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id/stripe-prices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Stripe price IDs for plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Stripe price IDs updated',
    type: SubscriptionPlanResponseDto,
  })
  async updateStripePrices(
    @Param('id') id: string,
    @Body() priceIds: { monthlyPriceId?: string; annualPriceId?: string },
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.updateStripePriceIds(
      id,
      priceIds.monthlyPriceId,
      priceIds.annualPriceId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('plans/:id/validate-limits')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate plan limits for current usage' })
  @ApiResponse({
    status: 200,
    description: 'Plan limits validation result',
  })
  async validatePlanLimits(
    @Param('id') planId: string,
    @Body() usage: { currentLocations: number; currentUsers: number },
  ) {
    return this.subscriptionPlansService.validatePlanLimits(
      planId,
      usage.currentLocations,
      usage.currentUsers,
    );
  }
}

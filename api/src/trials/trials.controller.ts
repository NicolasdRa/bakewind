import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import { TrialAccountsService } from './trial-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Trials')
@Controller('trials')
export class TrialsController {
  constructor(private readonly trialAccountsService: TrialAccountsService) {}

  @Patch(':trialId/onboarding')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Update trial onboarding progress' })
  @ApiParam({ name: 'trialId', description: 'Trial Account ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding progress updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        businessSize: { type: 'string' },
        onboardingStatus: {
          type: 'string',
          enum: ['pending', 'started', 'in_progress', 'completed', 'abandoned']
        },
        onboardingStepsCompleted: { type: 'array', items: { type: 'string' } },
        lastOnboardingActivity: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid onboarding data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own trial',
  })
  @ApiResponse({
    status: 404,
    description: 'Trial not found',
  })
  async updateOnboarding(
    @Param('trialId') trialId: string,
    @Body() updateOnboardingDto: {
      onboardingStatus?: 'pending' | 'started' | 'in_progress' | 'completed' | 'abandoned';
      onboardingStepsCompleted?: string[];
    },
    @Request() req: any
  ) {
    const userId = req.user.id;

    // Verify trial belongs to user (unless admin)
    const trial = await this.trialAccountsService.getTrialById(trialId);
    if (trial.userId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('Can only update your own trial onboarding');
    }

    return this.trialAccountsService.updateOnboardingProgress(trialId, updateOnboardingDto);
  }

  @Get(':trialId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get trial account details' })
  @ApiParam({ name: 'trialId', description: 'Trial Account ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Trial account details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        businessSize: { type: 'string' },
        onboardingStatus: { type: 'string' },
        onboardingStepsCompleted: { type: 'array', items: { type: 'string' } },
        lastOnboardingActivity: { type: 'string', format: 'date-time', nullable: true },
        hasConvertedToPaid: { type: 'boolean' },
        convertedAt: { type: 'string', format: 'date-time', nullable: true },
        subscriptionPlanId: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only view own trial',
  })
  @ApiResponse({
    status: 404,
    description: 'Trial not found',
  })
  async getTrial(@Param('trialId') trialId: string, @Request() req: any) {
    const userId = req.user.id;
    const trial = await this.trialAccountsService.getTrialById(trialId);

    // Users can only view their own trial (unless admin)
    if (trial.userId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('Can only view your own trial');
    }

    return trial;
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get trial account for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User trial account',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        businessSize: { type: 'string' },
        onboardingStatus: { type: 'string' },
        onboardingStepsCompleted: { type: 'array', items: { type: 'string' } },
        lastOnboardingActivity: { type: 'string', format: 'date-time', nullable: true },
        hasConvertedToPaid: { type: 'boolean' },
        convertedAt: { type: 'string', format: 'date-time', nullable: true },
        subscriptionPlanId: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only view own trial',
  })
  @ApiResponse({
    status: 404,
    description: 'Trial not found',
  })
  async getTrialByUserId(@Param('userId') userId: string, @Request() req: any) {
    // Users can only view their own trial (unless admin)
    if (userId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('Can only view your own trial');
    }

    return this.trialAccountsService.getTrialByUserId(userId);
  }

  @Post(':trialId/convert')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Convert trial to paid subscription' })
  @ApiParam({ name: 'trialId', description: 'Trial Account ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Trial converted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        subscriptionPlanId: { type: 'string' },
        convertedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid conversion data or trial already converted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only convert own trial',
  })
  @ApiResponse({
    status: 404,
    description: 'Trial not found',
  })
  async convertTrial(
    @Param('trialId') trialId: string,
    @Body() convertTrialDto: {
      subscriptionPlanId: string;
    },
    @Request() req: any
  ) {
    const userId = req.user.id;

    // Verify trial belongs to user (unless admin)
    const trial = await this.trialAccountsService.getTrialById(trialId);
    if (trial.userId !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('Can only convert your own trial');
    }

    return this.trialAccountsService.convertToPaid(trialId, convertTrialDto.subscriptionPlanId);
  }

  // Admin endpoints below require admin access

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all trial accounts with pagination (Admin only)' })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-based)',
    required: false,
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: 'number',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by onboarding status',
    required: false,
    enum: ['pending', 'started', 'in_progress', 'completed', 'abandoned'],
  })
  @ApiQuery({
    name: 'businessSize',
    description: 'Filter by business size',
    required: false,
    enum: ['1', '2-3', '4-10', '10+'],
  })
  @ApiQuery({
    name: 'converted',
    description: 'Filter by conversion status',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: 200,
    description: 'List of trial accounts',
    schema: {
      type: 'object',
      properties: {
        trials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              businessSize: { type: 'string' },
              onboardingStatus: { type: 'string' },
              onboardingStepsCompleted: { type: 'array', items: { type: 'string' } },
              lastOnboardingActivity: { type: 'string', format: 'date-time', nullable: true },
              hasConvertedToPaid: { type: 'boolean' },
              convertedAt: { type: 'string', format: 'date-time', nullable: true },
              subscriptionPlanId: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllTrials(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('businessSize') businessSize?: string,
    @Query('converted') converted?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const convertedBool = converted === 'true' ? true : converted === 'false' ? false : undefined;

    return this.trialAccountsService.getAllTrials({
      page: pageNum,
      limit: limitNum,
      status: status as any,
      businessSize: businessSize as any,
      converted: convertedBool,
    });
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get trial analytics and conversion metrics (Admin only)' })
  @ApiQuery({
    name: 'period',
    description: 'Analytics period',
    required: false,
    enum: ['7d', '30d', '90d', '1y', 'all'],
  })
  @ApiResponse({
    status: 200,
    description: 'Trial analytics data',
    schema: {
      type: 'object',
      properties: {
        totalTrials: { type: 'number' },
        activeTrials: { type: 'number' },
        convertedTrials: { type: 'number' },
        conversionRate: { type: 'number' },
        averageTimeToConversion: { type: 'number' },
        onboardingCompletion: { type: 'number' },
        businessSizeDistribution: { type: 'object' },
        conversionByBusinessSize: { type: 'object' },
        onboardingFunnelData: { type: 'object' },
        recentActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              signups: { type: 'number' },
              conversions: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getTrialAnalytics(@Query('period') period?: string) {
    return this.trialAccountsService.getTrialAnalytics(period || '30d');
  }

  @Get('onboarding/progress')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get onboarding progress statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding progress statistics',
    schema: {
      type: 'object',
      properties: {
        totalTrials: { type: 'number' },
        byStatus: {
          type: 'object',
          properties: {
            pending: { type: 'number' },
            started: { type: 'number' },
            in_progress: { type: 'number' },
            completed: { type: 'number' },
            abandoned: { type: 'number' },
          },
        },
        stepCompletion: { type: 'object' },
        averageCompletionTime: { type: 'number' },
        dropoffPoints: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getOnboardingProgress() {
    return this.trialAccountsService.getOnboardingProgressStats();
  }

  @Post('bulk-update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk update trial accounts (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Trials updated successfully',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk update data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async bulkUpdateTrials(
    @Body() bulkUpdateDto: {
      trialIds: string[];
      updateData: {
        onboardingStatus?: 'pending' | 'started' | 'in_progress' | 'completed' | 'abandoned';
      };
    }
  ) {
    return this.trialAccountsService.bulkUpdateTrials(bulkUpdateDto.trialIds, bulkUpdateDto.updateData);
  }
}
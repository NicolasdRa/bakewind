import {
  Controller,
  Get,
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
import { SaasUsersService } from './saas-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { subscriptionStatusValues } from '../common/constants/subscription-status.constants';
import {
  UpdateUserProfileDto,
  ChangePasswordDto,
  UserProfileResponseDto,
  UserAccountSettingsDto,
} from './dto/user-profile.dto';

@ApiTags('User Profile')
@Controller('users')
export class SaasUsersController {
  constructor(private readonly saasUsersService: SaasUsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getCurrentUserProfile(
    @Request() req: any,
  ): Promise<UserProfileResponseDto> {
    const userId = req.user.userId;
    return this.saasUsersService.getUserProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid profile data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateCurrentUserProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    const userId = req.user.userId;
    return this.saasUsersService.updateProfile(userId, updateProfileDto);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password data or current password incorrect',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.userId;
    await this.saasUsersService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @Get('account-settings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user account settings' })
  @ApiResponse({
    status: 200,
    description: 'Account settings retrieved successfully',
    type: UserAccountSettingsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getAccountSettings(
    @Request() req: any,
  ): Promise<UserAccountSettingsDto> {
    const userId = req.user.userId;
    return this.saasUsersService.getAccountSettings(userId);
  }

  @Patch('account-settings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Update user account settings' })
  @ApiResponse({
    status: 200,
    description: 'Account settings updated successfully',
    type: UserAccountSettingsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid settings data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateAccountSettings(
    @Request() req: any,
    @Body() settingsDto: UserAccountSettingsDto,
  ): Promise<UserAccountSettingsDto> {
    const userId = req.user.userId;
    return this.saasUsersService.updateAccountSettings(userId, settingsDto);
  }

  @Get('subscription-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user subscription status and details' })
  @ApiResponse({
    status: 200,
    description: 'Subscription status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [...subscriptionStatusValues],
        },
        planId: { type: 'string', nullable: true },
        planName: { type: 'string', nullable: true },
        currentPeriodStart: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        currentPeriodEnd: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        trialEndsAt: { type: 'string', format: 'date-time', nullable: true },
        cancelAtPeriodEnd: { type: 'boolean' },
        usage: {
          type: 'object',
          properties: {
            locationsUsed: { type: 'number' },
            locationsLimit: { type: 'number', nullable: true },
            usersUsed: { type: 'number' },
            usersLimit: { type: 'number', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getSubscriptionStatus(@Request() req: any) {
    const userId = req.user.userId;
    return this.saasUsersService.getSubscriptionStatus(userId);
  }

  @Get('billing-history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user billing history' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of records to return',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Billing history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        invoices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string' },
              status: { type: 'string' },
              invoiceDate: { type: 'string', format: 'date-time' },
              dueDate: { type: 'string', format: 'date-time' },
              paidAt: { type: 'string', format: 'date-time', nullable: true },
              invoiceUrl: { type: 'string', nullable: true },
              description: { type: 'string' },
            },
          },
        },
        hasMore: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getBillingHistory(@Request() req: any, @Query('limit') limit?: string) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.saasUsersService.getBillingHistory(userId, limitNum);
  }

  @Get('usage-stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user account usage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        locations: {
          type: 'object',
          properties: {
            current: { type: 'number' },
            limit: { type: 'number', nullable: true },
            percentage: { type: 'number' },
          },
        },
        users: {
          type: 'object',
          properties: {
            current: { type: 'number' },
            limit: { type: 'number', nullable: true },
            percentage: { type: 'number' },
          },
        },
        storage: {
          type: 'object',
          properties: {
            current: { type: 'number' },
            limit: { type: 'number', nullable: true },
            percentage: { type: 'number' },
            unit: { type: 'string' },
          },
        },
        apiCalls: {
          type: 'object',
          properties: {
            thisMonth: { type: 'number' },
            limit: { type: 'number', nullable: true },
            percentage: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUsageStats(@Request() req: any) {
    const userId = req.user.userId;
    return this.saasUsersService.getUsageStatistics(userId);
  }

  // Admin endpoints below require admin access

  @Get(':userId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile by ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
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
    description: 'User not found',
  })
  async getUserById(
    @Param('userId') userId: string,
  ): Promise<UserProfileResponseDto> {
    return this.saasUsersService.getUserProfile(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
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
    name: 'search',
    description: 'Search by email or company name',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'role',
    description: 'Filter by user role',
    required: false,
    enum: ['owner', 'admin', 'manager', 'staff'],
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by account status',
    required: false,
    enum: ['active', 'inactive', 'suspended'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserProfileResponseDto' },
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
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.saasUsersService.getAllUsers({
      page: pageNum,
      limit: limitNum,
      search,
      role: role as any,
      status: status as any,
    });
  }

  @Patch(':userId/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user account status (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status data',
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
    description: 'User not found',
  })
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body()
    statusDto: { status: 'active' | 'inactive' | 'suspended'; reason?: string },
  ): Promise<UserProfileResponseDto> {
    return this.saasUsersService.updateUserStatus(
      userId,
      statusDto.status,
      statusDto.reason,
    );
  }
}

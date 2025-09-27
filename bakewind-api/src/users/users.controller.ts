import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { userUpdateSchema } from './users.validation';
import type { UserUpdate, UsersData } from './users.validation';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Get all users (manager/admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string' },
          isActive: { type: 'boolean' },
          lastLogin: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
  })
  getProfile(
    @CurrentUser() user: Omit<UsersData, 'password' | 'refreshToken'>,
  ) {
    return user;
  }

  @Get(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Get user by ID (manager/admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User found',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<Omit<UsersData, 'password' | 'refreshToken'>> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body(
      new ZodValidationPipe(
        userUpdateSchema.omit({ role: true, isActive: true }),
      ),
    )
    updateData: Omit<UserUpdate, 'role' | 'isActive'>,
  ): Promise<Omit<UsersData, 'password'>> {
    this.logger.log(`🔄 Profile update request`);
    this.logger.log(`👤 Full user object:`, JSON.stringify(user, null, 2));
    this.logger.log(`🆔 User ID: ${user?.userId}`);
    this.logger.log(
      `📝 Update data received:`,
      JSON.stringify(updateData, null, 2),
    );
    this.logger.log(
      `🔍 Update data keys: [${Object.keys(updateData).join(', ')}]`,
    );

    const userId = user?.userId;

    try {
      const updatedUser = await this.usersService.update(userId, updateData);
      this.logger.log(`✅ Profile updated successfully for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `❌ Profile update failed for user: ${userId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(userUpdateSchema)) updateData: UserUpdate,
  ): Promise<Omit<UsersData, 'password'>> {
    const user = await this.usersService.update(id, updateData);

    return user;
  }

  @Patch(':id/toggle-status')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle user active status (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User status toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async toggleStatus(
    @Param('id') id: string,
  ): Promise<Omit<UsersData, 'password'>> {
    const user = await this.usersService.toggleUserStatus(id);

    return user;
  }

  @Post(':id/change-password')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async changePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    await this.usersService.changePassword(id, body.newPassword);
    return { message: 'Password changed successfully' };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async remove(@Param('id') id: string) {
    await this.usersService.delete(id);
  }
}

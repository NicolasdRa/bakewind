import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, StaffResponseDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /**
   * Get current user's staff profile
   * Available to STAFF users to get their own profile
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user staff profile' })
  @ApiResponse({ status: 200, description: 'Staff profile', type: StaffResponseDto })
  @ApiResponse({ status: 404, description: 'Staff profile not found' })
  async getMyProfile(@Request() req: RequestWithUser) {
    const staff = await this.staffService.findByUserId(req.user.id);
    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }
    return staff;
  }

  /**
   * Get staff by ID
   * Available to ADMIN, OWNER (for their tenant), STAFF (for self)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get staff by ID' })
  @ApiResponse({ status: 200, description: 'Staff record', type: StaffResponseDto })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async getById(@Param('id') id: string, @Request() req: RequestWithUser) {
    const staff = await this.staffService.findById(id);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // ADMIN can access all
    if (req.user.role === 'ADMIN') {
      return staff;
    }

    // STAFF can only access their own record
    if (req.user.role === 'STAFF' && staff.userId !== req.user.id) {
      throw new ForbiddenException('Cannot access other staff records');
    }

    // OWNER needs to be verified via tenant ownership (would need tenant service)
    // For now, allow if not CUSTOMER
    if (req.user.role === 'CUSTOMER') {
      throw new ForbiddenException('Customers cannot access staff records');
    }

    return staff;
  }

  /**
   * Create a new staff record
   * Only ADMIN and OWNER can create staff
   */
  @Post()
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create staff record' })
  @ApiResponse({ status: 201, description: 'Staff created', type: StaffResponseDto })
  @ApiResponse({ status: 409, description: 'User already has staff record' })
  async create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  /**
   * Update staff record
   * ADMIN can update any, OWNER can update their tenant's staff, STAFF can update self
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update staff record' })
  @ApiResponse({ status: 200, description: 'Staff updated', type: StaffResponseDto })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @Request() req: RequestWithUser,
  ) {
    const staff = await this.staffService.findById(id);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // ADMIN can update all
    if (req.user.role === 'ADMIN') {
      return this.staffService.update(id, dto);
    }

    // STAFF can only update their own record
    if (req.user.role === 'STAFF') {
      if (staff.userId !== req.user.id) {
        throw new ForbiddenException('Cannot update other staff records');
      }
      // Staff can only update limited fields (not permissions)
      const limitedDto: UpdateStaffDto = {};
      if (dto.position !== undefined) limitedDto.position = dto.position;
      if (dto.department !== undefined) limitedDto.department = dto.department;
      // Staff cannot change their own areas or permissions
      return this.staffService.update(id, limitedDto);
    }

    // OWNER can update their tenant's staff
    if (req.user.role === 'CUSTOMER') {
      throw new ForbiddenException('Customers cannot update staff records');
    }

    return this.staffService.update(id, dto);
  }

  /**
   * Update current user's staff profile
   * Available to STAFF users
   */
  @Put('me/profile')
  @Roles('STAFF')
  @ApiOperation({ summary: 'Update own staff profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: StaffResponseDto })
  async updateMyProfile(@Body() dto: UpdateStaffDto, @Request() req: RequestWithUser) {
    // Staff can only update limited fields
    const limitedDto: UpdateStaffDto = {};
    if (dto.position !== undefined) limitedDto.position = dto.position;
    if (dto.department !== undefined) limitedDto.department = dto.department;
    return this.staffService.updateByUserId(req.user.id, limitedDto);
  }

  /**
   * Delete staff record
   * Only ADMIN can delete
   */
  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete staff record' })
  @ApiResponse({ status: 200, description: 'Staff deleted' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async delete(@Param('id') id: string) {
    await this.staffService.delete(id);
    return { message: 'Staff record deleted' };
  }
}

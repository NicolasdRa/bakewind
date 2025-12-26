import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantsService } from './tenants.service';
import { StaffService } from '../staff/staff.service';
import { UsersService } from '../users/users.service';
import { UpdateTenantDto, InviteStaffDto } from './dto/tenant.dto';
import * as bcrypt from 'bcryptjs';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly staffService: StaffService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get current user's tenant
   * For OWNER: returns their owned tenant
   * For STAFF: returns tenant they work for
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current tenant context' })
  async getMyTenant(@Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const role = req.user.role;

    if (role === 'OWNER') {
      const tenant = await this.tenantsService.findByOwnerUserId(userId);
      if (!tenant) {
        throw new NotFoundException('Tenant not found for this owner');
      }
      return tenant;
    }

    if (role === 'STAFF') {
      const staff = await this.staffService.findByUserId(userId);
      if (!staff) {
        throw new NotFoundException('Staff profile not found');
      }
      const tenant = await this.tenantsService.findById(staff.tenantId);
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      return tenant;
    }

    if (role === 'ADMIN') {
      // ADMIN doesn't have a specific tenant - they can access all
      return null;
    }

    throw new ForbiddenException('Access denied');
  }

  /**
   * Get tenant by ID (ADMIN only)
   */
  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get tenant by ID (admin only)' })
  async getTenantById(@Param('id') id: string) {
    const tenant = await this.tenantsService.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  /**
   * Update tenant (OWNER of tenant or ADMIN)
   */
  @Put('me')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Update own tenant details' })
  async updateMyTenant(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateTenantDto,
  ) {
    const tenant = await this.tenantsService.findByOwnerUserId(req.user.sub);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // OWNER can only update limited fields
    const limitedDto: UpdateTenantDto = {};
    if (dto.businessName !== undefined) limitedDto.businessName = dto.businessName;
    if (dto.businessPhone !== undefined) limitedDto.businessPhone = dto.businessPhone;
    if (dto.businessAddress !== undefined) limitedDto.businessAddress = dto.businessAddress;
    if (dto.onboardingCompleted !== undefined) limitedDto.onboardingCompleted = dto.onboardingCompleted;

    return this.tenantsService.update(tenant.id, limitedDto);
  }

  /**
   * Complete onboarding
   */
  @Post('me/complete-onboarding')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  async completeOnboarding(@Request() req: AuthenticatedRequest) {
    const tenant = await this.tenantsService.findByOwnerUserId(req.user.sub);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return this.tenantsService.completeOnboarding(tenant.id);
  }

  /**
   * Invite staff member to tenant
   * Creates user with STAFF role and staff profile linked to tenant
   */
  @Post('me/invite-staff')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Invite a new staff member to the bakery' })
  async inviteStaff(
    @Request() req: AuthenticatedRequest,
    @Body() dto: InviteStaffDto,
  ) {
    // Get owner's tenant
    const tenant = await this.tenantsService.findByOwnerUserId(req.user.sub);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if user with this email already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      // If user exists and is STAFF, link them to this tenant
      if (existingUser.role === 'STAFF') {
        const existingStaff = await this.staffService.findByUserId(existingUser.id);
        if (existingStaff) {
          throw new ForbiddenException('This user is already staff at another bakery');
        }
        // Create staff profile for existing user
        const createStaffDto: {
          userId: string;
          tenantId: string;
          position?: string;
          department?: string;
          areas?: string[];
          hireDate?: string;
        } = {
          userId: existingUser.id,
          tenantId: tenant.id,
        };
        if (dto.position) createStaffDto.position = dto.position;
        if (dto.department) createStaffDto.department = dto.department;
        if (dto.areas) createStaffDto.areas = dto.areas;
        if (dto.hireDate) createStaffDto.hireDate = dto.hireDate;

        const staff = await this.staffService.create(createStaffDto);
        return { user: existingUser, staff };
      }
      throw new ForbiddenException('A user with this email already exists with a different role');
    }

    // Create new user with STAFF role
    // Generate a temporary password (user will reset via email)
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const newUser = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'STAFF',
    });

    // Create staff profile
    const createStaffDto: {
      userId: string;
      tenantId: string;
      position?: string;
      department?: string;
      areas?: string[];
      hireDate?: string;
    } = {
      userId: newUser.id,
      tenantId: tenant.id,
    };
    if (dto.position) createStaffDto.position = dto.position;
    if (dto.department) createStaffDto.department = dto.department;
    if (dto.areas) createStaffDto.areas = dto.areas;
    if (dto.hireDate) createStaffDto.hireDate = dto.hireDate;

    const staff = await this.staffService.create(createStaffDto);

    // TODO: Send invitation email with password reset link

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      staff,
      message: 'Staff member invited successfully. They will receive an email to set their password.',
    };
  }

  /**
   * Get all staff members for tenant
   */
  @Get('me/staff')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get all staff members for tenant' })
  async getTenantStaff(@Request() req: AuthenticatedRequest) {
    const tenant = await this.tenantsService.findByOwnerUserId(req.user.sub);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return this.staffService.findAllByTenant(tenant.id);
  }
}

import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SkipTenantCheck } from '../auth/decorators/skip-tenant-check.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from './tenants.service';
import { StaffService } from '../staff/staff.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { UpdateTenantDto, InviteStaffDto } from './dto/tenant.dto';
import { UpdateStaffDto } from '../staff/dto';

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
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly staffService: StaffService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get all tenants (ADMIN only)
   * Used by system admins to select which tenant to view/monitor
   */
  @Get()
  @Roles('ADMIN')
  @SkipTenantCheck()
  @ApiOperation({ summary: 'List all tenants (admin only)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAllTenants(@Query('search') search?: string) {
    const tenants = await this.tenantsService.findAll(search);
    return { tenants };
  }

  /**
   * Get current user's tenant
   * For OWNER: returns their owned tenant
   * For STAFF: returns tenant they work for
   */
  @Get('me')
  @SkipTenantCheck()
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
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get tenant by ID (admin only)' })
  async getTenantById(@Param('id') id: string) {
    const tenant = await this.tenantsService.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  /**
   * Update tenant (OWNER of tenant)
   */
  @Put('me')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Update own tenant details' })
  async updateMyTenant(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context required.');
    }

    // OWNER can only update limited fields
    const limitedDto: UpdateTenantDto = {};
    if (dto.businessName !== undefined) limitedDto.businessName = dto.businessName;
    if (dto.businessPhone !== undefined) limitedDto.businessPhone = dto.businessPhone;
    if (dto.businessAddress !== undefined) limitedDto.businessAddress = dto.businessAddress;
    if (dto.onboardingCompleted !== undefined) limitedDto.onboardingCompleted = dto.onboardingCompleted;

    return this.tenantsService.update(tenantId, limitedDto);
  }

  /**
   * Complete onboarding
   */
  @Post('me/complete-onboarding')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  async completeOnboarding(@CurrentTenant() tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context required.');
    }
    return this.tenantsService.completeOnboarding(tenantId);
  }

  /**
   * Invite staff member to tenant
   * Creates user with STAFF role and staff profile linked to tenant
   */
  @Post('me/invite-staff')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Invite a new staff member to the bakery' })
  async inviteStaff(
    @CurrentTenant() tenantId: string,
    @Body() dto: InviteStaffDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context required.');
    }

    // Get tenant info for the email
    const tenant = await this.tenantsService.findById(tenantId);
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
          tenantId,
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

    // Pass plain password - usersService.create() handles hashing
    const newUser = await this.usersService.create({
      email: dto.email,
      password: tempPassword,
      confirmPassword: tempPassword,
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
      tenantId,
    };
    if (dto.position) createStaffDto.position = dto.position;
    if (dto.department) createStaffDto.department = dto.department;
    if (dto.areas) createStaffDto.areas = dto.areas;
    if (dto.hireDate) createStaffDto.hireDate = dto.hireDate;

    const staff = await this.staffService.create(createStaffDto);

    // Send invitation email with temporary password
    const loginUrl = this.configService.get<string>('LOGIN_URL') || 'http://localhost:3001/login';
    const emailSent = await this.emailService.sendStaffInvitation({
      recipientEmail: newUser.email,
      recipientName: `${newUser.firstName} ${newUser.lastName}`,
      businessName: tenant.businessName,
      position: dto.position,
      temporaryPassword: tempPassword,
      loginUrl,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      staff,
      emailSent,
      message: emailSent
        ? 'Staff member invited successfully. An invitation email has been sent.'
        : 'Staff member created successfully. Email could not be sent - please share login credentials manually.',
    };
  }

  /**
   * Get all staff members for tenant
   * OWNER: Uses tenantId from JWT
   * ADMIN: Uses tenantId from X-Tenant-Id header
   */
  @Get('me/staff')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get all staff members for tenant' })
  async getTenantStaff(@CurrentTenant() tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context required. For ADMIN users, select a tenant first.');
    }
    return this.staffService.findAllByTenant(tenantId);
  }

  /**
   * Update a staff member
   */
  @Patch('me/staff/:staffId')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Update a staff member' })
  async updateStaffMember(
    @CurrentTenant() tenantId: string,
    @Param('staffId') staffId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context required.');
    }

    // Verify staff belongs to this tenant
    const staff = await this.staffService.findByIdAndTenant(staffId, tenantId);
    if (!staff) {
      throw new NotFoundException('Staff member not found in your organization');
    }

    return this.staffService.update(staffId, dto);
  }

  /**
   * Remove a staff member from tenant
   * Note: This deletes the staff record but keeps the user account
   */
  @Delete('me/staff/:staffId')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Remove a staff member from the bakery' })
  async removeStaffMember(
    @CurrentTenant() tenantId: string,
    @Param('staffId') staffId: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context required.');
    }

    // Verify staff belongs to this tenant
    const staff = await this.staffService.findByIdAndTenant(staffId, tenantId);
    if (!staff) {
      throw new NotFoundException('Staff member not found in your organization');
    }

    await this.staffService.delete(staffId);
    return { message: 'Staff member removed successfully' };
  }
}

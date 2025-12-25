import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, IsDateString, IsObject } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ description: 'User ID for this staff member' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Tenant ID (bakery business)' })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({ description: 'Staff position/title' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Assigned work areas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];

  @ApiPropertyOptional({ description: 'Permission flags' })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;

  @ApiPropertyOptional({ description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ description: 'Staff position/title' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Assigned work areas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];

  @ApiPropertyOptional({ description: 'Permission flags' })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;

  @ApiPropertyOptional({ description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;
}

export class StaffResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  tenantId: string;

  @ApiPropertyOptional()
  position?: string | null;

  @ApiPropertyOptional()
  department?: string | null;

  @ApiProperty({ type: [String] })
  areas: string[];

  @ApiPropertyOptional()
  permissions?: Record<string, boolean>;

  @ApiPropertyOptional()
  hireDate?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Professional',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Ideal for growing bakeries with multiple locations',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Monthly price in cents',
    example: 14900,
  })
  @IsNumber()
  @Min(0)
  priceMonthlyUsd: number;

  @ApiProperty({
    description: 'Annual price in cents',
    example: 143040,
  })
  @IsNumber()
  @Min(0)
  priceAnnualUsd: number;

  @ApiPropertyOptional({
    description: 'Maximum number of locations',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  maxLocations?: number | null;

  @ApiPropertyOptional({
    description: 'Maximum number of users',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  maxUsers?: number | null;

  @ApiPropertyOptional({
    description: 'List of feature IDs included in this plan',
    example: ['advanced_analytics', 'multi_location', 'staff_management'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Stripe monthly price ID',
    example: 'price_1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @ApiPropertyOptional({
    description: 'Stripe annual price ID',
    example: 'price_1234567890abcdef_annual',
  })
  @IsOptional()
  @IsString()
  stripePriceIdAnnual?: string;

  @ApiPropertyOptional({
    description: 'Mark as popular plan',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 2,
  })
  @IsNumber()
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Whether the plan is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({
    description: 'Plan name',
    example: 'Professional Plus',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Enhanced plan for growing bakeries',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Monthly price in cents',
    example: 19900,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthlyUsd?: number;

  @ApiPropertyOptional({
    description: 'Annual price in cents',
    example: 191040,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAnnualUsd?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of locations',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  maxLocations?: number | null;

  @ApiPropertyOptional({
    description: 'Maximum number of users',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  maxUsers?: number | null;

  @ApiPropertyOptional({
    description: 'List of feature IDs included in this plan',
    example: ['advanced_analytics', 'multi_location', 'staff_management', 'api_access'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Stripe monthly price ID',
    example: 'price_1234567890abcdef_updated',
  })
  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @ApiPropertyOptional({
    description: 'Stripe annual price ID',
    example: 'price_1234567890abcdef_annual_updated',
  })
  @IsOptional()
  @IsString()
  stripePriceIdAnnual?: string;

  @ApiPropertyOptional({
    description: 'Mark as popular plan',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the plan is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SubscriptionPlanResponseDto {
  @ApiProperty({
    description: 'Plan ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Professional',
  })
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Ideal for growing bakeries with multiple locations',
  })
  description: string;

  @ApiProperty({
    description: 'Monthly price in cents',
    example: 14900,
  })
  priceMonthlyUsd: number;

  @ApiProperty({
    description: 'Annual price in cents',
    example: 143040,
  })
  priceAnnualUsd: number;

  @ApiProperty({
    description: 'Maximum number of locations',
    example: 3,
    nullable: true,
  })
  maxLocations: number | null;

  @ApiProperty({
    description: 'Maximum number of users',
    example: 10,
    nullable: true,
  })
  maxUsers: number | null;

  @ApiProperty({
    description: 'List of features included in this plan',
    example: ['advanced_analytics', 'multi_location', 'staff_management'],
  })
  features: string[];

  @ApiProperty({
    description: 'Stripe monthly price ID',
    example: 'price_1234567890abcdef',
    nullable: true,
  })
  stripePriceIdMonthly: string | null;

  @ApiProperty({
    description: 'Stripe annual price ID',
    example: 'price_1234567890abcdef_annual',
    nullable: true,
  })
  stripePriceIdAnnual: string | null;

  @ApiProperty({
    description: 'Whether this is a popular plan',
    example: true,
  })
  isPopular: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 2,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Plan creation date',
    example: '2025-09-27T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Plan last update date',
    example: '2025-09-27T12:00:00Z',
  })
  updatedAt: string;
}

export class SubscriptionPlanQueryDto {
  @ApiPropertyOptional({
    description: 'Filter to only active plans',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  active?: string;
}
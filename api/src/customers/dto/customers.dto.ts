import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  customerCreationSchema,
  customerUpdateSchema,
} from '../customers.validation';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto extends createZodDto(customerCreationSchema) {}

export class UpdateCustomerDto extends createZodDto(customerUpdateSchema) {}

export class CustomerResponseDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  id!: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'Jane Smith',
  })
  name!: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'jane.smith@email.com',
    nullable: true,
  })
  email!: string | null;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+1 (555) 987-6543',
    nullable: true,
  })
  phone!: string | null;

  @ApiProperty({
    description: 'Customer address',
    example: '456 Oak Avenue, Springfield, IL 62701',
    nullable: true,
  })
  address!: string | null;

  @ApiProperty({
    description: 'Company or organization name',
    example: 'Springfield Elementary School',
    nullable: true,
  })
  company!: string | null;

  @ApiProperty({
    description: 'Customer notes or preferences',
    example: 'Prefers gluten-free options, large orders for school events',
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty({
    description: 'Customer type',
    example: 'business',
    enum: ['individual', 'business', 'restaurant', 'event_planner'],
  })
  customerType!: 'individual' | 'business' | 'restaurant' | 'event_planner';

  @ApiProperty({
    description: 'Preferred contact method',
    example: 'email',
    enum: ['email', 'phone', 'text'],
    nullable: true,
  })
  preferredContact!: 'email' | 'phone' | 'text' | null;

  @ApiProperty({
    description: 'Customer status',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status!: 'active' | 'inactive';

  @ApiProperty({
    description: 'Marketing opt-in status',
    example: true,
  })
  marketingOptIn!: boolean;

  @ApiProperty({
    description: 'Total number of orders',
    example: 15,
  })
  totalOrders!: number;

  @ApiProperty({
    description: 'Total amount spent',
    example: 1250.75,
  })
  totalSpent!: number;

  @ApiProperty({
    description: 'Average order value',
    example: 83.38,
  })
  averageOrderValue!: number;

  @ApiProperty({
    description: 'Last order date',
    example: '2025-09-20T14:30:00Z',
    nullable: true,
  })
  lastOrderAt!: string | null;

  @ApiProperty({
    description: 'Customer since date',
    example: '2025-01-15T10:00:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last updated date',
    example: '2025-09-25T16:45:00Z',
  })
  updatedAt!: string;
}

export class CustomerQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Search by name, email, or phone',
    example: 'jane smith',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer status',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Filter by customer type',
    example: 'business',
    enum: ['individual', 'business', 'restaurant', 'event_planner'],
  })
  @IsOptional()
  @IsEnum(['individual', 'business', 'restaurant', 'event_planner'])
  customerType?: 'individual' | 'business' | 'restaurant' | 'event_planner';

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'name',
    enum: ['name', 'email', 'createdAt', 'lastOrderAt', 'totalSpent'],
  })
  @IsOptional()
  @IsEnum(['name', 'email', 'createdAt', 'lastOrderAt', 'totalSpent'])
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastOrderAt' | 'totalSpent';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

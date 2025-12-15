import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsObject,
  IsInt,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InternalOrderSource {
  CAFE = 'cafe',
  RESTAURANT = 'restaurant',
  FRONT_HOUSE = 'front_house',
  CATERING = 'catering',
  RETAIL = 'retail',
  EVENTS = 'events',
}

export enum InternalOrderStatus {
  DRAFT = 'draft',
  REQUESTED = 'requested',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  IN_PRODUCTION = 'in_production',
  QUALITY_CHECK = 'quality_check',
  READY = 'ready',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum InternalOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum InternalOrderFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class CreateInternalOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit cost as string' })
  @IsOptional()
  @IsString()
  unitCost?: string;

  @ApiPropertyOptional({ description: 'Special instructions for this item' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Item customizations' })
  @IsOptional()
  @IsObject()
  customizations?: Record<string, any>;
}

export class CreateInternalOrderDto {
  @ApiProperty({ description: 'Order number (unique identifier)' })
  @IsString()
  orderNumber: string;

  @ApiProperty({
    enum: InternalOrderSource,
    description: 'Source department/area within the company',
  })
  @IsEnum(InternalOrderSource)
  source: InternalOrderSource;

  @ApiPropertyOptional({
    enum: InternalOrderStatus,
    description: 'Order status',
    default: InternalOrderStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(InternalOrderStatus)
  status?: InternalOrderStatus;

  @ApiPropertyOptional({
    enum: InternalOrderPriority,
    description: 'Order priority',
    default: InternalOrderPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(InternalOrderPriority)
  priority?: InternalOrderPriority;

  @ApiProperty({ description: 'Name of person requesting the order' })
  @IsString()
  requestedBy: string;

  @ApiPropertyOptional({ description: 'Email of person requesting' })
  @IsOptional()
  @IsEmail()
  requestedByEmail?: string;

  @ApiProperty({ description: 'Department making the request' })
  @IsString()
  department: string;

  @ApiPropertyOptional({ description: 'Total cost of the order' })
  @IsOptional()
  @IsString()
  totalCost?: string;

  @ApiProperty({ description: 'Date order was requested (ISO 8601)' })
  @IsDateString()
  requestedDate: string;

  @ApiProperty({ description: 'Date order is needed by (ISO 8601)' })
  @IsDateString()
  neededByDate: string;

  @ApiPropertyOptional({ description: 'Name of person who approved' })
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiPropertyOptional({ description: 'Date order was approved (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  @ApiPropertyOptional({ description: 'Special instructions for the order' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  // Production-specific fields
  @ApiPropertyOptional({ description: 'Production date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  productionDate?: string;

  @ApiPropertyOptional({ description: 'Production shift (morning, afternoon, night)' })
  @IsOptional()
  @IsString()
  productionShift?: string;

  @ApiPropertyOptional({ description: 'Batch number for traceability' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Staff member(s) assigned to production' })
  @IsOptional()
  @IsString()
  assignedStaff?: string;

  @ApiPropertyOptional({ description: 'Workstation or equipment assigned' })
  @IsOptional()
  @IsString()
  workstation?: string;

  @ApiPropertyOptional({ description: 'Target quantity to produce' })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetQuantity?: number;

  @ApiPropertyOptional({ description: 'Actual quantity produced' })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualQuantity?: number;

  @ApiPropertyOptional({ description: 'Waste quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  wasteQuantity?: number;

  @ApiPropertyOptional({ description: 'Quality control notes' })
  @IsOptional()
  @IsString()
  qualityNotes?: string;

  // Recurring order fields
  @ApiPropertyOptional({ description: 'Is this a recurring order?', default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: InternalOrderFrequency,
    description: 'Frequency for recurring orders',
  })
  @IsOptional()
  @IsEnum(InternalOrderFrequency)
  recurringFrequency?: InternalOrderFrequency;

  @ApiPropertyOptional({ description: 'Next order date for recurring orders (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  nextOrderDate?: string;

  @ApiPropertyOptional({ description: 'End date for recurring orders (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  recurringEndDate?: string;

  @ApiProperty({
    description: 'Order items',
    type: [CreateInternalOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInternalOrderItemDto)
  items: CreateInternalOrderItemDto[];
}

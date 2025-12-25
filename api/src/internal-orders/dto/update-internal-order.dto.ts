import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import {
  InternalOrderStatus,
  InternalOrderPriority,
  InternalOrderFrequency,
} from './create-internal-order.dto';

export class UpdateInternalOrderDto {
  @ApiPropertyOptional({
    enum: InternalOrderStatus,
    description: 'Order status',
  })
  @IsOptional()
  @IsEnum(InternalOrderStatus)
  status?: InternalOrderStatus;

  @ApiPropertyOptional({
    enum: InternalOrderPriority,
    description: 'Order priority',
  })
  @IsOptional()
  @IsEnum(InternalOrderPriority)
  priority?: InternalOrderPriority;

  @ApiPropertyOptional({ description: 'Name of person requesting the order' })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({ description: 'Email of person requesting' })
  @IsOptional()
  @IsEmail()
  requestedByEmail?: string;

  @ApiPropertyOptional({ description: 'Total cost of the order' })
  @IsOptional()
  @IsString()
  totalCost?: string;

  @ApiPropertyOptional({ description: 'Date order is needed by (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  neededByDate?: string;

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

  @ApiPropertyOptional({
    description: 'Production shift (morning, afternoon, night)',
  })
  @IsOptional()
  @IsString()
  productionShift?: string;

  @ApiPropertyOptional({ description: 'Batch number for traceability' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'Staff member(s) assigned to production',
  })
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
  @ApiPropertyOptional({ description: 'Is this a recurring order?' })
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

  @ApiPropertyOptional({
    description: 'Next order date for recurring orders (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  nextOrderDate?: string;

  @ApiPropertyOptional({
    description: 'End date for recurring orders (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  recurringEndDate?: string;
}

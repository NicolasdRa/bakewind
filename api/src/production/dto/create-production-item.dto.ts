import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export enum ProductionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateProductionItemDto {
  @ApiPropertyOptional({ description: 'Order ID (links to internal order)' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ description: 'Recipe ID' })
  @IsUUID()
  recipeId: string;

  @ApiProperty({ description: 'Recipe name' })
  @IsString()
  recipeName: string;

  @ApiProperty({ description: 'Quantity to produce', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    enum: ProductionStatus,
    description: 'Production status',
    default: ProductionStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(ProductionStatus)
  status?: ProductionStatus;

  @ApiProperty({ description: 'Scheduled time (ISO 8601)' })
  @IsDateString()
  scheduledTime: string;

  @ApiPropertyOptional({ description: 'Start time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Completed time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  completedTime?: string;

  @ApiPropertyOptional({ description: 'Assigned to user/staff' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Notes for this production item' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Batch number for traceability' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Quality check passed' })
  @IsOptional()
  @IsBoolean()
  qualityCheck?: boolean;

  @ApiPropertyOptional({ description: 'Quality check notes' })
  @IsOptional()
  @IsString()
  qualityNotes?: string;
}

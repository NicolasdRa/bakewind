import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionStatus } from './create-production-item.dto';

export class ProductionItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  schedule_id: string;

  @ApiPropertyOptional()
  order_id?: string | null;

  @ApiProperty()
  recipe_id: string;

  @ApiProperty()
  recipe_name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ enum: ProductionStatus })
  status: ProductionStatus;

  @ApiProperty()
  scheduled_time: string;

  @ApiPropertyOptional()
  start_time?: string | null;

  @ApiPropertyOptional()
  completed_time?: string | null;

  @ApiPropertyOptional()
  assigned_to?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  batch_number?: string | null;

  @ApiProperty()
  quality_check: boolean;

  @ApiPropertyOptional()
  quality_notes?: string | null;
}

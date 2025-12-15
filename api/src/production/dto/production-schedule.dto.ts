import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionItemDto } from './production-item.dto';

export class ProductionScheduleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  total_items: number;

  @ApiProperty()
  completed_items: number;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  created_by: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;

  @ApiProperty({ type: [ProductionItemDto] })
  items: ProductionItemDto[];
}

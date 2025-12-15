import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductionItemDto } from './create-production-item.dto';

export class CreateProductionScheduleDto {
  @ApiProperty({ description: 'Production date (YYYY-MM-DD format)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Notes for the production schedule' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({ description: 'Production items to be produced', type: [CreateProductionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductionItemDto)
  items: CreateProductionItemDto[];
}

import { PartialType } from '@nestjs/swagger';
import { CreateProductionItemDto } from './create-production-item.dto';

export class UpdateProductionItemDto extends PartialType(
  CreateProductionItemDto,
) {}

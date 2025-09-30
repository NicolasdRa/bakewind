import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../common/dto/base-response.dto';

export class HealthStatusDto {
  @ApiProperty({
    description: 'Service status',
    example: 'UP',
    type: String,
  })
  status!: string;

  @ApiProperty({
    description: 'Current timestamp',
    example: '2025-03-21T12:00:00.000Z',
    type: String,
  })
  timestamp!: string;
}

export class HealthResponseDto extends BaseResponseDto<HealthStatusDto> {
  @ApiProperty({
    description: 'Health status data',
    type: HealthStatusDto,
  })
  declare data: HealthStatusDto;
}

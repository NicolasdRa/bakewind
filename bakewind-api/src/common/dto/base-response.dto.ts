import { ApiProperty } from '@nestjs/swagger';
import { ResponseCode } from '../constants/response-codes.constants';

export abstract class BaseResponseDto<T> {
  @ApiProperty({
    description: 'Response status code',
    example: ResponseCode.SUCCESS,
    type: Number,
  })
  status!: ResponseCode;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
    type: String,
  })
  message!: string;

  data?: T | null;
}

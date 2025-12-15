import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

// Zod validation schemas
export const acquireLockSchema = z.object({
  order_id: z.string().uuid('Order ID must be a valid UUID'),
  order_type: z.enum(['customer', 'internal']),
  session_id: z.string().min(1, 'Session ID is required'),
});

export const orderLockResponseSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  locked_by_user_id: z.string().uuid(),
  locked_by_user_name: z.string(),
  locked_by_session_id: z.string(),
  locked_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  last_activity_at: z.string().datetime(),
});

// DTOs using createZodDto
export class AcquireLockDto extends createZodDto(acquireLockSchema) {}

export class OrderLockResponseDto extends createZodDto(
  orderLockResponseSchema,
) {}

// Unlocked status response
export class UnlockedStatusDto {
  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  order_id!: string;

  @ApiProperty({
    description: 'Lock status',
    example: false,
  })
  locked!: false;
}

// Lock conflict error
export class LockConflictErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 409,
  })
  statusCode!: 409;

  @ApiProperty({
    description: 'Error message',
    example: 'Order is currently locked by another user',
  })
  message!: string;

  @ApiProperty({
    description: 'Current lock information',
    type: OrderLockResponseDto,
  })
  locked_by!: OrderLockResponseDto;
}

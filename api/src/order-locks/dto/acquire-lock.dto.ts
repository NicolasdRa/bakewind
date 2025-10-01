import { z } from 'zod';

// Zod validation schemas
export const acquireLockSchema = z.object({
  order_id: z.string().uuid('Order ID must be a valid UUID'),
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

// TypeScript types inferred from schemas
export type AcquireLockDto = z.infer<typeof acquireLockSchema>;
export type OrderLockResponseDto = z.infer<typeof orderLockResponseSchema>;

// Unlocked status response
export interface UnlockedStatusDto {
  order_id: string;
  locked: false;
}

// Lock conflict error
export interface LockConflictErrorDto {
  statusCode: 409;
  message: string;
  locked_by: OrderLockResponseDto;
}

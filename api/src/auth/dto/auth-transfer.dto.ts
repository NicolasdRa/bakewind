import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * DTO for creating an auth transfer session
 */
export const createTransferSessionSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  userId: z.string().uuid('Invalid user ID format'),
});

export class CreateTransferSessionDto extends createZodDto(createTransferSessionSchema) {}

/**
 * DTO for exchanging a session ID for tokens
 */
export const exchangeTransferSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export class ExchangeTransferSessionDto extends createZodDto(exchangeTransferSessionSchema) {}

/**
 * Response type for transfer session creation
 */
export interface TransferSessionResponse {
  sessionId: string;
  expiresIn: number; // seconds
}

/**
 * Response type for transfer session exchange
 */
export interface TransferSessionTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

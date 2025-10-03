import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * DTO for creating an auth transfer session
 */
export const createTransferSessionSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  userId: z.string().uuid('Invalid user ID format'),
});

export class CreateTransferSessionDto extends createZodDto(
  createTransferSessionSchema,
) {}

/**
 * DTO for exchanging a session ID for tokens
 */
export const exchangeTransferSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export class ExchangeTransferSessionDto extends createZodDto(
  exchangeTransferSessionSchema,
) {}

/**
 * DTO for creating cookie session
 */
export class CreateCookieSessionDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken!: string;
}

/**
 * Response DTO for transfer session creation
 */
export class TransferSessionResponseDto {
  @ApiProperty({
    description: 'Unique session ID for token exchange',
    example: 'a1b2c3d4e5f6...',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Time until session expires (seconds)',
    example: 60,
  })
  expiresIn!: number;
}

/**
 * Response DTO for transfer session exchange
 */
export class TransferSessionTokensDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId!: string;
}

/**
 * Response DTO for cookie session creation
 */
export class CreateCookieSessionResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Session created successfully',
  })
  message!: string;
}

// Keep legacy interfaces for backward compatibility
export interface TransferSessionResponse {
  sessionId: string;
  expiresIn: number;
}

export interface TransferSessionTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

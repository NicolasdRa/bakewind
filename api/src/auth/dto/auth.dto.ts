import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsBoolean, IsEnum, MinLength } from 'class-validator';

export class CreateTrialSignupDto {
  @ApiProperty({
    description: 'Name of the bakery or business',
    example: 'Sweet Dreams Bakery',
  })
  @IsString()
  businessName!: string;

  @ApiProperty({
    description: "User's full name",
    example: 'John Smith',
  })
  @IsString()
  fullName!: string;

  @ApiProperty({
    description: 'Business email address',
    example: 'john@sweetdreamsbakery.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+1 (555) 123-4567',
  })
  @IsString()
  phone!: string;

  @ApiProperty({
    description: 'Account password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Number of bakery locations',
    example: '2-3',
    enum: ['1', '2-3', '4-10', '10+'],
  })
  @IsEnum(['1', '2-3', '4-10', '10+'])
  locations!: '1' | '2-3' | '4-10' | '10+';

  @ApiProperty({
    description: 'Agreement to terms of service',
    example: true,
  })
  @IsBoolean()
  agreeToTerms!: boolean;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john@sweetdreamsbakery.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password',
    example: 'SecurePassword123!',
  })
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'refresh_token_value',
  })
  @IsString()
  refreshToken!: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@sweetdreamsbakery.com',
  })
  email!: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Smith',
  })
  lastName!: string;

  @ApiProperty({
    description: 'Business name',
    example: 'Sweet Dreams Bakery',
  })
  businessName!: string;

  @ApiProperty({
    description: 'User role',
    example: 'trial_user',
    enum: ['trial_user', 'subscriber', 'admin'],
  })
  role!: string;

  @ApiProperty({
    description: 'Subscription status',
    example: 'trial',
    enum: ['trial', 'active', 'past_due', 'canceled'],
  })
  subscriptionStatus!: string;

  @ApiProperty({
    description: 'Trial end date',
    example: '2025-10-11T23:59:59Z',
    nullable: true,
  })
  trialEndsAt!: string | null;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2025-09-27T12:00:00Z',
  })
  createdAt!: string;
}

export class AuthSuccessResponseDto {
  @ApiProperty({
    description: 'User profile information',
  })
  user!: any;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Refresh token (also set as httpOnly cookie)',
    example: 'refresh_token_value',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'URL to redirect to dashboard',
    example: '/admin/overview',
  })
  dashboardUrl!: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken!: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Invalid input data',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'VALIDATION_ERROR',
  })
  code?: string;

  @ApiProperty({
    description: 'Detailed validation errors',
    example: {
      email: ['Email is already registered'],
      password: ['Password must be at least 8 characters'],
    },
  })
  details?: Record<string, string[]>;
}
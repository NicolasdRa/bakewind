import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsBoolean,
  IsEnum,
  MinLength,
} from 'class-validator';
import { userRoleValues } from '../../common/constants/roles.constants';
import { subscriptionStatusValues } from '../../common/constants/subscription-status.constants';

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
    enum: userRoleValues,
  })
  role!: string;

  @ApiProperty({
    description: 'Subscription status',
    example: 'trial',
    enum: subscriptionStatusValues,
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

export class RegisterUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password (min 8 characters, must contain uppercase, lowercase, and number)',
    example: 'SecurePass123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'SecurePass123',
  })
  @IsString()
  confirmPassword!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({
    description: 'Phone number in international format (optional)',
    example: '+1234567890',
    required: false,
    nullable: true,
  })
  @IsString()
  phoneNumber?: string | null;

  @ApiProperty({
    description: 'User biography (optional)',
    example: 'Experienced baker with 10+ years in artisan bread making',
    maxLength: 1000,
    required: false,
    nullable: true,
  })
  @IsString()
  bio?: string | null;

  @ApiProperty({
    description: 'User role (optional, defaults to GUEST)',
    example: 'GUEST',
    enum: userRoleValues,
    required: false,
  })
  @IsEnum(userRoleValues)
  role?: string;
}

export class RegisteredUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'User role',
    example: 'GUEST',
  })
  role!: string;

  @ApiProperty({
    description: 'Account active status',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-10-03T10:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-03T10:30:00.000Z',
  })
  updatedAt!: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Registered user information',
    type: RegisteredUserDto,
  })
  user!: RegisteredUserDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6Ikd1ZXN0IiwiaWF0IjoxNjk2MzM5MjAwLCJleHAiOjE2OTYzNDAxMDB9.xxxxxxxxxxx',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY5NjMzOTIwMCwiZXhwIjoxNjk2OTQ0MDAwfQ.xxxxxxxxxxx',
  })
  refreshToken!: string;
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

export class RefreshResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Tokens refreshed successfully',
  })
  message!: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Successfully logged out',
  })
  message!: string;
}

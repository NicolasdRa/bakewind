import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, MinLength, IsEnum } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Sweet Dreams Bakery',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Company phone number',
    example: '+1 (555) 123-4567',
  })
  @IsOptional()
  @IsString()
  companyPhone?: string;

  @ApiPropertyOptional({
    description: 'Company address',
    example: '123 Main St, Anytown, ST 12345',
  })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://sweetdreamsbakery.com',
  })
  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @ApiPropertyOptional({
    description: 'User timezone',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'User language preference',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class UserProfileResponseDto {
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
    description: 'Company name',
    example: 'Sweet Dreams Bakery',
  })
  companyName!: string;

  @ApiProperty({
    description: 'Company phone number',
    example: '+1 (555) 123-4567',
    nullable: true,
  })
  companyPhone!: string | null;

  @ApiProperty({
    description: 'Company address',
    example: '123 Main St, Anytown, ST 12345',
    nullable: true,
  })
  companyAddress!: string | null;

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://sweetdreamsbakery.com',
    nullable: true,
  })
  companyWebsite!: string | null;

  @ApiProperty({
    description: 'User role',
    example: 'owner',
    enum: ['owner', 'admin', 'manager', 'staff'],
  })
  role!: string;

  @ApiProperty({
    description: 'Account status',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
  })
  status!: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  emailVerified!: boolean;

  @ApiProperty({
    description: 'User timezone',
    example: 'America/New_York',
    nullable: true,
  })
  timezone!: string | null;

  @ApiProperty({
    description: 'User language preference',
    example: 'en',
    nullable: true,
  })
  language!: string | null;

  @ApiProperty({
    description: 'Stripe customer ID',
    example: 'cus_1234567890abcdef',
    nullable: true,
  })
  stripeCustomerId!: string | null;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2025-09-27T12:00:00Z',
    nullable: true,
  })
  lastLoginAt!: string | null;

  @ApiProperty({
    description: 'Account creation date',
    example: '2025-09-27T12:00:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Account last update date',
    example: '2025-09-27T12:00:00Z',
  })
  updatedAt!: string;
}

export class UserAccountSettingsDto {
  @ApiPropertyOptional({
    description: 'Email notifications enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Marketing emails enabled',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiPropertyOptional({
    description: 'Security notifications enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  securityNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Weekly digest emails enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @ApiPropertyOptional({
    description: 'Low inventory alerts enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  lowInventoryAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Production reminders enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  productionReminders?: boolean;

  @ApiPropertyOptional({
    description: 'Theme preference',
    example: 'system',
    enum: ['light', 'dark', 'system'],
  })
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';

  @ApiPropertyOptional({
    description: 'Date format preference',
    example: 'MM/DD/YYYY',
    enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
  })
  @IsOptional()
  @IsEnum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

  @ApiPropertyOptional({
    description: 'Time format preference',
    example: '12h',
    enum: ['12h', '24h'],
  })
  @IsOptional()
  @IsEnum(['12h', '24h'])
  timeFormat?: '12h' | '24h';

  @ApiPropertyOptional({
    description: 'Currency preference',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Temperature unit preference',
    example: 'fahrenheit',
    enum: ['celsius', 'fahrenheit'],
  })
  @IsOptional()
  @IsEnum(['celsius', 'fahrenheit'])
  temperatureUnit?: 'celsius' | 'fahrenheit';

  @ApiPropertyOptional({
    description: 'Weight unit preference',
    example: 'imperial',
    enum: ['metric', 'imperial'],
  })
  @IsOptional()
  @IsEnum(['metric', 'imperial'])
  weightUnit?: 'metric' | 'imperial';
}
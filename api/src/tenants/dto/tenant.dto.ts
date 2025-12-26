import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export type BusinessSize = '1' | '2-3' | '4-10' | '10+';
export type TenantSubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete';

export class CreateTenantDto {
  @IsUUID()
  ownerUserId: string;

  @IsString()
  @MaxLength(255)
  businessName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  businessPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  signupSource?: string;

  @IsOptional()
  @IsEnum(['1', '2-3', '4-10', '10+'])
  businessSize?: BusinessSize;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  businessPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stripeAccountId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionPlanId?: string;

  @IsOptional()
  @IsEnum(['trial', 'active', 'past_due', 'canceled', 'incomplete'])
  subscriptionStatus?: TenantSubscriptionStatus;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  sampleDataLoaded?: boolean;
}

export class TenantResponseDto {
  id: string;
  ownerUserId: string;
  businessName: string;
  businessPhone: string | null;
  businessAddress: string | null;
  stripeAccountId: string | null;
  subscriptionPlanId: string | null;
  subscriptionStatus: TenantSubscriptionStatus;
  trialEndsAt: Date | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class InviteStaffDto {
  @IsString()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString({ each: true })
  areas?: string[];

  @IsOptional()
  @IsDateString()
  hireDate?: string;
}

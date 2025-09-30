import { z } from 'zod';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// Zod schema for trial signup validation
export const trialSignupSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-\.'&]+$/, 'Business name contains invalid characters'),

  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Full name must contain only letters, spaces, hyphens, apostrophes, and periods'),

  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .refine(
      (email) => {
        // Check for common disposable email domains
        const disposableDomains = [
          '10minutemail.com',
          'tempmail.org',
          'guerrillamail.com',
          'mailinator.com',
          'temp-mail.org',
          'throwaway.email',
        ];
        const domain = email.split('@')[1];
        return !disposableDomains.includes(domain);
      },
      { message: 'Disposable email addresses are not allowed' }
    ),

  phone: z
    .string()
    .optional()
    .refine(
      (phone) => {
        if (!phone) return true;
        // Basic phone validation - allows international formats
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      { message: 'Invalid phone number format' }
    ),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  locations: z.enum(['1', '2-3', '4-10', '10+'], {
    errorMap: () => ({ message: 'Locations must be one of: 1, 2-3, 4-10, 10+' }),
  }),

  agreeToTerms: z
    .boolean()
    .refine((agree) => agree === true, {
      message: 'You must agree to the terms and conditions',
    }),

  // Optional marketing consent
  marketingConsent: z.boolean().optional().default(false),

  // Optional referral source
  referralSource: z
    .enum(['search', 'social', 'referral', 'direct', 'other'])
    .optional(),

  // Optional UTM parameters for tracking
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

export type TrialSignupDto = z.infer<typeof trialSignupSchema>;

@Injectable()
export class TrialSignupValidationPipe implements PipeTransform {
  transform(value: any): TrialSignupDto {
    try {
      // Pre-process the data
      const processedValue = this.preprocessTrialSignupData(value);

      // Validate with Zod schema
      return trialSignupSchema.parse(processedValue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
          details: error.errors,
        });
      }
      throw new BadRequestException('Invalid trial signup data');
    }
  }

  private preprocessTrialSignupData(data: any): any {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Request body must be a valid object');
    }

    return {
      ...data,
      // Trim string fields
      businessName: typeof data.businessName === 'string' ? data.businessName.trim() : data.businessName,
      fullName: typeof data.fullName === 'string' ? data.fullName.trim() : data.fullName,
      email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : data.email,
      phone: typeof data.phone === 'string' ? data.phone.trim() : data.phone,

      // Parse fullName into firstName and lastName
      firstName: this.extractFirstName(data.fullName),
      lastName: this.extractLastName(data.fullName),

      // Clean phone number
      cleanPhone: this.cleanPhoneNumber(data.phone),

      // Convert string booleans
      agreeToTerms: this.parseBoolean(data.agreeToTerms),
      marketingConsent: this.parseBoolean(data.marketingConsent, false),
    };
  }

  private extractFirstName(fullName: string): string {
    if (!fullName || typeof fullName !== 'string') return '';
    const names = fullName.trim().split(/\s+/);
    return names[0] || '';
  }

  private extractLastName(fullName: string): string {
    if (!fullName || typeof fullName !== 'string') return '';
    const names = fullName.trim().split(/\s+/);
    return names.length > 1 ? names.slice(1).join(' ') : '';
  }

  private cleanPhoneNumber(phone: string | undefined): string | undefined {
    if (!phone || typeof phone !== 'string') return undefined;
    return phone.replace(/[\s\-\(\)]/g, '');
  }

  private parseBoolean(value: any, defaultValue = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return defaultValue;
  }
}

// Additional validation helpers
export class TrialSignupValidationHelpers {
  /**
   * Validate business name uniqueness
   */
  static async validateBusinessNameUniqueness(
    businessName: string,
    userService: any // Type would be your user service
  ): Promise<void> {
    const existingUser = await userService.findByBusinessName(businessName);
    if (existingUser) {
      throw new BadRequestException('A business with this name already exists');
    }
  }

  /**
   * Validate email uniqueness
   */
  static async validateEmailUniqueness(
    email: string,
    userService: any
  ): Promise<void> {
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('An account with this email already exists');
    }
  }

  /**
   * Check if IP address has exceeded trial signup limits
   */
  static async validateTrialSignupRateLimit(
    ipAddress: string,
    rateLimitService: any,
    maxTrialsPerIp = 3,
    windowHours = 24
  ): Promise<void> {
    const recentTrials = await rateLimitService.countTrialSignupsFromIp(
      ipAddress,
      windowHours
    );

    if (recentTrials >= maxTrialsPerIp) {
      throw new BadRequestException(
        `Too many trial accounts created from this IP address. Limit: ${maxTrialsPerIp} per ${windowHours} hours.`
      );
    }
  }

  /**
   * Validate business size against recommended plan
   */
  static validateBusinessSizeConsistency(
    businessSize: string,
    expectedFeatures?: string[]
  ): { isValid: boolean; recommendations?: string[] } {
    const businessSizeMapping = {
      '1': {
        recommendedPlan: 'plan-starter',
        keyFeatures: ['Order Management', 'Inventory Control', 'Recipe Management'],
      },
      '2-3': {
        recommendedPlan: 'plan-professional',
        keyFeatures: ['Order Management', 'Inventory Control', 'Production Planning', 'Customer Database'],
      },
      '4-10': {
        recommendedPlan: 'plan-business',
        keyFeatures: ['All Professional features', 'Supplier Management', 'Loyalty Program', 'Profit Insights'],
      },
      '10+': {
        recommendedPlan: 'plan-enterprise',
        keyFeatures: ['All Business features', 'Advanced Analytics', 'Multi-location Support'],
      },
    };

    const mapping = businessSizeMapping[businessSize as keyof typeof businessSizeMapping];
    if (!mapping) {
      return { isValid: false };
    }

    return {
      isValid: true,
      recommendations: mapping.keyFeatures,
    };
  }

  /**
   * Generate trial account metadata
   */
  static generateTrialMetadata(signupData: TrialSignupDto, request: any) {
    return {
      signupIpAddress: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
      referrer: request.headers.referer,
      utmData: {
        source: signupData.utmSource,
        medium: signupData.utmMedium,
        campaign: signupData.utmCampaign,
      },
      marketingConsent: signupData.marketingConsent,
      referralSource: signupData.referralSource,
      businessSize: signupData.locations,
      signupTimestamp: new Date().toISOString(),
    };
  }
}
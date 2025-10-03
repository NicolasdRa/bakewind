import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/database/database.module';
import { AuthModule } from '../src/auth/auth.module';
import { SaasUsersModule } from '../src/saas-users/saas-users.module';
import { SubscriptionsModule } from '../src/subscriptions/subscriptions.module';
import { TrialsModule } from '../src/trials/trials.module';
import { FeaturesModule } from '../src/features/features.module';

describe('SaaS Portal API Contract Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let refreshToken: string;
  let trialUserId: string;
  let trialId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/trial-signup', () => {
      it('should create trial account successfully', async () => {
        const trialSignupData = {
          businessName: 'Sweet Dreams Bakery',
          fullName: 'John Smith',
          email: `test-${Date.now()}@sweetdreamsbakery.com`,
          phone: '+1 (555) 123-4567',
          password: 'SecurePassword123!',
          locations: '2-3',
          agreeToTerms: true,
        };

        const response = await request(app.getHttpServer())
          .post('/auth/trial-signup')
          .send(trialSignupData)
          .expect(201);

        expect(response.body).toMatchObject({
          user: {
            id: expect.any(String),
            email: trialSignupData.email,
            firstName: 'John',
            lastName: 'Smith',
            businessName: trialSignupData.businessName,
            role: 'trial_user',
            subscriptionStatus: 'trial',
            isEmailVerified: expect.any(Boolean),
            createdAt: expect.any(String),
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          dashboardUrl: expect.stringContaining('/admin/'),
        });

        // Store for subsequent tests
        authToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;
        trialUserId = response.body.user.id;
      });

      it('should return 400 for invalid trial signup data', async () => {
        const invalidData = {
          businessName: '',
          email: 'invalid-email',
          password: '123', // Too short
          agreeToTerms: false,
        };

        const response = await request(app.getHttpServer())
          .post('/auth/trial-signup')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          message: expect.any(String),
          code: expect.any(String),
          details: expect.any(Object),
        });
      });

      it('should return 409 for duplicate email', async () => {
        const duplicateData = {
          businessName: 'Another Bakery',
          fullName: 'Jane Doe',
          email: `test-${Date.now()}@sweetdreamsbakery.com`, // Use same email pattern
          phone: '+1 (555) 987-6543',
          password: 'AnotherPassword123!',
          locations: '1',
          agreeToTerms: true,
        };

        // First signup
        await request(app.getHttpServer())
          .post('/auth/trial-signup')
          .send(duplicateData)
          .expect(201);

        // Duplicate signup
        const response = await request(app.getHttpServer())
          .post('/auth/trial-signup')
          .send(duplicateData)
          .expect(409);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('already exists'),
          code: expect.any(String),
        });
      });
    });

    describe('POST /auth/login', () => {
      let loginEmail: string;
      const loginPassword = 'LoginPassword123!';

      beforeAll(async () => {
        // Create a test user for login
        const signupData = {
          businessName: 'Login Test Bakery',
          fullName: 'Test User',
          email: `login-test-${Date.now()}@example.com`,
          phone: '+1 (555) 555-5555',
          password: loginPassword,
          locations: '1',
          agreeToTerms: true,
        };

        const signupResponse = await request(app.getHttpServer())
          .post('/auth/trial-signup')
          .send(signupData);

        loginEmail = signupData.email;
      });

      it('should login successfully with valid credentials', async () => {
        const loginData = {
          email: loginEmail,
          password: loginPassword,
        };

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toMatchObject({
          user: {
            id: expect.any(String),
            email: loginEmail,
            role: expect.any(String),
            subscriptionStatus: expect.any(String),
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          dashboardUrl: expect.any(String),
        });
      });

      it('should return 401 for invalid credentials', async () => {
        const invalidLogin = {
          email: loginEmail,
          password: 'WrongPassword123!',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidLogin)
          .expect(401);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('Invalid'),
          code: expect.any(String),
        });
      });
    });

    describe('POST /auth/refresh', () => {
      it('should refresh token successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          accessToken: expect.any(String),
        });
      });

      it('should return 401 for invalid refresh token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', 'refreshToken=invalid-token')
          .expect(401);

        expect(response.body).toMatchObject({
          message: expect.any(String),
          code: expect.any(String),
        });
      });
    });

    describe('POST /auth/logout', () => {
      it('should logout successfully', async () => {
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);
      });

      it('should return 401 for unauthenticated request', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .expect(401);

        expect(response.body).toMatchObject({
          message: expect.any(String),
          code: expect.any(String),
        });
      });
    });
  });

  describe('User Profile Endpoints', () => {
    beforeAll(async () => {
      // Create fresh auth token for profile tests
      const signupData = {
        businessName: 'Profile Test Bakery',
        fullName: 'Profile User',
        email: `profile-test-${Date.now()}@example.com`,
        phone: '+1 (555) 111-2222',
        password: 'ProfilePassword123!',
        locations: '4-10',
        agreeToTerms: true,
      };

      const signupResponse = await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send(signupData);

      authToken = signupResponse.body.accessToken;
    });

    describe('GET /auth/me', () => {
      it('should return current user profile', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          email: expect.stringContaining('@'),
          firstName: expect.any(String),
          lastName: expect.any(String),
          businessName: expect.any(String),
          role: expect.any(String),
          subscriptionStatus: expect.any(String),
          isEmailVerified: expect.any(Boolean),
          createdAt: expect.any(String),
        });

        // Check enum values
        expect(['trial_user', 'subscriber', 'admin']).toContain(
          response.body.role,
        );
        expect(['trial', 'active', 'past_due', 'canceled']).toContain(
          response.body.subscriptionStatus,
        );
      });

      it('should return 401 for unauthenticated request', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .expect(401);

        expect(response.body).toMatchObject({
          message: expect.any(String),
          code: expect.any(String),
        });
      });
    });
  });

  describe('Subscription Management', () => {
    describe('GET /subscriptions/plans', () => {
      it('should return available subscription plans', async () => {
        const response = await request(app.getHttpServer())
          .get('/subscriptions/plans')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);

        if (response.body.length > 0) {
          const plan = response.body[0];
          expect(plan).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            priceMonthlyUsd: expect.any(Number),
            priceAnnualUsd: expect.any(Number),
            features: expect.any(Array),
            isPopular: expect.any(Boolean),
            sortOrder: expect.any(Number),
          });

          // Validate price format (should be in cents)
          expect(plan.priceMonthlyUsd).toBeGreaterThan(0);
          expect(plan.priceAnnualUsd).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Software Features', () => {
    describe('GET /features', () => {
      it('should return software features for marketing', async () => {
        const response = await request(app.getHttpServer())
          .get('/features')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);

        if (response.body.length > 0) {
          const feature = response.body[0];
          expect(feature).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            iconName: expect.any(String),
            category: expect.any(String),
            availableInPlans: expect.any(Array),
            isHighlighted: expect.any(Boolean),
            sortOrder: expect.any(Number),
          });

          // Validate category enum
          expect([
            'orders',
            'inventory',
            'production',
            'analytics',
            'customers',
            'products',
          ]).toContain(feature.category);
        }
      });
    });
  });

  describe('Trial Management', () => {
    beforeAll(async () => {
      // Get trial ID for the current user
      const userResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      // This would need to be implemented to get trial ID from user
      // For now, we'll create a mock UUID
      trialId = '550e8400-e29b-41d4-a716-446655440000';
    });

    describe('PATCH /trials/{trialId}/onboarding', () => {
      it('should update trial onboarding progress', async () => {
        const onboardingData = {
          onboardingCompleted: true,
          sampleDataRequested: true,
        };

        const response = await request(app.getHttpServer())
          .patch(`/trials/${trialId}/onboarding`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(onboardingData)
          .expect(200);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          userId: expect.any(String),
          signupSource: expect.any(String),
          businessSize: expect.any(String),
          trialLengthDays: expect.any(Number),
          onboardingCompleted: expect.any(Boolean),
          sampleDataLoaded: expect.any(Boolean),
          conversionRemindersSent: expect.any(Number),
          createdAt: expect.any(String),
        });

        // Validate business size enum
        expect(['1', '2-3', '4-10', '10+']).toContain(
          response.body.businessSize,
        );
      });

      it('should return 404 for non-existent trial', async () => {
        const nonExistentTrialId = '00000000-0000-0000-0000-000000000000';

        const response = await request(app.getHttpServer())
          .patch(`/trials/${nonExistentTrialId}/onboarding`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ onboardingCompleted: true })
          .expect(404);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('not found'),
        });
      });

      it('should return 403 for unauthorized trial access', async () => {
        // Create another user to test unauthorized access
        const otherUserSignup = {
          businessName: 'Unauthorized Test Bakery',
          fullName: 'Other User',
          email: `other-${Date.now()}@example.com`,
          phone: '+1 (555) 999-8888',
          password: 'OtherPassword123!',
          locations: '1',
          agreeToTerms: true,
        };

        const otherUserResponse = await request(app.getHttpServer())
          .post('/auth/trial-signup')
          .send(otherUserSignup);

        const otherUserToken = otherUserResponse.body.accessToken;

        const response = await request(app.getHttpServer())
          .patch(`/trials/${trialId}/onboarding`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({ onboardingCompleted: true })
          .expect(403);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('authorized'),
        });
      });
    });
  });

  describe('API Contract Validation', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .options('/subscriptions/plans')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should return proper content-type headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send('{"malformed": json}')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toMatchObject({
        message: expect.any(String),
      });
    });

    it('should validate UUID parameters', async () => {
      const invalidUuid = 'not-a-uuid';

      const response = await request(app.getHttpServer())
        .patch(`/trials/${invalidUuid}/onboarding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ onboardingCompleted: true })
        .expect(400);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('UUID'),
      });
    });

    it('should enforce rate limiting', async () => {
      const requests: Promise<any>[] = [];

      // Make multiple rapid requests
      for (let i = 0; i < 105; i++) {
        // Exceed the rate limit of 100
        requests.push(request(app.getHttpServer()).get('/subscriptions/plans'));
      }

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled' && result.value.status === 429,
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});

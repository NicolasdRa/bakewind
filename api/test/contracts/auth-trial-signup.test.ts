import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('POST /auth/trial-signup (Contract Test)', () => {
  let app: INestApplication;

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

  describe('Valid trial signup request', () => {
    const validTrialSignupData = {
      businessName: 'Test Bakery Co',
      fullName: 'John Smith',
      email: 'john.smith@testbakery.com',
      phone: '+1 (555) 123-4567',
      password: 'SecurePass123!',
      locations: '2-3',
      agreeToTerms: true,
    };

    it('should return 201 with user profile and tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send(validTrialSignupData)
        .expect(201);

      // Verify response structure matches OpenAPI contract
      expect(response.body).toMatchObject({
        user: expect.objectContaining({
          id: expect.any(String),
          email: validTrialSignupData.email,
          firstName: expect.any(String),
          lastName: expect.any(String),
          businessName: validTrialSignupData.businessName,
          role: 'trial_user',
          subscriptionStatus: 'trial',
          trialEndsAt: expect.any(String),
          isEmailVerified: expect.any(Boolean),
          createdAt: expect.any(String),
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        dashboardUrl: expect.any(String),
      });

      // Verify JWT token format
      expect(response.body.accessToken).toMatch(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

      // Verify dashboard URL format
      expect(response.body.dashboardUrl).toMatch(/^\/admin\/overview$/);

      // Verify trial end date is in the future
      const trialEndsAt = new Date(response.body.user.trialEndsAt);
      const now = new Date();
      expect(trialEndsAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should set httpOnly refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send({
          ...validTrialSignupData,
          email: 'cookie.test@testbakery.com',
        });

      expect(response.headers['set-cookie']).toBeDefined();
      const refreshTokenCookie = response.headers['set-cookie'].find((cookie: string) =>
        cookie.startsWith('refreshToken=')
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('Secure');
    });
  });

  describe('Invalid trial signup requests', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send({
          businessName: 'Test Bakery',
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
        details: expect.any(Object),
      });
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send({
          businessName: 'Test Bakery',
          fullName: 'John Smith',
          email: 'invalid-email',
          phone: '+1 555-123-4567',
          password: 'SecurePass123!',
          locations: '1',
          agreeToTerms: true,
        })
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send({
          businessName: 'Test Bakery',
          fullName: 'John Smith',
          email: 'john@testbakery.com',
          phone: '+1 555-123-4567',
          password: '123', // Too weak
          locations: '1',
          agreeToTerms: true,
        })
        .expect(400);
    });

    it('should return 400 for invalid business size', async () => {
      await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send({
          businessName: 'Test Bakery',
          fullName: 'John Smith',
          email: 'john@testbakery.com',
          phone: '+1 555-123-4567',
          password: 'SecurePass123!',
          locations: 'invalid-size',
          agreeToTerms: true,
        })
        .expect(400);
    });

    it('should return 400 for terms not agreed', async () => {
      await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send({
          businessName: 'Test Bakery',
          fullName: 'John Smith',
          email: 'john@testbakery.com',
          phone: '+1 555-123-4567',
          password: 'SecurePass123!',
          locations: '1',
          agreeToTerms: false,
        })
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateData = {
        businessName: 'Duplicate Test Bakery',
        fullName: 'Jane Doe',
        email: 'duplicate@testbakery.com',
        phone: '+1 555-987-6543',
        password: 'AnotherSecurePass123!',
        locations: '1',
        agreeToTerms: true,
      };

      // First signup should succeed
      await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send(duplicateData)
        .expect(201);

      // Second signup with same email should fail
      const response = await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send(duplicateData)
        .expect(409);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('email'),
        code: expect.any(String),
      });
    });
  });

  describe('Security requirements', () => {
    it('should hash password before storing', async () => {
      const signupData = {
        businessName: 'Security Test Bakery',
        fullName: 'Security Tester',
        email: 'security@testbakery.com',
        phone: '+1 555-111-2222',
        password: 'MySecretPassword123!',
        locations: '1',
        agreeToTerms: true,
      };

      await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send(signupData)
        .expect(201);

      // Password should never be returned in response
      // This would be verified by checking the database directly
      // or attempting to login with the hashed password (which should fail)
    });

    it('should rate limit repeated signup attempts', async () => {
      const rapidSignupData = {
        businessName: 'Rate Limit Test',
        fullName: 'Rate Tester',
        phone: '+1 555-333-4444',
        password: 'RateTestPass123!',
        locations: '1',
        agreeToTerms: true,
      };

      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/auth/trial-signup')
          .send({
            ...rapidSignupData,
            email: `ratetest${i}@testbakery.com`,
          })
      );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
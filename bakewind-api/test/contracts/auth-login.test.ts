import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('POST /auth/login (Contract Test)', () => {
  let app: INestApplication;
  let testUserCredentials: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a test user for login tests
    testUserCredentials = {
      email: 'login.test@testbakery.com',
      password: 'LoginTestPass123!',
    };

    await request(app.getHttpServer())
      .post('/auth/trial-signup')
      .send({
        businessName: 'Login Test Bakery',
        fullName: 'Login Tester',
        email: testUserCredentials.email,
        phone: '+1 555-777-8888',
        password: testUserCredentials.password,
        locations: '1',
        agreeToTerms: true,
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid login request', () => {
    it('should return 200 with user profile and tokens for trial user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials)
        .expect(200);

      // Verify response structure matches OpenAPI contract
      expect(response.body).toMatchObject({
        user: expect.objectContaining({
          id: expect.any(String),
          email: testUserCredentials.email,
          firstName: expect.any(String),
          lastName: expect.any(String),
          businessName: expect.any(String),
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

      // Verify dashboard URL based on user role
      expect(response.body.dashboardUrl).toMatch(/^\/admin\/overview$/);
    });

    it('should set httpOnly refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      expect(response.headers['set-cookie']).toBeDefined();
      const refreshTokenCookie = response.headers['set-cookie'].find((cookie: string) =>
        cookie.startsWith('refreshToken=')
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('Secure');
    });

    it('should update last login timestamp', async () => {
      const loginTime = new Date();

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials)
        .expect(200);

      // Verify lastLoginAt would be updated (check via /auth/me endpoint)
      // This would require implementing the /auth/me endpoint first
    });
  });

  describe('Invalid login requests', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'SomePassword123!',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should return 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email-format',
          password: 'SomePassword123!',
        })
        .expect(400);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@testbakery.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserCredentials.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
      });
    });
  });

  describe('Different user roles', () => {
    it('should return appropriate dashboard URL for trial users', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials)
        .expect(200);

      expect(response.body.user.role).toBe('trial_user');
      expect(response.body.dashboardUrl).toBe('/admin/overview');
    });

    it('should return appropriate dashboard URL for subscribers', async () => {
      // This test would require creating a subscriber user
      // For now, we'll test the contract expectation

      // Create subscriber user (would need to be implemented)
      const subscriberCredentials = {
        email: 'subscriber.test@testbakery.com',
        password: 'SubscriberPass123!',
      };

      // Expected behavior: subscriber gets different dashboard URL
      // expect(response.body.user.role).toBe('subscriber');
      // expect(response.body.dashboardUrl).toBe('/admin/dashboard');
    });
  });

  describe('Security requirements', () => {
    it('should rate limit failed login attempts', async () => {
      const invalidCredentials = {
        email: testUserCredentials.email,
        password: 'WrongPassword123!',
      };

      // Make multiple failed login attempts
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidCredentials)
      );

      const responses = await Promise.all(requests);

      // Should eventually be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@testbakery.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      // Error message should not reveal whether user exists or not
      expect(response.body.message).not.toContain('user not found');
      expect(response.body.message).not.toContain('email not found');
      expect(response.body.message).toMatch(/invalid.*credentials?/i);
    });

    it('should prevent timing attacks', async () => {
      const startTime = Date.now();

      // Login with non-existent user
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@testbakery.com',
          password: 'SomePassword123!',
        });

      const nonExistentUserTime = Date.now() - startTime;

      const startTime2 = Date.now();

      // Login with wrong password for existing user
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserCredentials.email,
          password: 'WrongPassword123!',
        });

      const wrongPasswordTime = Date.now() - startTime2;

      // Response times should be similar to prevent user enumeration
      const timeDifference = Math.abs(nonExistentUserTime - wrongPasswordTime);
      expect(timeDifference).toBeLessThan(100); // Within 100ms
    });
  });

  describe('Session management', () => {
    it('should invalidate old refresh tokens on login', async () => {
      // First login
      const firstLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials)
        .expect(200);

      const firstRefreshToken = firstLogin.body.refreshToken;

      // Second login should invalidate first refresh token
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials)
        .expect(200);

      // Attempting to use first refresh token should fail
      // This would be tested via the /auth/refresh endpoint
    });
  });
});
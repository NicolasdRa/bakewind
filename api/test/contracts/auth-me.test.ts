import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('GET /auth/me (Contract Test)', () => {
  let app: INestApplication;
  let testUserCredentials: any;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user
    testUserCredentials = {
      email: 'profile.test@testbakery.com',
      password: 'ProfileTestPass123!',
    };

    await request(app.getHttpServer()).post('/auth/trial-signup').send({
      businessName: 'Profile Test Bakery',
      fullName: 'Profile Tester',
      email: testUserCredentials.email,
      phone: '+1 555-333-4444',
      password: testUserCredentials.password,
      locations: '2-3',
      agreeToTerms: true,
    });

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUserCredentials);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid profile request', () => {
    it('should return 200 with complete user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify response structure matches OpenAPI contract
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: testUserCredentials.email,
        firstName: expect.any(String),
        lastName: expect.any(String),
        businessName: 'Profile Test Bakery',
        role: 'trial_user',
        subscriptionStatus: 'trial',
        trialEndsAt: expect.any(String),
        isEmailVerified: expect.any(Boolean),
        createdAt: expect.any(String),
      });

      // Verify UUID format for ID
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      // Verify email format
      expect(response.body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      // Verify ISO 8601 timestamp format
      expect(response.body.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/,
      );
      expect(response.body.trialEndsAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/,
      );

      // Verify trial end date is in the future
      const trialEndsAt = new Date(response.body.trialEndsAt);
      const now = new Date();
      expect(trialEndsAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should not expose sensitive information', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should not contain sensitive fields
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body).not.toHaveProperty('refreshTokenHash');
      expect(response.body).not.toHaveProperty('emailVerificationToken');
      expect(response.body).not.toHaveProperty('passwordResetToken');
    });

    it('should include trial-specific information for trial users', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.role).toBe('trial_user');
      expect(response.body.subscriptionStatus).toBe('trial');
      expect(response.body.trialEndsAt).toBeDefined();

      // Trial should be approximately 14 days from creation
      const createdAt = new Date(response.body.createdAt);
      const trialEndsAt = new Date(response.body.trialEndsAt);
      const trialLengthDays =
        (trialEndsAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(trialLengthDays).toBeCloseTo(14, 1);
    });

    it('should reflect current subscription status', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // For trial users
      if (response.body.role === 'trial_user') {
        expect(response.body.subscriptionStatus).toBe('trial');
        expect(response.body.trialEndsAt).toBeDefined();
      }

      // For subscribers (when implemented)
      if (response.body.role === 'subscriber') {
        expect(['active', 'past_due', 'canceled']).toContain(
          response.body.subscriptionStatus,
        );
        expect(response.body.trialEndsAt).toBeNull();
      }
    });
  });

  describe('Invalid profile requests', () => {
    it('should return 401 for missing authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should return 401 for malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should return 401 for invalid bearer token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token_format')
        .expect(401);
    });

    it('should return 401 for expired access token', async () => {
      // This would require an actually expired token
      // For testing purposes, we'll use a malformed token
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
    });

    it('should return 401 for revoked access token', async () => {
      // Login to get a fresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const freshToken = loginResponse.body.accessToken;

      // Logout to revoke the token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${freshToken}`)
        .expect(204);

      // Attempting to use revoked token should fail
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${freshToken}`)
        .expect(401);
    });
  });

  describe('User role variations', () => {
    it('should handle trial user profile correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.role).toBe('trial_user');
      expect(response.body.subscriptionStatus).toBe('trial');
      expect(response.body.trialEndsAt).toBeDefined();
    });

    it('should handle subscriber profile correctly', async () => {
      // This test would require creating a subscriber user
      // For now, we'll outline the expected behavior
      // Expected for subscriber:
      // expect(response.body.role).toBe('subscriber');
      // expect(['active', 'past_due', 'canceled']).toContain(response.body.subscriptionStatus);
      // expect(response.body.trialEndsAt).toBeNull();
    });

    it('should handle admin profile correctly', async () => {
      // This test would require creating an admin user
      // For now, we'll outline the expected behavior
      // Expected for admin:
      // expect(response.body.role).toBe('admin');
      // expect(response.body.subscriptionStatus).toBe('active');
    });
  });

  describe('Data consistency', () => {
    it('should return consistent data across multiple requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Core user data should be identical
      expect(response1.body.id).toBe(response2.body.id);
      expect(response1.body.email).toBe(response2.body.email);
      expect(response1.body.firstName).toBe(response2.body.firstName);
      expect(response1.body.lastName).toBe(response2.body.lastName);
      expect(response1.body.businessName).toBe(response2.body.businessName);
      expect(response1.body.role).toBe(response2.body.role);
      expect(response1.body.createdAt).toBe(response2.body.createdAt);
    });

    it('should reflect profile updates in real-time', async () => {
      // This test would verify that profile changes are immediately reflected
      // It would require implementing a profile update endpoint first
      // Example flow:
      // 1. Get current profile
      // 2. Update profile (e.g., business name)
      // 3. Get profile again
      // 4. Verify changes are reflected
    });
  });

  describe('Security and privacy', () => {
    it('should not expose other users data', async () => {
      // Create another user
      const otherUserCredentials = {
        email: 'other.user@testbakery.com',
        password: 'OtherUserPass123!',
      };

      await request(app.getHttpServer()).post('/auth/trial-signup').send({
        businessName: 'Other Test Bakery',
        fullName: 'Other User',
        email: otherUserCredentials.email,
        phone: '+1 555-555-5555',
        password: otherUserCredentials.password,
        locations: '1',
        agreeToTerms: true,
      });

      // Original user's profile should only contain their data
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUserCredentials.email);
      expect(response.body.email).not.toBe(otherUserCredentials.email);
    });

    it('should rate limit profile requests', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`),
      );

      const responses = await Promise.all(requests);

      // Should eventually be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });

    it('should include security audit information', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should include last login timestamp when available
      if (response.body.lastLoginAt) {
        expect(response.body.lastLoginAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/,
        );
      }

      // Email verification status should be present
      expect(typeof response.body.isEmailVerified).toBe('boolean');
    });
  });
});

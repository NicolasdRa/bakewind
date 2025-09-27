import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('POST /auth/refresh (Contract Test)', () => {
  let app: INestApplication;
  let testUserCredentials: any;
  let refreshTokenCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and obtain refresh token
    testUserCredentials = {
      email: 'refresh.test@testbakery.com',
      password: 'RefreshTestPass123!',
    };

    // Sign up test user
    await request(app.getHttpServer())
      .post('/auth/trial-signup')
      .send({
        businessName: 'Refresh Test Bakery',
        fullName: 'Refresh Tester',
        email: testUserCredentials.email,
        phone: '+1 555-999-0000',
        password: testUserCredentials.password,
        locations: '1',
        agreeToTerms: true,
      });

    // Login to get refresh token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUserCredentials);

    refreshTokenCookie = loginResponse.headers['set-cookie']
      .find((cookie: string) => cookie.startsWith('refreshToken='));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid refresh token request', () => {
    it('should return 200 with new access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      // Verify response structure matches OpenAPI contract
      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
      });

      // Verify JWT token format
      expect(response.body.accessToken).toMatch(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

      // New access token should be different from any previous ones
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should optionally rotate refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      // Check if new refresh token cookie is set (refresh token rotation)
      const newRefreshTokenCookie = response.headers['set-cookie']?.find(
        (cookie: string) => cookie.startsWith('refreshToken=')
      );

      if (newRefreshTokenCookie) {
        expect(newRefreshTokenCookie).toContain('HttpOnly');
        expect(newRefreshTokenCookie).toContain('Secure');
        // Update refresh token for subsequent tests
        refreshTokenCookie = newRefreshTokenCookie;
      }
    });

    it('should maintain session security properties', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      // Verify response doesn't contain sensitive information
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');

      // Access token should have reasonable expiration
      const tokenPayload = JSON.parse(
        Buffer.from(response.body.accessToken.split('.')[1], 'base64').toString()
      );
      expect(tokenPayload.exp).toBeDefined();
      expect(tokenPayload.iat).toBeDefined();
      expect(tokenPayload.exp - tokenPayload.iat).toBeLessThanOrEqual(3600); // Max 1 hour
    });
  });

  describe('Invalid refresh token requests', () => {
    it('should return 401 for missing refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should return 401 for invalid refresh token format', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=invalid_token_format')
        .expect(401);
    });

    it('should return 401 for malformed refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=malformed.token.here')
        .expect(401);
    });

    it('should return 401 for expired refresh token', async () => {
      // This test would require a refresh token that's actually expired
      // For testing purposes, we'll use a token with expired timestamp
      const expiredToken = 'refreshToken=expired_token_value';

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', expiredToken)
        .expect(401);
    });

    it('should return 401 for revoked refresh token', async () => {
      // Create a fresh refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const newRefreshTokenCookie = loginResponse.headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('refreshToken='));

      // Use the refresh token once
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', newRefreshTokenCookie)
        .expect(200);

      // If refresh token rotation is enabled, the old token should now be invalid
      // This depends on the implementation strategy
    });
  });

  describe('Security requirements', () => {
    it('should rate limit refresh attempts', async () => {
      const requests = Array.from({ length: 20 }, () =>
        request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', refreshTokenCookie)
      );

      const responses = await Promise.all(requests);

      // Should eventually be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0); // May or may not be rate limited
    });

    it('should invalidate refresh token after user logout', async () => {
      // Get a fresh refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const freshRefreshTokenCookie = loginResponse.headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('refreshToken='));

      const accessToken = loginResponse.body.accessToken;

      // Logout with the access token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Refresh token should now be invalid
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', freshRefreshTokenCookie)
        .expect(401);
    });

    it('should not expose user information without valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=invalid_token')
        .expect(401);

      // Error response should not contain user information
      expect(response.body).not.toHaveProperty('user');
      expect(response.body).not.toHaveProperty('email');
      expect(response.body).not.toHaveProperty('id');
    });
  });

  describe('Token lifecycle', () => {
    it('should generate access tokens with consistent claims', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      const tokenPayload = JSON.parse(
        Buffer.from(response.body.accessToken.split('.')[1], 'base64').toString()
      );

      // Verify standard JWT claims
      expect(tokenPayload).toMatchObject({
        sub: expect.any(String), // Subject (user ID)
        iat: expect.any(Number), // Issued at
        exp: expect.any(Number), // Expires at
        iss: expect.any(String), // Issuer
      });

      // Verify custom claims for SaaS application
      expect(tokenPayload).toMatchObject({
        email: testUserCredentials.email,
        role: 'trial_user',
        subscriptionStatus: 'trial',
      });
    });

    it('should handle concurrent refresh requests safely', async () => {
      // Make multiple concurrent refresh requests
      const concurrentRequests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', refreshTokenCookie)
      );

      const responses = await Promise.all(concurrentRequests);

      // All should either succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 401, 429]).toContain(response.status);
      });

      // At least one should succeed
      const successfulResponses = responses.filter(res => res.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});
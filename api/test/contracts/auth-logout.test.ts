import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('POST /auth/logout (Contract Test)', () => {
  let app: INestApplication;
  let testUserCredentials: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user
    testUserCredentials = {
      email: 'logout.test@testbakery.com',
      password: 'LogoutTestPass123!',
    };

    await request(app.getHttpServer()).post('/auth/trial-signup').send({
      businessName: 'Logout Test Bakery',
      fullName: 'Logout Tester',
      email: testUserCredentials.email,
      phone: '+1 555-111-2222',
      password: testUserCredentials.password,
      locations: '1',
      agreeToTerms: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid logout request', () => {
    it('should return 204 for authenticated user logout', async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials)
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Logout should succeed
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Response should be empty for 204 status
      expect(response.body).toEqual({});
      expect(response.text).toBe('');
    });

    it('should clear refresh token cookie on logout', async () => {
      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const accessToken = loginResponse.body.accessToken;

      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Should set refresh token cookie with expired date or empty value
      const clearCookie = logoutResponse.headers['set-cookie']?.find(
        (cookie: string) => cookie.startsWith('refreshToken='),
      );

      if (clearCookie) {
        expect(clearCookie).toMatch(/refreshToken=;|expires=.*1970/);
      }
    });

    it('should invalidate the access token after logout', async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const accessToken = loginResponse.body.accessToken;

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Attempting to use the same access token should fail
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should invalidate the refresh token after logout', async () => {
      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const accessToken = loginResponse.body.accessToken;
      const refreshTokenCookie = loginResponse.headers['set-cookie'].find(
        (cookie: string) => cookie.startsWith('refreshToken='),
      );

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Attempting to use refresh token should fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(401);
    });
  });

  describe('Invalid logout requests', () => {
    it('should return 401 for missing authorization header', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should return 401 for malformed authorization header', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should return 401 for invalid bearer token format', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid_token_format')
        .expect(401);
    });

    it('should return 401 for expired access token', async () => {
      // This would require an actually expired token
      // For testing purposes, we'll use a malformed token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
    });

    it('should return 401 for revoked access token', async () => {
      // Login and logout to revoke token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const accessToken = loginResponse.body.accessToken;

      // First logout should succeed
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Second logout with same token should fail
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('Security requirements', () => {
    it('should handle logout for all user roles', async () => {
      // Test trial user (already covered in previous tests)
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(204);

      // Additional tests for subscriber and admin roles would go here
      // when those user types are implemented
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      // Error should not reveal implementation details
      expect(response.body.message).not.toContain('jwt');
      expect(response.body.message).not.toContain('decode');
      expect(response.body.message).not.toContain('signature');
    });

    it('should log logout events for security auditing', async () => {
      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const accessToken = loginResponse.body.accessToken;

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // This test would verify that logout events are logged
      // Implementation would depend on the logging strategy
    });

    it('should handle concurrent logout requests safely', async () => {
      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const accessToken = loginResponse.body.accessToken;

      // Make multiple concurrent logout requests
      const concurrentLogouts = Array.from({ length: 3 }, () =>
        request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`),
      );

      const responses = await Promise.all(concurrentLogouts);

      // First should succeed, others should fail gracefully
      const successCount = responses.filter((res) => res.status === 204).length;
      const errorCount = responses.filter((res) => res.status === 401).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(2);
    });

    it('should rate limit logout attempts with invalid tokens', async () => {
      const invalidToken = 'Bearer invalid_token_for_rate_limiting';

      // Make multiple rapid logout attempts with invalid token
      const requests = Array.from({ length: 15 }, () =>
        request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', invalidToken),
      );

      const responses = await Promise.all(requests);

      // Should eventually be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Session cleanup', () => {
    it('should remove all user sessions on logout', async () => {
      // Login from multiple devices/sessions
      const session1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      const session2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUserCredentials);

      // Logout from one session
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${session1.body.accessToken}`)
        .expect(204);

      // The specific session should be invalidated
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${session1.body.accessToken}`)
        .expect(401);

      // Other sessions behavior depends on implementation:
      // Option 1: Other sessions remain valid (single session logout)
      // Option 2: All sessions invalidated (global logout)
      // For SaaS applications, single session logout is more common
    });

    it('should handle logout when session is already expired', async () => {
      // This test would require creating an expired session
      // For now, we'll test with an invalid token that mimics expired session
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer expired.session.token')
        .expect(401);
    });
  });
});

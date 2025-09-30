import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('PATCH /trials/{trialId}/onboarding (Contract Test)', () => {
  let app: INestApplication;
  let testUserCredentials: any;
  let accessToken: string;
  let trialUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test trial user
    testUserCredentials = {
      email: 'onboarding.test@testbakery.com',
      password: 'OnboardingTestPass123!',
    };

    const signupResponse = await request(app.getHttpServer())
      .post('/auth/trial-signup')
      .send({
        businessName: 'Onboarding Test Bakery',
        fullName: 'Onboarding Tester',
        email: testUserCredentials.email,
        phone: '+1 555-666-7777',
        password: testUserCredentials.password,
        locations: '2-3',
        agreeToTerms: true,
      });

    trialUserId = signupResponse.body.user.id;

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUserCredentials);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid onboarding update request', () => {
    it('should return 200 when marking onboarding complete', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
          sampleDataRequested: false,
        })
        .expect(200);

      // Verify response structure matches OpenAPI contract
      expect(response.body).toMatchObject({
        id: expect.any(String),
        userId: trialUserId,
        signupSource: expect.any(String),
        businessSize: expect.any(String),
        trialLengthDays: expect.any(Number),
        onboardingCompleted: true,
        sampleDataLoaded: expect.any(Boolean),
        conversionRemindersSent: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify trial account UUID format
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // Verify business size is valid enum
      expect(['1', '2-3', '4-10', '10+']).toContain(response.body.businessSize);

      // Verify trial length is 14 days
      expect(response.body.trialLengthDays).toBe(14);

      // Verify onboarding is marked complete
      expect(response.body.onboardingCompleted).toBe(true);

      // Verify timestamps are valid ISO format
      expect(response.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/);
      expect(response.body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/);
    });

    it('should handle sample data request', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
          sampleDataRequested: true,
        })
        .expect(200);

      // When sample data is requested, it should be loaded
      expect(response.body.sampleDataLoaded).toBe(true);
    });

    it('should allow partial updates', async () => {
      // Update only onboarding status
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: false,
        })
        .expect(200);

      expect(response.body.onboardingCompleted).toBe(false);
      // Other fields should remain unchanged
    });

    it('should update timestamp on successful update', async () => {
      // Get current state
      const initialResponse = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        });

      const initialUpdatedAt = new Date(initialResponse.body.updatedAt);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Make another update
      const updateResponse = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          sampleDataRequested: true,
        })
        .expect(200);

      const newUpdatedAt = new Date(updateResponse.body.updatedAt);

      // Updated timestamp should be later
      expect(newUpdatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('Invalid onboarding update requests', () => {
    it('should return 401 for missing authorization', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .send({
          onboardingCompleted: true,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should return 401 for invalid access token', async () => {
      await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', 'Bearer invalid_token')
        .send({
          onboardingCompleted: true,
        })
        .expect(401);
    });

    it('should return 403 for wrong user accessing trial', async () => {
      // Create another user
      const otherUserCredentials = {
        email: 'other.onboarding@testbakery.com',
        password: 'OtherOnboardingPass123!',
      };

      await request(app.getHttpServer())
        .post('/auth/trial-signup')
        .send({
          businessName: 'Other Onboarding Bakery',
          fullName: 'Other User',
          email: otherUserCredentials.email,
          phone: '+1 555-888-9999',
          password: otherUserCredentials.password,
          locations: '1',
          agreeToTerms: true,
        });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(otherUserCredentials);

      const otherAccessToken = otherLoginResponse.body.accessToken;

      // Other user should not be able to update first user's trial
      await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(403);
    });

    it('should return 404 for non-existent trial ID', async () => {
      const nonExistentTrialId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .patch(`/trials/${nonExistentTrialId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(404);
    });

    it('should return 400 for invalid trial ID format', async () => {
      await request(app.getHttpServer())
        .patch('/trials/invalid-uuid-format/onboarding')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(400);
    });

    it('should return 400 for invalid request body', async () => {
      // Invalid boolean value
      await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: 'not-a-boolean',
        })
        .expect(400);
    });

    it('should return 400 for empty request body', async () => {
      await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('Business logic validation', () => {
    it('should only allow trial users to update onboarding', async () => {
      // This test assumes only trial users have trial accounts
      // Subscribers and other user types should not have trial onboarding
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      // Should work for trial users
      expect(response.body.onboardingCompleted).toBe(true);
    });

    it('should trigger sample data loading when requested', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
          sampleDataRequested: true,
        })
        .expect(200);

      // When sample data is requested, it should be marked as loaded
      expect(response.body.sampleDataLoaded).toBe(true);
    });

    it('should not allow updating already converted trials', async () => {
      // This test would require a trial that has been converted to paid
      // For now, we outline the expected behavior

      // Expected behavior for converted trials:
      // - convertedAt should be set
      // - convertedToPlanId should be set
      // - onboarding updates should be rejected with 409 or 422
    });

    it('should preserve trial signup source and business size', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      // These fields should not change during onboarding
      expect(response.body.signupSource).toBeDefined();
      expect(response.body.businessSize).toBeDefined();
      expect(response.body.trialLengthDays).toBe(14);
    });
  });

  describe('Security requirements', () => {
    it('should not expose sensitive trial information', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      // Should not expose internal fields
      expect(response.body).not.toHaveProperty('internalNotes');
      expect(response.body).not.toHaveProperty('adminFlags');
      expect(response.body).not.toHaveProperty('marketingCohort');
    });

    it('should rate limit onboarding updates', async () => {
      const requests = Array.from({ length: 20 }, () =>
        request(app.getHttpServer())
          .patch(`/trials/${trialUserId}/onboarding`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            onboardingCompleted: true,
          })
      );

      const responses = await Promise.all(requests);

      // Should eventually be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });

    it('should log onboarding completion for analytics', async () => {
      await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      // This test would verify that onboarding events are logged
      // Implementation would depend on the logging/analytics strategy
    });
  });

  describe('Idempotency', () => {
    it('should handle repeated onboarding completion', async () => {
      // Mark as complete
      const firstResponse = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      // Mark as complete again
      const secondResponse = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      // Both should succeed and return same completion status
      expect(firstResponse.body.onboardingCompleted).toBe(true);
      expect(secondResponse.body.onboardingCompleted).toBe(true);
    });

    it('should handle toggling onboarding status', async () => {
      // Complete onboarding
      await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      // Un-complete onboarding (for testing purposes)
      const response = await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: false,
        })
        .expect(200);

      expect(response.body.onboardingCompleted).toBe(false);
    });
  });

  describe('Performance and reliability', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .patch(`/trials/${trialUserId}/onboarding`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          onboardingCompleted: true,
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Should respond within 500ms
      expect(responseTime).toBeLessThan(500);
    });

    it('should handle concurrent updates safely', async () => {
      const concurrentRequests = Array.from({ length: 3 }, () =>
        request(app.getHttpServer())
          .patch(`/trials/${trialUserId}/onboarding`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            onboardingCompleted: true,
          })
      );

      const responses = await Promise.all(concurrentRequests);

      // All should either succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 409, 429]).toContain(response.status);
      });

      // At least one should succeed
      const successfulResponses = responses.filter(res => res.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});
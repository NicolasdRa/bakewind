import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OrderLocks API - POST /api/v1/order-locks/renew/:orderId (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let secondUserToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as first user
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@bakery.com',
        password: 'password123',
      })
      .expect(HttpStatus.OK);

    authToken = loginResponse.body.access_token;

    // Create second user for permission testing
    const signupResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Second User',
        email: `seconduser${Date.now()}@bakery.com`,
        password: 'password123',
      });

    secondUserToken = signupResponse.body.access_token;

    // Get a test order ID
    const ordersResponse = await request(app.getHttpServer())
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(HttpStatus.OK);

    if (ordersResponse.body.length > 0) {
      testOrderId = ordersResponse.body[0].id;
    } else {
      throw new Error('No test orders available');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/order-locks/renew/:orderId', () => {
    it('should renew lock successfully when owned by current user', async () => {
      // Acquire lock first
      const acquireResponse = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.OK);

      const originalExpiresAt = new Date(acquireResponse.body.expires_at);

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Renew the lock
      const renewResponse = await request(app.getHttpServer())
        .post(`/api/v1/order-locks/renew/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // Validate OrderLock response schema
      expect(renewResponse.body).toHaveProperty('id');
      expect(renewResponse.body).toHaveProperty('order_id', testOrderId);
      expect(renewResponse.body).toHaveProperty('locked_by_user_id');
      expect(renewResponse.body).toHaveProperty('locked_by_user_name');
      expect(renewResponse.body).toHaveProperty('expires_at');
      expect(renewResponse.body).toHaveProperty('last_activity_at');

      // Verify expires_at was extended
      const newExpiresAt = new Date(renewResponse.body.expires_at);
      expect(newExpiresAt.getTime()).toBeGreaterThan(
        originalExpiresAt.getTime(),
      );

      // Verify last_activity_at was updated
      const lastActivityAt = new Date(renewResponse.body.last_activity_at);
      expect(lastActivityAt.getTime()).toBeGreaterThanOrEqual(
        new Date(acquireResponse.body.last_activity_at).getTime(),
      );

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 404 when lock is not owned by current user', async () => {
      // First user acquires lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-user1',
        })
        .expect(HttpStatus.OK);

      // Second user tries to renew it
      const response = await request(app.getHttpServer())
        .post(`/api/v1/order-locks/renew/${testOrderId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 404 when no lock exists on order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/order-locks/renew/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post(`/api/v1/order-locks/renew/${fakeOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/order-locks/renew/${testOrderId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid order ID format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/renew/not-a-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should allow multiple renewals in succession', async () => {
      // Acquire lock
      const acquireResponse = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.OK);

      let previousExpiresAt = new Date(acquireResponse.body.expires_at);

      // Renew multiple times
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const renewResponse = await request(app.getHttpServer())
          .post(`/api/v1/order-locks/renew/${testOrderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(HttpStatus.OK);

        const currentExpiresAt = new Date(renewResponse.body.expires_at);
        expect(currentExpiresAt.getTime()).toBeGreaterThan(
          previousExpiresAt.getTime(),
        );
        previousExpiresAt = currentExpiresAt;
      }

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should extend TTL to ~5 minutes from renewal time', async () => {
      // Acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.OK);

      // Renew the lock
      const renewResponse = await request(app.getHttpServer())
        .post(`/api/v1/order-locks/renew/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // Validate TTL is ~5 minutes from now
      const expiresAt = new Date(renewResponse.body.expires_at).getTime();
      const now = Date.now();
      const ttlMinutes = (expiresAt - now) / 1000 / 60;

      expect(ttlMinutes).toBeGreaterThanOrEqual(4.9);
      expect(ttlMinutes).toBeLessThanOrEqual(5.1);

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});

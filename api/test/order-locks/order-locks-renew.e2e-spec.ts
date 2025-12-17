import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken, TEST_USERS } from '../test-setup';

describe('OrderLocks API - POST /api/v1/order-locks/renew/:orderId (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let secondUserToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);
    secondUserToken = await getAuthToken(app, TEST_USERS.manager);

    // Get a test order ID
    const ordersResponse = await request(app.getHttpServer())
      .get('/internal-orders')
      .set('Authorization', `Bearer ${authToken}`);

    const orders = ordersResponse.body.data || ordersResponse.body;
    if (Array.isArray(orders) && orders.length > 0) {
      testOrderId = orders[0].id;
    } else {
      testOrderId = '550e8400-e29b-41d4-a716-446655440000';
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // Clean up any existing locks before each test (try both users)
  beforeEach(async () => {
    // Try releasing with admin token
    await request(app.getHttpServer())
      .delete(`/api/v1/order-locks/release/${testOrderId}`)
      .set('Authorization', `Bearer ${authToken}`);
    // Try releasing with manager token (in case it was locked by different user)
    await request(app.getHttpServer())
      .delete(`/api/v1/order-locks/release/${testOrderId}`)
      .set('Authorization', `Bearer ${secondUserToken}`);
  });

  describe('POST /api/v1/order-locks/renew/:orderId', () => {
    it('should renew lock successfully when owned by current user', async () => {
      // Acquire lock first
      const acquireResponse = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-123',
        });

      if (acquireResponse.status === HttpStatus.NOT_FOUND) {
        return; // Skip if no orders
      }

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
      const acquireResp = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-user1',
        });

      if (acquireResp.status === HttpStatus.NOT_FOUND) {
        return; // Skip if no orders
      }

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
          order_type: 'internal',
          session_id: 'test-session-123',
        });

      if (acquireResponse.status === HttpStatus.NOT_FOUND) {
        return; // Skip if no orders
      }

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
      const acquireResp = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-123',
        });

      if (acquireResp.status === HttpStatus.NOT_FOUND) {
        return; // Skip if no orders
      }

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

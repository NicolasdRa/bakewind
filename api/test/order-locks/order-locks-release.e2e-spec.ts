import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken, TEST_USERS } from '../test-setup';

describe('OrderLocks API - DELETE /api/v1/order-locks/release/:orderId (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let secondUserToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);

    // Get second user token (manager role)
    secondUserToken = await getAuthToken(app, TEST_USERS.manager);

    // Get a test order ID from internal-orders
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

  describe('DELETE /api/v1/order-locks/release/:orderId', () => {
    it('should release lock successfully when owned by current user', async () => {
      // Acquire lock first
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

      // Release the lock
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify lock is released by checking status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(statusResponse.body).toHaveProperty('locked', false);
    });

    it('should return 404 when trying to release lock not owned by current user', async () => {
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

      // Second user tries to release it
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');

      // Clean up: first user releases
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 404 when no lock exists on order', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${fakeOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid order ID format', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/order-locks/release/not-a-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should allow lock to be released multiple times idempotently', async () => {
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

      // Release once
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Try to release again (should return 404 since no lock exists)
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});

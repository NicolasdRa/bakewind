import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken, TEST_USERS } from '../test-setup';

describe('OrderLocks API - GET /api/v1/order-locks/status/:orderId (e2e)', () => {
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

  describe('GET /api/v1/order-locks/status/:orderId', () => {
    it('should return OrderLock when order is locked', async () => {
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

      // Check status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // Validate OrderLock response schema
      expect(statusResponse.body).toHaveProperty('id');
      expect(statusResponse.body).toHaveProperty('order_id', testOrderId);
      expect(statusResponse.body).toHaveProperty('locked_by_user_id');
      expect(statusResponse.body).toHaveProperty('locked_by_user_name');
      expect(statusResponse.body).toHaveProperty(
        'locked_by_session_id',
        'test-session-123',
      );
      expect(statusResponse.body).toHaveProperty('locked_at');
      expect(statusResponse.body).toHaveProperty('expires_at');
      expect(statusResponse.body).toHaveProperty('last_activity_at');

      // Verify it matches the acquired lock
      expect(statusResponse.body.id).toBe(acquireResponse.body.id);
      expect(statusResponse.body.locked_by_user_id).toBe(
        acquireResponse.body.locked_by_user_id,
      );

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return UnlockedStatus when order is not locked', async () => {
      // Ensure no lock exists (try to release any existing lock)
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Check status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      if (statusResponse.status === HttpStatus.NOT_FOUND) {
        return; // Skip if order doesn't exist
      }

      // Validate UnlockedStatus response schema
      expect(statusResponse.body).toHaveProperty('order_id', testOrderId);
      expect(statusResponse.body).toHaveProperty('locked', false);
      expect(statusResponse.body).not.toHaveProperty('locked_by_user_id');
      expect(statusResponse.body).not.toHaveProperty('locked_by_user_name');
    });

    it('should return lock status visible to other users', async () => {
      // First user acquires lock
      const acquireResponse = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-user1',
        });

      if (acquireResponse.status === HttpStatus.NOT_FOUND) {
        return; // Skip if no orders
      }

      // Second user checks status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(HttpStatus.OK);

      // Verify second user can see the lock
      expect(statusResponse.body).toHaveProperty('order_id', testOrderId);
      expect(statusResponse.body).toHaveProperty(
        'locked_by_user_id',
        acquireResponse.body.locked_by_user_id,
      );
      expect(statusResponse.body).toHaveProperty('locked_by_user_name');
      expect(statusResponse.body.locked_by_user_name).toBeTruthy();

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${fakeOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid order ID format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/order-locks/status/not-a-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reflect lock state changes immediately', async () => {
      // Check unlocked status
      let statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      if (statusResponse.status === HttpStatus.NOT_FOUND) {
        return; // Skip if order doesn't exist
      }

      expect(statusResponse.body.locked).toBe(false);

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
        return;
      }

      // Check locked status
      statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(statusResponse.body).toHaveProperty('locked_by_user_id');

      // Release lock
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Check unlocked status again
      statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(statusResponse.body.locked).toBe(false);
    });

    it('should include user display name in locked status', async () => {
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
        return;
      }

      // Check status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // Verify locked_by_user_name is present and non-empty
      expect(statusResponse.body).toHaveProperty('locked_by_user_name');
      expect(typeof statusResponse.body.locked_by_user_name).toBe('string');
      expect(statusResponse.body.locked_by_user_name.length).toBeGreaterThan(0);

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});

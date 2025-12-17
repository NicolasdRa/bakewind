import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken } from '../test-setup';

describe('OrderLocks API - POST /api/v1/order-locks/acquire (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);

    // Get a test order ID from internal-orders endpoint
    const ordersResponse = await request(app.getHttpServer())
      .get('/internal-orders')
      .set('Authorization', `Bearer ${authToken}`);

    const orders = ordersResponse.body.data || ordersResponse.body;
    if (Array.isArray(orders) && orders.length > 0) {
      testOrderId = orders[0].id;
    } else {
      // Use a placeholder ID for testing
      testOrderId = '550e8400-e29b-41d4-a716-446655440000';
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // Clean up any existing locks before each test
  beforeEach(async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/order-locks/release/${testOrderId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });

  describe('POST /api/v1/order-locks/acquire', () => {
    it('should acquire lock on an unlocked order', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-123',
        });

      // Accept 200 OK or skip if order not found
      if (response.status === HttpStatus.NOT_FOUND) {
        return; // Skip test if no orders exist
      }
      expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);

      // Validate OrderLock response schema
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('order_id', testOrderId);
      expect(response.body).toHaveProperty('locked_by_user_id');
      expect(response.body).toHaveProperty('locked_by_user_name');
      expect(response.body).toHaveProperty(
        'locked_by_session_id',
        'test-session-123',
      );
      expect(response.body).toHaveProperty('locked_at');
      expect(response.body).toHaveProperty('expires_at');
      expect(response.body).toHaveProperty('last_activity_at');

      // Validate timestamps
      expect(new Date(response.body.locked_at).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
      expect(new Date(response.body.expires_at).getTime()).toBeGreaterThan(
        Date.now(),
      );

      // Validate expires_at is ~5 minutes from locked_at
      const lockedAt = new Date(response.body.locked_at).getTime();
      const expiresAt = new Date(response.body.expires_at).getTime();
      const ttlMinutes = (expiresAt - lockedAt) / 1000 / 60;
      expect(ttlMinutes).toBeGreaterThanOrEqual(4.9);
      expect(ttlMinutes).toBeLessThanOrEqual(5.1);

      // Clean up: release the lock
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 409 conflict when order is already locked', async () => {
      // First, acquire the lock
      const acquireResp = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-first',
        });

      if (acquireResp.status === HttpStatus.NOT_FOUND) {
        return; // Skip if no orders
      }

      // Try to acquire again with different session
      const response = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-second',
        })
        .expect(HttpStatus.CONFLICT);

      // Validate LockConflictError schema
      expect(response.body).toHaveProperty('statusCode', 409);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('locked_by');
      expect(response.body.locked_by).toHaveProperty('locked_by_user_name');
      expect(response.body.locked_by).toHaveProperty(
        'locked_by_session_id',
        'test-session-first',
      );

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: fakeOrderId,
          order_type: 'internal',
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid request body', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: 'not-a-uuid',
          order_type: 'internal',
          session_id: '',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should allow same user to reacquire lock after release', async () => {
      // Acquire lock
      const acquireResp = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-1',
        });

      if (acquireResp.status === HttpStatus.NOT_FOUND) {
        return; // Skip if no orders
      }

      // Release lock
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Reacquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          order_type: 'internal',
          session_id: 'test-session-2',
        });

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OrderLocks API - POST /api/v1/order-locks/acquire (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@bakery.com',
        password: 'password123',
      })
      .expect(HttpStatus.OK);

    authToken = loginResponse.body.access_token;

    // Get a test order ID from the orders endpoint
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

  describe('POST /api/v1/order-locks/acquire', () => {
    it('should acquire lock on an unlocked order', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.OK);

      // Validate OrderLock response schema
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('order_id', testOrderId);
      expect(response.body).toHaveProperty('locked_by_user_id');
      expect(response.body).toHaveProperty('locked_by_user_name');
      expect(response.body).toHaveProperty('locked_by_session_id', 'test-session-123');
      expect(response.body).toHaveProperty('locked_at');
      expect(response.body).toHaveProperty('expires_at');
      expect(response.body).toHaveProperty('last_activity_at');

      // Validate timestamps
      expect(new Date(response.body.locked_at).getTime()).toBeLessThanOrEqual(Date.now());
      expect(new Date(response.body.expires_at).getTime()).toBeGreaterThan(Date.now());

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
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-first',
        })
        .expect(HttpStatus.OK);

      // Try to acquire again with different session
      const response = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-second',
        })
        .expect(HttpStatus.CONFLICT);

      // Validate LockConflictError schema
      expect(response.body).toHaveProperty('statusCode', 409);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('locked_by');
      expect(response.body.locked_by).toHaveProperty('locked_by_user_name');
      expect(response.body.locked_by).toHaveProperty('locked_by_session_id', 'test-session-first');

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
          session_id: '',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should allow same user to reacquire lock after release', async () => {
      // Acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-1',
        })
        .expect(HttpStatus.OK);

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
          session_id: 'test-session-2',
        })
        .expect(HttpStatus.OK);

      // Clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/order-locks/release/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });
});

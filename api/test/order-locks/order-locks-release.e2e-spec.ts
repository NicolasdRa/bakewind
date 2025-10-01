import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OrderLocks API - DELETE /api/v1/order-locks/release/:orderId (e2e)', () => {
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

    // Create and login as second user for testing permissions
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

  describe('DELETE /api/v1/order-locks/release/:orderId', () => {
    it('should release lock successfully when owned by current user', async () => {
      // Acquire lock first
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.OK);

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
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-user1',
        })
        .expect(HttpStatus.OK);

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
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: 'test-session-123',
        })
        .expect(HttpStatus.OK);

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

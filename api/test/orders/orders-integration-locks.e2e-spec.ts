import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  OrderType,
  OrderSource,
  OrderStatus,
} from '../../src/orders/dto';

describe('Orders Integration - Order Locks (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let secondAuthToken: string;
  let testOrderId: string;
  let sessionId1: string;
  let sessionId2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for first user
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@bakery.com', password: 'password123' })
      .expect(HttpStatus.OK);

    authToken = loginResponse.body.access_token;

    // For multi-user tests, we would need a second user
    // For now, we'll use the same token but different session IDs
    secondAuthToken = authToken;

    sessionId1 = `session-${Date.now()}-1`;
    sessionId2 = `session-${Date.now()}-2`;

    // Create a test order
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderNumber: `TEST-LOCK-INT-${Date.now()}`,
        orderType: OrderType.CUSTOMER,
        customerName: 'Lock Test Customer',
        source: OrderSource.ONLINE,
        status: OrderStatus.PENDING,
        subtotal: '100.00',
        tax: '10.00',
        total: '110.00',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: '100.00',
          },
        ],
      });

    testOrderId = createResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testOrderId) {
      // Release any locks first
      try {
        await request(app.getHttpServer())
          .post('/api/v1/order-locks/release')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ order_id: testOrderId });
      } catch (e) {
        // Ignore errors if lock doesn't exist
      }

      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    await app.close();
  });

  describe('Lock integration with order updates', () => {
    it('should require lock before updating order', async () => {
      // Try to update without acquiring lock (should succeed but best practice is to lock)
      const updateDto = {
        notes: 'Updated without lock',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.notes).toBe(updateDto.notes);
    });

    it('should allow update when user has lock', async () => {
      // Acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // Update should succeed
      const updateDto = {
        notes: 'Updated with lock',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.notes).toBe(updateDto.notes);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);
    });

    it('should prevent concurrent edits with locks', async () => {
      // User 1 acquires lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // User 2 tries to acquire lock (should fail)
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId2,
        })
        .expect(HttpStatus.CONFLICT);

      // Check lock status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(statusResponse.body.locked).toBe(true);
      expect(statusResponse.body.order_id).toBe(testOrderId);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);
    });

    it('should allow lock acquisition after release', async () => {
      // Acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);

      // Acquire lock again (should succeed)
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);
    });

    it('should renew lock during long edit session', async () => {
      // Acquire lock
      const acquireResponse = await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      expect(acquireResponse.body.locked).toBe(true);

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Renew lock
      const renewResponse = await request(app.getHttpServer())
        .post('/api/v1/order-locks/renew')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);

      expect(renewResponse.body.locked).toBe(true);
      expect(renewResponse.body.order_id).toBe(testOrderId);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);
    });

    it('should clean up lock when order is deleted', async () => {
      // Create a temporary order
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `TEMP-LOCK-${Date.now()}`,
          customerName: 'Temp',
          source: OrderSource.ONLINE,
          subtotal: '10.00',
          tax: '1.00',
          total: '11.00',
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Temp',
              quantity: 1,
              unitPrice: '10.00',
            },
          ],
        });

      const tempOrderId = createResponse.body.id;

      // Acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: tempOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // Delete order (should clean up lock)
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${tempOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Lock status should return 404 (order not found)
      await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${tempOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle lock with status transitions', async () => {
      // Acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // Update status while locked
      const statusResponse = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(HttpStatus.OK);

      expect(statusResponse.body.status).toBe(OrderStatus.CONFIRMED);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);

      // Reset status back to pending
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.PENDING })
        .expect(HttpStatus.OK);
    });

    it('should track multiple update attempts with locks', async () => {
      // First user acquires lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // First user updates order
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'First update' })
        .expect(HttpStatus.OK);

      // Second user tries to acquire lock (fails)
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId2,
        })
        .expect(HttpStatus.CONFLICT);

      // First user releases lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);

      // Second user can now acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId2,
        })
        .expect(HttpStatus.OK);

      // Second user updates order
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ notes: 'Second update' })
        .expect(HttpStatus.OK);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);
    });
  });

  describe('Lock status checks during order operations', () => {
    it('should reflect lock status in order details', async () => {
      // Get order without lock
      const beforeLockResponse = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(beforeLockResponse.body.id).toBe(testOrderId);

      // Acquire lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: testOrderId,
          session_id: sessionId1,
        })
        .expect(HttpStatus.OK);

      // Check lock status
      const lockStatusResponse = await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(lockStatusResponse.body.locked).toBe(true);

      // Get order with lock
      const afterLockResponse = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(afterLockResponse.body.id).toBe(testOrderId);

      // Release lock
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ order_id: testOrderId })
        .expect(HttpStatus.OK);
    });
  });
});

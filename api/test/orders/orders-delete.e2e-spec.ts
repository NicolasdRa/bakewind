import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  OrderType,
  OrderSource,
  OrderStatus,
} from '../../src/orders/dto';

describe('Orders API - DELETE /api/v1/orders/:id (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@bakery.com', password: 'password123' })
      .expect(HttpStatus.OK);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('DELETE /api/v1/orders/:id', () => {
    it('should delete an order successfully', async () => {
      // Create an order to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `TEST-DELETE-${Date.now()}`,
          orderType: OrderType.CUSTOMER,
          customerName: 'Test Customer',
          source: OrderSource.ONLINE,
          status: OrderStatus.PENDING,
          subtotal: '50.00',
          tax: '5.00',
          total: '55.00',
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Test Product',
              quantity: 1,
              unitPrice: '50.00',
            },
          ],
        });

      const orderId = createResponse.body.id;

      // Delete the order
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify the order is deleted
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should cascade delete order items', async () => {
      // Create an order with multiple items
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `TEST-CASCADE-${Date.now()}`,
          orderType: OrderType.CUSTOMER,
          customerName: 'Test Customer',
          source: OrderSource.ONLINE,
          status: OrderStatus.PENDING,
          subtotal: '150.00',
          tax: '15.00',
          total: '165.00',
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Product 1',
              quantity: 2,
              unitPrice: '50.00',
            },
            {
              productId: '00000000-0000-0000-0000-000000000002',
              productName: 'Product 2',
              quantity: 1,
              unitPrice: '50.00',
            },
          ],
        });

      const orderId = createResponse.body.id;

      // Delete the order
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify the order and all its items are deleted
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      // Create an order
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `TEST-UNAUTH-${Date.now()}`,
          customerName: 'Test',
          source: OrderSource.ONLINE,
          subtotal: '10.00',
          tax: '1.00',
          total: '11.00',
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Test',
              quantity: 1,
              unitPrice: '10.00',
            },
          ],
        });

      const orderId = createResponse.body.id;

      // Try to delete without authentication
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .expect(HttpStatus.UNAUTHORIZED);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/orders/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should release order lock when deleting', async () => {
      // Create an order
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `TEST-LOCK-DELETE-${Date.now()}`,
          customerName: 'Test',
          source: OrderSource.ONLINE,
          subtotal: '10.00',
          tax: '1.00',
          total: '11.00',
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Test',
              quantity: 1,
              unitPrice: '10.00',
            },
          ],
        });

      const orderId = createResponse.body.id;

      // Acquire lock on the order
      await request(app.getHttpServer())
        .post('/api/v1/order-locks/acquire')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_id: orderId,
          session_id: 'test-session',
        })
        .expect(HttpStatus.OK);

      // Delete the order (should release lock)
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify lock status - order should not be found
      await request(app.getHttpServer())
        .get(`/api/v1/order-locks/status/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete internal production orders', async () => {
      // Create an internal order
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `INT-DELETE-${Date.now()}`,
          orderType: OrderType.INTERNAL,
          customerName: 'Internal Production',
          source: OrderSource.WHOLESALE,
          status: OrderStatus.SCHEDULED,
          subtotal: '200.00',
          tax: '0.00',
          total: '200.00',
          batchNumber: 'BATCH-TEST',
          targetQuantity: 50,
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Product',
              quantity: 50,
              unitPrice: '4.00',
            },
          ],
        });

      const orderId = createResponse.body.id;

      // Delete the internal order
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle deleting same order twice', async () => {
      // Create an order
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `TEST-DOUBLE-DELETE-${Date.now()}`,
          customerName: 'Test',
          source: OrderSource.ONLINE,
          subtotal: '10.00',
          tax: '1.00',
          total: '11.00',
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Test',
              quantity: 1,
              unitPrice: '10.00',
            },
          ],
        });

      const orderId = createResponse.body.id;

      // First deletion should succeed
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Second deletion should return 404
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  OrderType,
  OrderSource,
  OrderStatus,
} from '../../src/orders/dto';

describe('Orders API - GET endpoints (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testOrderId: string;
  let testOrderNumber: string;

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

    // Create a test order for GET operations
    testOrderNumber = `TEST-GET-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderNumber: testOrderNumber,
        orderType: OrderType.CUSTOMER,
        customerName: 'Test Customer',
        source: OrderSource.ONLINE,
        status: OrderStatus.PENDING,
        subtotal: '100.00',
        tax: '10.00',
        total: '110.00',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: '50.00',
          },
        ],
      });

    testOrderId = createResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testOrderId) {
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    await app.close();
  });

  describe('GET /api/v1/orders', () => {
    it('should get all orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const order = response.body[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('customerName');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('createdAt');
    });

    it('should filter orders by orderType', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ orderType: OrderType.CUSTOMER })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((order: any) => {
        expect(order.orderType).toBe(OrderType.CUSTOMER);
      });
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ status: OrderStatus.PENDING })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((order: any) => {
        expect(order.status).toBe(OrderStatus.PENDING);
      });
    });

    it('should search orders by customer name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ search: 'Test Customer' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      const foundOrder = response.body.find(
        (order: any) => order.id === testOrderId,
      );
      expect(foundOrder).toBeDefined();
    });

    it('should combine multiple filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({
          orderType: OrderType.CUSTOMER,
          status: OrderStatus.PENDING,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((order: any) => {
        expect(order.orderType).toBe(OrderType.CUSTOMER);
        expect(order.status).toBe(OrderStatus.PENDING);
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/orders/stats', () => {
    it('should get order statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('byPriority');
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.byStatus).toBe('object');
      expect(typeof response.body.byPriority).toBe('object');
    });

    it('should get stats filtered by orderType', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/stats')
        .query({ orderType: OrderType.INTERNAL })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byStatus');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/stats')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should get order by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(testOrderId);
      expect(response.body.orderNumber).toBe(testOrderNumber);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent order ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/orders/number/:orderNumber', () => {
    it('should get order by order number', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/number/${testOrderNumber}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(testOrderId);
      expect(response.body.orderNumber).toBe(testOrderNumber);
      expect(response.body).toHaveProperty('items');
    });

    it('should return 404 for non-existent order number', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/number/NON-EXISTENT-ORDER')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/orders/number/${testOrderNumber}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});

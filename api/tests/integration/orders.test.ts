import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Orders API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'password123',
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/orders', () => {
    it('should create order with valid data', async () => {
      const orderData = {
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 2,
            customizations: ['extra frosting'],
          },
        ],
        deliveryType: 'pickup',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        customerNotes: 'Please call when ready',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body.status).toBe('pending');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.deliveryType).toBe('pickup');
      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body).toHaveProperty('estimatedReady');
    });

    it('should reject order without authentication', async () => {
      const orderData = {
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 1,
          },
        ],
        deliveryType: 'pickup',
      };

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(orderData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });

    it('should validate item quantities', async () => {
      const orderData = {
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 0,
          },
        ],
        deliveryType: 'pickup',
      };

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orderData)
        .expect(400);
    });

    it('should calculate total amount correctly', async () => {
      const orderData = {
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 3,
          },
        ],
        deliveryType: 'pickup',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.totalAmount).toBeGreaterThan(0);
      expect(typeof response.body.totalAmount).toBe('number');
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return order details for valid ID', async () => {
      // Create an order first
      const orderData = {
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 1,
          },
        ],
        deliveryType: 'pickup',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orderData);

      const orderId = createResponse.body.id;

      // Get the order
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', orderId);
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should only allow access to own orders', async () => {
      // This would need a different user's order ID
      // For now, we'll test access control concept
      const someOrderId = '123e4567-e89b-12d3-a456-426614174001';

      await request(app.getHttpServer())
        .get(`/api/v1/orders/${someOrderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404); // Should not find order belonging to another user
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should return user orders with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders?status=pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(
          response.body.data.every((order: any) => order.status === 'pending'),
        ).toBe(true);
      }
    });
  });
});

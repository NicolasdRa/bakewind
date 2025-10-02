import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Admin Orders API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let managerToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@bakewind.com',
        password: 'admin123'
      });
    adminToken = adminLogin.body.accessToken;

    // Login as manager
    const managerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'manager@bakewind.com',
        password: 'manager123'
      });
    managerToken = managerLogin.body.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/admin/orders', () => {
    it('should return all orders for admin users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data.every((order: any) => order.status === 'pending')).toBe(true);
      }
    });

    it('should filter orders by date range', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/orders?fromDate=${today}&toDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by customer', async () => {
      const customerId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/orders?customerId=${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data.every((order: any) => order.customerId === customerId)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should include order details with customer info', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const order = response.body.data[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('orderNumber');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('totalAmount');
        expect(order).toHaveProperty('customer');
        expect(order.customer).toHaveProperty('firstName');
        expect(order.customer).toHaveProperty('lastName');
        expect(order.customer).toHaveProperty('email');
        expect(order).toHaveProperty('items');
        expect(order).toHaveProperty('createdAt');
        expect(order).toHaveProperty('scheduledFor');
      }
    });

    it('should reject access for customer users', async () => {
      const customerLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'customer123'
        });

      await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${customerLogin.body.accessToken}`)
        .expect(403); // Forbidden
    });
  });

  describe('PATCH /api/v1/admin/orders/:id', () => {
    it('should update order status', async () => {
      // First create or get an order
      const ordersResponse = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (ordersResponse.body.data.length > 0) {
        const orderId = ordersResponse.body.data[0].id;

        const updateData = {
          status: 'in_production',
          notes: 'Started baking bread items'
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/admin/orders/${orderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.status).toBe('in_production');
        expect(response.body).toHaveProperty('updatedAt');
      }
    });

    it('should validate status transitions', async () => {
      const ordersResponse = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?status=delivered&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (ordersResponse.body.data.length > 0) {
        const orderId = ordersResponse.body.data[0].id;

        // Try to move delivered order back to pending (should fail)
        await request(app.getHttpServer())
          .patch(`/api/v1/admin/orders/${orderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'pending' })
          .expect(400);
      }
    });

    it('should update estimated ready time', async () => {
      const ordersResponse = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (ordersResponse.body.data.length > 0) {
        const orderId = ordersResponse.body.data[0].id;
        const newReadyTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/admin/orders/${orderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ estimatedReady: newReadyTime })
          .expect(200);

        expect(new Date(response.body.estimatedReady)).toEqual(newReadyTime);
      }
    });

    it('should track status change history', async () => {
      const ordersResponse = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (ordersResponse.body.data.length > 0) {
        const orderId = ordersResponse.body.data[0].id;

        await request(app.getHttpServer())
          .patch(`/api/v1/admin/orders/${orderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'confirmed' })
          .expect(200);

        // Get order details to check history
        const response = await request(app.getHttpServer())
          .get(`/api/v1/admin/orders/${orderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('statusHistory');
        expect(Array.isArray(response.body.statusHistory)).toBe(true);
      }
    });

    it('should allow managers to update orders', async () => {
      const ordersResponse = await request(app.getHttpServer())
        .get('/api/v1/admin/orders?limit=1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      if (ordersResponse.body.data.length > 0) {
        const orderId = ordersResponse.body.data[0].id;

        await request(app.getHttpServer())
          .patch(`/api/v1/admin/orders/${orderId}`)
          .set('Authorization', `Bearer ${managerToken}`)
          .send({ status: 'ready' })
          .expect(200);
      }
    });

    it('should reject updates from non-admin users', async () => {
      const customerLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'customer123'
        });

      const orderId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerLogin.body.accessToken}`)
        .send({ status: 'cancelled' })
        .expect(403);
    });
  });
});
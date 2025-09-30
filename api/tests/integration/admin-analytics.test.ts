import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Admin Analytics API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/admin/analytics/overview', () => {
    it('should return dashboard overview metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('revenue');
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('production');

      // Revenue metrics
      expect(response.body.revenue).toHaveProperty('today');
      expect(response.body.revenue).toHaveProperty('thisWeek');
      expect(response.body.revenue).toHaveProperty('thisMonth');
      expect(response.body.revenue).toHaveProperty('growth');

      // Order metrics
      expect(response.body.orders).toHaveProperty('pending');
      expect(response.body.orders).toHaveProperty('inProduction');
      expect(response.body.orders).toHaveProperty('ready');
      expect(response.body.orders).toHaveProperty('completed');

      // Customer metrics
      expect(response.body.customers).toHaveProperty('total');
      expect(response.body.customers).toHaveProperty('new');
      expect(response.body.customers).toHaveProperty('returning');

      // Production metrics
      expect(response.body.production).toHaveProperty('efficiency');
      expect(response.body.production).toHaveProperty('capacity');
      expect(response.body.production).toHaveProperty('alerts');
    });

    it('should support date range filtering', async () => {
      const fromDate = new Date('2024-01-01').toISOString();
      const toDate = new Date('2024-12-31').toISOString();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/analytics/overview?from=${fromDate}&to=${toDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('dateRange');
      expect(response.body.dateRange.from).toBe(fromDate);
      expect(response.body.dateRange.to).toBe(toDate);
    });
  });

  describe('GET /api/v1/admin/analytics/revenue', () => {
    it('should return revenue analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('timeSeries');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body).toHaveProperty('trends');

      // Time series data
      expect(Array.isArray(response.body.timeSeries)).toBe(true);
      if (response.body.timeSeries.length > 0) {
        const dataPoint = response.body.timeSeries[0];
        expect(dataPoint).toHaveProperty('date');
        expect(dataPoint).toHaveProperty('revenue');
        expect(dataPoint).toHaveProperty('orders');
      }

      // Revenue breakdown
      expect(response.body.breakdown).toHaveProperty('byCategory');
      expect(response.body.breakdown).toHaveProperty('byLocation');
      expect(response.body.breakdown).toHaveProperty('byPaymentMethod');

      // Trends
      expect(response.body.trends).toHaveProperty('growthRate');
      expect(response.body.trends).toHaveProperty('seasonality');
    });

    it('should support different time periods', async () => {
      const periods = ['daily', 'weekly', 'monthly', 'yearly'];

      for (const period of periods) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/admin/analytics/revenue?period=${period}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('period', period);
        expect(Array.isArray(response.body.timeSeries)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/admin/analytics/products', () => {
    it('should return product performance analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('topSelling');
      expect(response.body).toHaveProperty('lowPerforming');
      expect(response.body).toHaveProperty('categoryPerformance');
      expect(response.body).toHaveProperty('profitability');

      // Top selling products
      expect(Array.isArray(response.body.topSelling)).toBe(true);
      if (response.body.topSelling.length > 0) {
        const product = response.body.topSelling[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('totalSold');
        expect(product).toHaveProperty('revenue');
        expect(product).toHaveProperty('growth');
      }

      // Category performance
      expect(Array.isArray(response.body.categoryPerformance)).toBe(true);
      if (response.body.categoryPerformance.length > 0) {
        const category = response.body.categoryPerformance[0];
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('revenue');
        expect(category).toHaveProperty('volume');
        expect(category).toHaveProperty('margin');
      }
    });

    it('should support product ranking filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/products?rankBy=revenue&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.topSelling.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/v1/admin/analytics/customers', () => {
    it('should return customer analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('acquisition');
      expect(response.body).toHaveProperty('retention');
      expect(response.body).toHaveProperty('lifetime');
      expect(response.body).toHaveProperty('segments');

      // Customer acquisition
      expect(response.body.acquisition).toHaveProperty('newCustomers');
      expect(response.body.acquisition).toHaveProperty('acquisitionRate');
      expect(response.body.acquisition).toHaveProperty('sources');

      // Customer retention
      expect(response.body.retention).toHaveProperty('retentionRate');
      expect(response.body.retention).toHaveProperty('churnRate');
      expect(response.body.retention).toHaveProperty('repeatPurchases');

      // Customer lifetime value
      expect(response.body.lifetime).toHaveProperty('averageValue');
      expect(response.body.lifetime).toHaveProperty('averageOrders');
      expect(response.body.lifetime).toHaveProperty('averageLifespan');
    });

    it('should include customer segmentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.segments)).toBe(true);
      if (response.body.segments.length > 0) {
        const segment = response.body.segments[0];
        expect(segment).toHaveProperty('name');
        expect(segment).toHaveProperty('count');
        expect(segment).toHaveProperty('percentage');
        expect(segment).toHaveProperty('averageValue');
      }
    });
  });

  describe('GET /api/v1/admin/analytics/production', () => {
    it('should return production efficiency metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/production')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('efficiency');
      expect(response.body).toHaveProperty('capacity');
      expect(response.body).toHaveProperty('schedule');
      expect(response.body).toHaveProperty('waste');

      // Production efficiency
      expect(response.body.efficiency).toHaveProperty('overall');
      expect(response.body.efficiency).toHaveProperty('byCategory');
      expect(response.body.efficiency).toHaveProperty('trends');

      // Capacity utilization
      expect(response.body.capacity).toHaveProperty('current');
      expect(response.body.capacity).toHaveProperty('maximum');
      expect(response.body.capacity).toHaveProperty('utilization');

      // Schedule performance
      expect(response.body.schedule).toHaveProperty('onTime');
      expect(response.body.schedule).toHaveProperty('delayed');
      expect(response.body.schedule).toHaveProperty('averageDelay');
    });

    it('should track waste and material efficiency', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/production')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.waste).toHaveProperty('total');
      expect(response.body.waste).toHaveProperty('byCategory');
      expect(response.body.waste).toHaveProperty('cost');
      expect(response.body.waste).toHaveProperty('trends');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject access for customer users', async () => {
      const customerLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'customer123'
        });

      await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${customerLogin.body.accessToken}`)
        .expect(403);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/overview')
        .expect(401);
    });

    it('should allow manager access to analytics', async () => {
      const managerLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@bakewind.com',
          password: 'manager123'
        });

      await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${managerLogin.body.accessToken}`)
        .expect(200);
    });
  });
});
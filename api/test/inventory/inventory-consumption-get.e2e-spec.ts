import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Inventory API - GET /api/v1/inventory/:itemId/consumption (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testItemId: string;

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

    const inventoryResponse = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(HttpStatus.OK);

    if (inventoryResponse.body.length > 0) {
      testItemId = inventoryResponse.body[0].id;
    } else {
      throw new Error('No test inventory items available');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/inventory/:itemId/consumption', () => {
    it('should retrieve consumption tracking data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/inventory/${testItemId}/consumption`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // Validate ConsumptionTracking schema
      expect(response.body).toHaveProperty('inventory_item_id', testItemId);
      expect(response.body).toHaveProperty('avg_daily_consumption');
      expect(response.body).toHaveProperty('calculation_period_days');
      expect(response.body).toHaveProperty('last_calculated_at');
      expect(response.body).toHaveProperty('calculation_method');
      expect(response.body).toHaveProperty('sample_size');
      expect(response.body).toHaveProperty('days_of_supply_remaining');

      // Validate calculation_method enum
      expect(['historical_orders', 'manual', 'predicted']).toContain(
        response.body.calculation_method,
      );

      // Validate numeric fields
      expect(typeof response.body.avg_daily_consumption).toBe('number');
      expect(response.body.avg_daily_consumption).toBeGreaterThanOrEqual(0);
      expect(typeof response.body.calculation_period_days).toBe('number');
      expect(response.body.calculation_period_days).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent item', async () => {
      const fakeItemId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/api/v1/inventory/${fakeItemId}/consumption`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/inventory/${testItemId}/consumption`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});

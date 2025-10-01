import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Inventory API - PUT /api/v1/inventory/:itemId/consumption/threshold (e2e)', () => {
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
    // Clean up: remove custom threshold
    await request(app.getHttpServer())
      .delete(`/api/v1/inventory/${testItemId}/consumption/threshold`)
      .set('Authorization', `Bearer ${authToken}`);

    await app.close();
  });

  describe('PUT /api/v1/inventory/:itemId/consumption/threshold', () => {
    it('should set custom reorder threshold', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          custom_reorder_threshold: 50,
          custom_lead_time_days: 5,
        })
        .expect(HttpStatus.OK);

      // Validate updated ConsumptionTracking
      expect(response.body).toHaveProperty('inventory_item_id', testItemId);
      expect(response.body).toHaveProperty('custom_reorder_threshold', 50);
      expect(response.body).toHaveProperty('custom_lead_time_days', 5);
    });

    it('should return 400 for negative threshold', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ custom_reorder_threshold: -10 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid request body', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ custom_reorder_threshold: 'not-a-number' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 for non-existent item', async () => {
      const fakeItemId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .put(`/api/v1/inventory/${fakeItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ custom_reorder_threshold: 50 })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .send({ custom_reorder_threshold: 50 })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});

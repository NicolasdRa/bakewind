import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken } from '../test-setup';

describe('Inventory API - PUT /api/v1/inventory/:itemId/consumption/threshold (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testItemId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);

    const inventoryResponse = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(HttpStatus.OK);

    if (inventoryResponse.body.data && inventoryResponse.body.data.length > 0) {
      testItemId = inventoryResponse.body.data[0].id;
    } else if (inventoryResponse.body.length > 0) {
      testItemId = inventoryResponse.body[0].id;
    } else {
      testItemId = 'test-inventory-id';
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

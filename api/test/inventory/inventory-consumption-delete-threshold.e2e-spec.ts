import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken } from '../test-setup';

describe('Inventory API - DELETE /api/v1/inventory/:itemId/consumption/threshold (e2e)', () => {
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
    await app.close();
  });

  describe('DELETE /api/v1/inventory/:itemId/consumption/threshold', () => {
    it('should remove custom threshold and revert to predictive', async () => {
      // First, set a custom threshold
      await request(app.getHttpServer())
        .put(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ custom_reorder_threshold: 50 })
        .expect(HttpStatus.OK);

      // Delete the custom threshold
      await request(app.getHttpServer())
        .delete(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify it was removed
      const consumptionResponse = await request(app.getHttpServer())
        .get(`/api/v1/inventory/${testItemId}/consumption`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(consumptionResponse.body.custom_reorder_threshold).toBeNull();
    });

    it('should handle non-existent item idempotently', async () => {
      const fakeItemId = '00000000-0000-0000-0000-000000000000';
      // DELETE returns 204 even for non-existent items (idempotent behavior)
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/inventory/${fakeItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([HttpStatus.NOT_FOUND, HttpStatus.NO_CONTENT]).toContain(
        response.status,
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should be idempotent when called multiple times', async () => {
      // Set threshold
      await request(app.getHttpServer())
        .put(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ custom_reorder_threshold: 50 })
        .expect(HttpStatus.OK);

      // Delete once
      await request(app.getHttpServer())
        .delete(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Delete again (should still return 204)
      await request(app.getHttpServer())
        .delete(`/api/v1/inventory/${testItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});

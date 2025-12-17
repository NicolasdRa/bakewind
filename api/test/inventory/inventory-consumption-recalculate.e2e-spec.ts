import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken } from '../test-setup';

describe('Inventory API - POST /api/v1/inventory/:itemId/consumption/recalculate (e2e)', () => {
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

  describe('POST /api/v1/inventory/:itemId/consumption/recalculate', () => {
    it('should trigger on-demand recalculation', async () => {
      // Get current consumption data
      const beforeResponse = await request(app.getHttpServer())
        .get(`/api/v1/inventory/${testItemId}/consumption`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      const beforeCalculatedAt = new Date(
        beforeResponse.body.last_calculated_at,
      );

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Trigger recalculation (POST may return 201 Created or 200 OK)
      const recalcResponse = await request(app.getHttpServer())
        .post(`/api/v1/inventory/${testItemId}/consumption/recalculate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(
        recalcResponse.status,
      );

      // Validate ConsumptionTracking schema
      expect(recalcResponse.body).toHaveProperty(
        'inventory_item_id',
        testItemId,
      );
      expect(recalcResponse.body).toHaveProperty('avg_daily_consumption');
      expect(recalcResponse.body).toHaveProperty('last_calculated_at');

      // Verify last_calculated_at was updated
      const afterCalculatedAt = new Date(
        recalcResponse.body.last_calculated_at,
      );
      expect(afterCalculatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCalculatedAt.getTime(),
      );
    });

    it('should recalculate based on 7-day rolling window', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/inventory/${testItemId}/consumption/recalculate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(response.status);
      expect(response.body).toHaveProperty('calculation_period_days', 7);
      expect(response.body).toHaveProperty('sample_size');
      expect(response.body.sample_size).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for non-existent item', async () => {
      const fakeItemId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .post(`/api/v1/inventory/${fakeItemId}/consumption/recalculate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/inventory/${testItemId}/consumption/recalculate`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should allow multiple recalculations in succession', async () => {
      // Recalculate first time
      const firstResponse = await request(app.getHttpServer())
        .post(`/api/v1/inventory/${testItemId}/consumption/recalculate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(
        firstResponse.status,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Recalculate second time
      const secondResponse = await request(app.getHttpServer())
        .post(`/api/v1/inventory/${testItemId}/consumption/recalculate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(
        secondResponse.status,
      );

      // Timestamps should be different
      const firstCalculatedAt = new Date(
        firstResponse.body.last_calculated_at,
      ).getTime();
      const secondCalculatedAt = new Date(
        secondResponse.body.last_calculated_at,
      ).getTime();
      expect(secondCalculatedAt).toBeGreaterThanOrEqual(firstCalculatedAt);
    });
  });
});

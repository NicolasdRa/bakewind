import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Inventory API - DELETE /api/v1/inventory/:itemId/consumption/threshold (e2e)', () => {
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

    it('should return 404 for non-existent item', async () => {
      const fakeItemId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .delete(`/api/v1/inventory/${fakeItemId}/consumption/threshold`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
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

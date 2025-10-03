import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Products API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/products', () => {
    it('should return paginated products list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?category=bread')
        .expect(200);

      expect(
        response.body.data.every(
          (product: any) => product.category === 'bread',
        ),
      ).toBe(true);
    });

    it('should filter products by availability', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?available=true')
        .expect(200);

      expect(
        response.body.data.every(
          (product: any) => product.isAvailable === true,
        ),
      ).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=5')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should include product details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('images');
        expect(product).toHaveProperty('isAvailable');
        expect(product).toHaveProperty('allergens');
      }
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return product details for valid ID', async () => {
      // First get a product ID
      const productsResponse = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      if (productsResponse.body.data.length > 0) {
        const productId = productsResponse.body.data[0].id;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/products/${productId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', productId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('price');
        expect(response.body).toHaveProperty('ingredients');
        expect(response.body).toHaveProperty('nutritionalInfo');
      }
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/products/${nonExistentId}`)
        .expect(404);
    });

    it('should return 400 for invalid product ID format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/invalid-id')
        .expect(400);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Admin Inventory API (e2e)', () => {
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
        password: 'admin123',
      });
    adminToken = (adminLogin.body as { accessToken: string }).accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/admin/inventory', () => {
    it('should return inventory items with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('should include inventory item details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const item = response.body.data[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('sku');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('currentStock');
        expect(item).toHaveProperty('unit');
        expect(item).toHaveProperty('reorderPoint');
        expect(item).toHaveProperty('maxStock');
        expect(item).toHaveProperty('costPerUnit');
        expect(item).toHaveProperty('supplier');
        expect(item).toHaveProperty('lastRestocked');
        expect(item).toHaveProperty('expirationDate');
      }
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory?category=flour')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(
          response.body.data.every((item: any) => item.category === 'flour'),
        ).toBe(true);
      }
    });

    it('should filter by low stock items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory?lowStock=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(
            (item: any) => item.currentStock <= item.reorderPoint,
          ),
        ).toBe(true);
      }
    });

    it('should filter by expiring items', async () => {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/admin/inventory?expiringBefore=${threeDaysFromNow.toISOString()}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(
            (item: any) => new Date(item.expirationDate) <= threeDaysFromNow,
          ),
        ).toBe(true);
      }
    });

    it('should support search by name or SKU', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory?search=flour')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(
            (item: any) =>
              item.name.toLowerCase().includes('flour') ||
              item.sku.toLowerCase().includes('flour'),
          ),
        ).toBe(true);
      }
    });

    it('should calculate total inventory value', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('lowStockCount');
      expect(response.body).toHaveProperty('expiringCount');
      expect(typeof response.body.totalValue).toBe('number');
    });

    it('should reject access for non-admin users', async () => {
      const customerLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'customer123',
        });

      await request(app.getHttpServer())
        .get('/api/v1/admin/inventory')
        .set(
          'Authorization',
          `Bearer ${(customerLogin.body as { accessToken: string }).accessToken}`,
        )
        .expect(403);
    });
  });

  describe('POST /api/v1/admin/inventory', () => {
    it('should add new inventory item', async () => {
      const newItem = {
        name: 'All-Purpose Flour',
        sku: 'FLOUR-AP-001',
        category: 'flour',
        currentStock: 50,
        unit: 'kg',
        reorderPoint: 10,
        maxStock: 100,
        costPerUnit: 2.5,
        supplier: 'Local Mill Co.',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItem)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.sku).toBe(newItem.sku);
      expect(response.body.currentStock).toBe(newItem.currentStock);
    });

    it('should validate required fields', async () => {
      const incompleteItem = {
        name: 'Test Item',
        // Missing required fields
      };

      await request(app.getHttpServer())
        .post('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteItem)
        .expect(400);
    });

    it('should prevent duplicate SKUs', async () => {
      const item = {
        name: 'Sugar White',
        sku: 'SUGAR-001',
        category: 'sugar',
        currentStock: 25,
        unit: 'kg',
        reorderPoint: 5,
        maxStock: 50,
        costPerUnit: 1.2,
      };

      // Create first item
      await request(app.getHttpServer())
        .post('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(item)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...item, name: 'Sugar Brown' })
        .expect(409); // Conflict
    });
  });

  describe('PATCH /api/v1/admin/inventory/:id', () => {
    it('should update inventory item stock', async () => {
      // Get an inventory item first
      const inventoryResponse = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (inventoryResponse.body.data.length > 0) {
        const itemId = inventoryResponse.body.data[0].id;

        const updateData = {
          currentStock: 75,
          lastRestocked: new Date(),
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/admin/inventory/${itemId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.currentStock).toBe(75);
        expect(response.body).toHaveProperty('lastRestocked');
      }
    });

    it('should track stock movement history', async () => {
      const inventoryResponse = await request(app.getHttpServer())
        .get('/api/v1/admin/inventory?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (inventoryResponse.body.data.length > 0) {
        const itemId = inventoryResponse.body.data[0].id;

        await request(app.getHttpServer())
          .patch(`/api/v1/admin/inventory/${itemId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            currentStock: 100,
            movementReason: 'restock',
            notes: 'Weekly delivery from supplier',
          })
          .expect(200);

        // Check movement history
        const historyResponse = await request(app.getHttpServer())
          .get(`/api/v1/admin/inventory/${itemId}/movements`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(historyResponse.body)).toBe(true);
        if (historyResponse.body.length > 0) {
          const movement = historyResponse.body[0];
          expect(movement).toHaveProperty('type');
          expect(movement).toHaveProperty('quantity');
          expect(movement).toHaveProperty('reason');
          expect(movement).toHaveProperty('timestamp');
        }
      }
    });
  });
});

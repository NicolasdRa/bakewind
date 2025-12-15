import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  OrderType,
  OrderSource,
  OrderStatus,
  OrderPriority,
} from '../../src/orders/dto';

describe('Orders API - PUT /api/v1/orders/:id (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testOrderId: string;

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
  });

  beforeEach(async () => {
    // Create a fresh test order before each test
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderNumber: `TEST-UPDATE-${Date.now()}`,
        orderType: OrderType.CUSTOMER,
        customerName: 'Original Customer',
        customerPhone: '+1234567890',
        source: OrderSource.ONLINE,
        status: OrderStatus.PENDING,
        priority: OrderPriority.NORMAL,
        subtotal: '100.00',
        tax: '10.00',
        total: '110.00',
        notes: 'Original notes',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: '50.00',
          },
        ],
      });

    testOrderId = createResponse.body.id;
  });

  afterEach(async () => {
    // Cleanup after each test
    if (testOrderId) {
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
      testOrderId = '';
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /api/v1/orders/:id', () => {
    it('should update order successfully', async () => {
      const updateDto = {
        customerName: 'Updated Customer Name',
        customerPhone: '+9876543210',
        priority: OrderPriority.HIGH,
        notes: 'Updated notes',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(testOrderId);
      expect(response.body.customerName).toBe(updateDto.customerName);
      expect(response.body.customerPhone).toBe(updateDto.customerPhone);
      expect(response.body.priority).toBe(updateDto.priority);
      expect(response.body.notes).toBe(updateDto.notes);

      // Verify the update persisted
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.customerName).toBe(updateDto.customerName);
    });

    it('should update production fields for internal order', async () => {
      // First create an internal order
      const internalOrderResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderNumber: `INT-${Date.now()}`,
          orderType: OrderType.INTERNAL,
          customerName: 'Production Order',
          source: OrderSource.WHOLESALE,
          status: OrderStatus.SCHEDULED,
          subtotal: '500.00',
          tax: '0.00',
          total: '500.00',
          targetQuantity: 100,
          actualQuantity: 0,
          items: [
            {
              productId: '00000000-0000-0000-0000-000000000001',
              productName: 'Product',
              quantity: 100,
              unitPrice: '5.00',
            },
          ],
        });

      const internalOrderId = internalOrderResponse.body.id;

      const updateDto = {
        actualQuantity: 95,
        wasteQuantity: 5,
        qualityNotes: 'Minor defects on 5 units',
        batchNumber: 'BATCH-002',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${internalOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.actualQuantity).toBe(95);
      expect(response.body.wasteQuantity).toBe(5);
      expect(response.body.qualityNotes).toBe(updateDto.qualityNotes);
      expect(response.body.batchNumber).toBe(updateDto.batchNumber);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${internalOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should update order items', async () => {
      const updateDto = {
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Updated Product 1',
            quantity: 3,
            unitPrice: '40.00',
          },
          {
            productId: '00000000-0000-0000-0000-000000000002',
            productName: 'New Product 2',
            quantity: 5,
            unitPrice: '20.00',
          },
        ],
        subtotal: '220.00',
        tax: '22.00',
        total: '242.00',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].quantity).toBe(3);
      expect(response.body.items[1].productName).toBe('New Product 2');
      expect(response.body.subtotal).toBe('220.00');
      expect(response.body.total).toBe('242.00');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        customerName: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put(`/api/v1/orders/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      const updateDto = {
        customerName: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle partial updates', async () => {
      const updateDto = {
        notes: 'Only updating notes field',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.notes).toBe(updateDto.notes);
      // Other fields should remain unchanged
      expect(response.body.customerName).toBe('Original Customer');
    });

    it('should update pickup and delivery times', async () => {
      const newPickupTime = new Date(Date.now() + 86400000).toISOString();
      const newDeliveryTime = new Date(Date.now() + 172800000).toISOString();

      const updateDto = {
        pickupTime: newPickupTime,
        deliveryTime: newDeliveryTime,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.pickupTime).toBe(newPickupTime);
      expect(response.body.deliveryTime).toBe(newDeliveryTime);
    });

    it('should handle update with special requests', async () => {
      const updateDto = {
        specialRequests: 'New special request: Gluten-free',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.specialRequests).toBe(updateDto.specialRequests);
    });
  });

  describe('PUT /api/v1/orders/:id/status', () => {
    it('should update order status successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(testOrderId);
      expect(response.body.status).toBe(OrderStatus.CONFIRMED);

      // Verify status persisted
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should validate status transitions', async () => {
      // First move to CONFIRMED
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(HttpStatus.OK);

      // Then move to IN_PRODUCTION (valid transition)
      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.IN_PRODUCTION })
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe(OrderStatus.IN_PRODUCTION);
    });

    it('should reject invalid status transitions', async () => {
      // Try to transition from PENDING directly to COMPLETED (invalid)
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.COMPLETED })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should allow transition to CANCELLED from any status', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.CANCELLED })
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe(OrderStatus.CANCELLED);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .put(`/api/v1/orders/${fakeId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid status enum', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});

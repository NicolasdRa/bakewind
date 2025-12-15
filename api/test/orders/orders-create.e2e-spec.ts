import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  OrderType,
  OrderSource,
  OrderStatus,
  OrderPriority,
  PaymentStatus,
} from '../../src/orders/dto';

describe('Orders API - POST /api/v1/orders (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdOrderId: string;

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

  afterAll(async () => {
    // Cleanup: delete created order if it exists
    if (createdOrderId) {
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    await app.close();
  });

  describe('POST /api/v1/orders', () => {
    it('should create a new customer order successfully', async () => {
      const createOrderDto = {
        orderNumber: `TEST-${Date.now()}`,
        orderType: OrderType.CUSTOMER,
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        customerEmail: 'john.doe@example.com',
        source: OrderSource.ONLINE,
        status: OrderStatus.PENDING,
        priority: OrderPriority.NORMAL,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: '100.00',
        tax: '10.00',
        discount: '5.00',
        total: '105.00',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Chocolate Cake',
            quantity: 2,
            unitPrice: '25.00',
          },
          {
            productId: '00000000-0000-0000-0000-000000000002',
            productName: 'Vanilla Cupcakes',
            quantity: 12,
            unitPrice: '2.50',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(HttpStatus.CREATED);

      createdOrderId = response.body.id;

      expect(response.body).toHaveProperty('id');
      expect(response.body.orderNumber).toBe(createOrderDto.orderNumber);
      expect(response.body.customerName).toBe(createOrderDto.customerName);
      expect(response.body.orderType).toBe(OrderType.CUSTOMER);
      expect(response.body.status).toBe(OrderStatus.PENDING);
      expect(response.body.items).toHaveLength(2);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should create an internal production order with production fields', async () => {
      const createOrderDto = {
        orderNumber: `INT-PROD-${Date.now()}`,
        orderType: OrderType.INTERNAL,
        customerName: 'Internal Production',
        source: OrderSource.WHOLESALE,
        status: OrderStatus.SCHEDULED,
        priority: OrderPriority.HIGH,
        paymentStatus: PaymentStatus.PAID,
        subtotal: '500.00',
        tax: '0.00',
        total: '500.00',
        productionDate: new Date().toISOString(),
        batchNumber: 'BATCH-001',
        assignedStaff: 'Jane Smith',
        workstation: 'Station A',
        productionShift: 'morning',
        targetQuantity: 100,
        actualQuantity: 0,
        wasteQuantity: 0,
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000003',
            productName: 'Bread Loaves',
            quantity: 100,
            unitPrice: '5.00',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(HttpStatus.CREATED);

      const internalOrderId = response.body.id;

      expect(response.body.orderType).toBe(OrderType.INTERNAL);
      expect(response.body.batchNumber).toBe('BATCH-001');
      expect(response.body.assignedStaff).toBe('Jane Smith');
      expect(response.body.productionShift).toBe('morning');
      expect(response.body.targetQuantity).toBe(100);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${internalOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 409 for duplicate order number', async () => {
      const createOrderDto = {
        orderNumber: `DUPLICATE-${Date.now()}`,
        orderType: OrderType.CUSTOMER,
        customerName: 'Test Customer',
        source: OrderSource.PHONE,
        subtotal: '50.00',
        tax: '5.00',
        total: '55.00',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: '50.00',
          },
        ],
      };

      // Create first order
      const firstResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(HttpStatus.CREATED);

      const firstOrderId = firstResponse.body.id;

      // Try to create second order with same order number
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(HttpStatus.CONFLICT);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${firstOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 401 for unauthenticated request', async () => {
      const createOrderDto = {
        orderNumber: `TEST-UNAUTH-${Date.now()}`,
        customerName: 'Test',
        source: OrderSource.ONLINE,
        subtotal: '10.00',
        tax: '1.00',
        total: '11.00',
        items: [],
      };

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(createOrderDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid data (missing required fields)', async () => {
      const invalidDto = {
        customerName: 'Test Customer',
        // Missing required fields: orderNumber, source, items, etc.
      };

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid enum values', async () => {
      const invalidDto = {
        orderNumber: `TEST-INVALID-${Date.now()}`,
        customerName: 'Test',
        source: 'invalid_source', // Invalid enum value
        subtotal: '10.00',
        tax: '1.00',
        total: '11.00',
        items: [],
      };

      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle orders with special requests and notes', async () => {
      const createOrderDto = {
        orderNumber: `TEST-SPECIAL-${Date.now()}`,
        orderType: OrderType.CUSTOMER,
        customerName: 'Special Customer',
        source: OrderSource.WALK_IN,
        subtotal: '75.00',
        tax: '7.50',
        total: '82.50',
        specialRequests: 'Gluten-free, extra frosting on the cake',
        notes: 'Customer is a regular, prefers less sugar',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Custom Cake',
            quantity: 1,
            unitPrice: '75.00',
            specialInstructions: 'Write "Happy Birthday" on top',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(HttpStatus.CREATED);

      const specialOrderId = response.body.id;

      expect(response.body.specialRequests).toBe(createOrderDto.specialRequests);
      expect(response.body.notes).toBe(createOrderDto.notes);
      expect(response.body.items[0].specialInstructions).toBe(
        createOrderDto.items[0]?.specialInstructions,
      );

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${specialOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should handle orders with pickup and delivery times', async () => {
      const pickupTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      const deliveryTime = new Date(Date.now() + 172800000).toISOString(); // 2 days from now

      const createOrderDto = {
        orderNumber: `TEST-TIME-${Date.now()}`,
        customerName: 'Test Customer',
        source: OrderSource.ONLINE,
        subtotal: '50.00',
        tax: '5.00',
        total: '55.00',
        pickupTime,
        deliveryTime,
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: '50.00',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(HttpStatus.CREATED);

      const timeOrderId = response.body.id;

      expect(response.body.pickupTime).toBe(pickupTime);
      expect(response.body.deliveryTime).toBe(deliveryTime);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/v1/orders/${timeOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });
});

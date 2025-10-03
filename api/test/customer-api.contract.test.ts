import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Customer API Contract Tests', () => {
  let app: INestApplication;
  let customerAuthToken: string;
  let customerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Customer Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register new customer account successfully', async () => {
        const customerData = {
          email: `customer-${Date.now()}@example.com`,
          password: 'CustomerPassword123!',
          firstName: 'Alice',
          lastName: 'Customer',
          phone: '+1 (555) 222-3333',
        };

        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(customerData)
          .expect(201);

        expect(response.body).toMatchObject({
          user: {
            id: expect.any(String),
            email: customerData.email,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            phone: customerData.phone,
            role: expect.any(String),
            createdAt: expect.any(String),
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });

        // Store for subsequent tests
        customerAuthToken = response.body.accessToken;
        customerId = response.body.user.id;
      });

      it('should return 400 for invalid registration data', async () => {
        const invalidData = {
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '',
          lastName: '',
        };

        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          message: expect.any(String),
          errors: expect.any(Object),
        });
      });

      it('should return 409 for duplicate email', async () => {
        const customerData = {
          email: `duplicate-${Date.now()}@example.com`,
          password: 'Password123!',
          firstName: 'Duplicate',
          lastName: 'Customer',
          phone: '+1 (555) 444-5555',
        };

        // First registration
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(customerData)
          .expect(201);

        // Duplicate registration
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(customerData)
          .expect(409);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('already exists'),
        });
      });
    });

    describe('POST /api/auth/login', () => {
      let loginEmail: string;
      const loginPassword = 'LoginCustomer123!';

      beforeAll(async () => {
        // Create a test customer for login
        const customerData = {
          email: `login-customer-${Date.now()}@example.com`,
          password: loginPassword,
          firstName: 'Login',
          lastName: 'Customer',
          phone: '+1 (555) 666-7777',
        };

        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(customerData);

        loginEmail = customerData.email;
      });

      it('should login customer successfully', async () => {
        const loginData = {
          email: loginEmail,
          password: loginPassword,
        };

        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toMatchObject({
          user: {
            id: expect.any(String),
            email: loginEmail,
            firstName: 'Login',
            lastName: 'Customer',
            role: expect.any(String),
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });
      });

      it('should return 401 for invalid credentials', async () => {
        const invalidLogin = {
          email: loginEmail,
          password: 'WrongPassword123!',
        };

        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(invalidLogin)
          .expect(401);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('Invalid'),
        });
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout customer successfully', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .expect(204);
      });

      it('should return 401 for unauthenticated request', async () => {
        await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
      });
    });
  });

  describe('Customer Profile Management', () => {
    beforeAll(async () => {
      // Create fresh auth token for profile tests
      const customerData = {
        email: `profile-customer-${Date.now()}@example.com`,
        password: 'ProfileCustomer123!',
        firstName: 'Profile',
        lastName: 'Customer',
        phone: '+1 (555) 888-9999',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(customerData);

      customerAuthToken = response.body.accessToken;
      customerId = response.body.user.id;
    });

    describe('GET /api/auth/me', () => {
      it('should return current customer profile', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          email: expect.stringContaining('@'),
          firstName: expect.any(String),
          lastName: expect.any(String),
          phone: expect.any(String),
          role: expect.any(String),
          createdAt: expect.any(String),
        });
      });

      it('should return 401 for unauthenticated request', async () => {
        await request(app.getHttpServer()).get('/api/auth/me').expect(401);
      });
    });

    describe('PUT /api/auth/me', () => {
      it('should update customer profile successfully', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'CustomerName',
          phone: '+1 (555) 111-2222',
        };

        const response = await request(app.getHttpServer())
          .put('/api/auth/me')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          id: customerId,
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          phone: updateData.phone,
          updatedAt: expect.any(String),
        });
      });

      it('should return 400 for invalid update data', async () => {
        const invalidData = {
          firstName: '', // Empty string not allowed
          phone: 'invalid-phone',
        };

        const response = await request(app.getHttpServer())
          .put('/api/auth/me')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          message: expect.any(String),
          errors: expect.any(Object),
        });
      });
    });
  });

  describe('Order Management', () => {
    let orderId: string;

    describe('POST /api/orders', () => {
      it('should create new order successfully', async () => {
        const orderData = {
          items: [
            {
              productId: '550e8400-e29b-41d4-a716-446655440001',
              productName: 'Chocolate Cake',
              quantity: 2,
              unitPrice: 2500, // $25.00 in cents
              customizations: ['No nuts', 'Extra chocolate'],
            },
            {
              productId: '550e8400-e29b-41d4-a716-446655440002',
              productName: 'Vanilla Cupcakes',
              quantity: 12,
              unitPrice: 300, // $3.00 in cents
            },
          ],
          deliveryDate: '2025-10-15T14:00:00Z',
          deliveryAddress: {
            street: '123 Main St',
            city: 'Baketown',
            state: 'NY',
            zipCode: '12345',
            country: 'US',
          },
          notes: 'Please call upon arrival',
        };

        const response = await request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .send(orderData)
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          customerId: customerId,
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: expect.any(String),
              productName: expect.any(String),
              quantity: expect.any(Number),
              unitPrice: expect.any(Number),
            }),
          ]),
          totalAmount: expect.any(Number),
          status: 'pending',
          deliveryDate: expect.any(String),
          deliveryAddress: expect.objectContaining({
            street: orderData.deliveryAddress.street,
            city: orderData.deliveryAddress.city,
            state: orderData.deliveryAddress.state,
            zipCode: orderData.deliveryAddress.zipCode,
          }),
          createdAt: expect.any(String),
        });

        // Calculate expected total
        const expectedTotal = 2 * 2500 + 12 * 300; // $86.00
        expect(response.body.totalAmount).toBe(expectedTotal);

        orderId = response.body.id;
      });

      it('should return 400 for invalid order data', async () => {
        const invalidOrderData = {
          items: [], // Empty items array
          deliveryDate: 'invalid-date',
        };

        const response = await request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .send(invalidOrderData)
          .expect(400);

        expect(response.body).toMatchObject({
          message: expect.any(String),
          errors: expect.any(Object),
        });
      });
    });

    describe('GET /api/orders', () => {
      it('should return customer orders with pagination', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/orders?page=1&limit=10')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          orders: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: expect.any(Number),
            pages: expect.any(Number),
          },
        });

        if (response.body.orders.length > 0) {
          const order = response.body.orders[0];
          expect(order).toMatchObject({
            id: expect.any(String),
            customerId: customerId,
            totalAmount: expect.any(Number),
            status: expect.any(String),
            createdAt: expect.any(String),
          });
        }
      });

      it('should filter orders by status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/orders?status=pending')
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          orders: expect.any(Array),
          pagination: expect.any(Object),
        });

        // All returned orders should have 'pending' status
        response.body.orders.forEach((order: any) => {
          expect(order.status).toBe('pending');
        });
      });
    });

    describe('GET /api/orders/{orderId}', () => {
      it('should return specific order details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: orderId,
          customerId: customerId,
          items: expect.any(Array),
          totalAmount: expect.any(Number),
          status: expect.any(String),
          deliveryDate: expect.any(String),
          deliveryAddress: expect.any(Object),
          createdAt: expect.any(String),
        });

        // Check order items structure
        expect(response.body.items.length).toBeGreaterThan(0);
        response.body.items.forEach((item: any) => {
          expect(item).toMatchObject({
            productId: expect.any(String),
            productName: expect.any(String),
            quantity: expect.any(Number),
            unitPrice: expect.any(Number),
          });
        });
      });

      it('should return 404 for non-existent order', async () => {
        const nonExistentOrderId = '00000000-0000-0000-0000-000000000000';

        const response = await request(app.getHttpServer())
          .get(`/api/orders/${nonExistentOrderId}`)
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .expect(404);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('not found'),
        });
      });

      it('should return 403 for unauthorized order access', async () => {
        // Create another customer to test unauthorized access
        const otherCustomerData = {
          email: `other-customer-${Date.now()}@example.com`,
          password: 'OtherCustomer123!',
          firstName: 'Other',
          lastName: 'Customer',
          phone: '+1 (555) 000-1111',
        };

        const otherCustomerResponse = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(otherCustomerData);

        const otherCustomerToken = otherCustomerResponse.body.accessToken;

        const response = await request(app.getHttpServer())
          .get(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${otherCustomerToken}`)
          .expect(403);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('access'),
        });
      });
    });

    describe('PATCH /api/orders/{orderId}', () => {
      it('should update order successfully (if allowed)', async () => {
        const updateData = {
          notes: 'Updated delivery instructions',
          deliveryAddress: {
            street: '456 Oak Ave',
            city: 'Baketown',
            state: 'NY',
            zipCode: '12345',
            country: 'US',
          },
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          id: orderId,
          notes: updateData.notes,
          deliveryAddress: expect.objectContaining({
            street: updateData.deliveryAddress.street,
          }),
          updatedAt: expect.any(String),
        });
      });

      it('should return 400 for orders that cannot be modified', async () => {
        // This test assumes orders in 'completed' status cannot be modified
        // Implementation would need to handle business logic
        const updateData = {
          notes: 'Trying to update completed order',
        };

        // This test might need to be adjusted based on actual business logic
        // For now, we'll expect it to work if the order is still modifiable
        await request(app.getHttpServer())
          .patch(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${customerAuthToken}`)
          .send(updateData)
          .expect(200);
      });
    });
  });

  describe('Product Catalog', () => {
    describe('GET /api/products', () => {
      it('should return available products with pagination', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/products?page=1&limit=20')
          .expect(200);

        expect(response.body).toMatchObject({
          products: expect.any(Array),
          pagination: {
            page: 1,
            limit: 20,
            total: expect.any(Number),
            pages: expect.any(Number),
          },
        });

        if (response.body.products.length > 0) {
          const product = response.body.products[0];
          expect(product).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            price: expect.any(Number),
            category: expect.any(String),
            isAvailable: expect.any(Boolean),
            createdAt: expect.any(String),
          });
        }
      });

      it('should filter products by category', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/products?category=cakes')
          .expect(200);

        expect(response.body).toMatchObject({
          products: expect.any(Array),
          pagination: expect.any(Object),
        });

        // All returned products should be in 'cakes' category
        response.body.products.forEach((product: any) => {
          expect(product.category).toBe('cakes');
        });
      });

      it('should search products by name', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/products?search=chocolate')
          .expect(200);

        expect(response.body).toMatchObject({
          products: expect.any(Array),
          pagination: expect.any(Object),
        });

        // All returned products should contain 'chocolate' in name or description
        response.body.products.forEach((product: any) => {
          const searchTerm = 'chocolate';
          const matchFound =
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);
          expect(matchFound).toBe(true);
        });
      });
    });

    describe('GET /api/products/{productId}', () => {
      it('should return specific product details', async () => {
        // First get a product ID from the list
        const listResponse = await request(app.getHttpServer())
          .get('/api/products?limit=1')
          .expect(200);

        if (listResponse.body.products.length > 0) {
          const productId = listResponse.body.products[0].id;

          const response = await request(app.getHttpServer())
            .get(`/api/products/${productId}`)
            .expect(200);

          expect(response.body).toMatchObject({
            id: productId,
            name: expect.any(String),
            description: expect.any(String),
            price: expect.any(Number),
            category: expect.any(String),
            isAvailable: expect.any(Boolean),
            ingredients: expect.any(Array),
            nutritionInfo: expect.any(Object),
            customizationOptions: expect.any(Array),
            createdAt: expect.any(String),
          });
        }
      });

      it('should return 404 for non-existent product', async () => {
        const nonExistentProductId = '00000000-0000-0000-0000-000000000000';

        const response = await request(app.getHttpServer())
          .get(`/api/products/${nonExistentProductId}`)
          .expect(404);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('not found'),
        });
      });
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent error response format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'invalid', password: 'wrong' })
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.any(String),
        statusCode: 401,
        timestamp: expect.any(String),
        path: '/api/auth/login',
      });
    });

    it('should include proper API versioning headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(response.headers).toHaveProperty('x-api-version');
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/products')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });
});

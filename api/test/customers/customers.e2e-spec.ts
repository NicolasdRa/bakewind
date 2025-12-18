import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken, TEST_USERS } from '../test-setup';

describe('Customers API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdCustomerId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    // Cleanup: delete test customer if created
    if (createdCustomerId) {
      try {
        await request(app.getHttpServer())
          .delete(`/customers/${createdCustomerId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    await app.close();
  });

  describe('GET /customers', () => {
    it('should return paginated customers list', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.customers)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // All returned customers should be active
      response.body.customers.forEach((customer: any) => {
        expect(customer.status).toBe('active');
      });
    });

    it('should filter by customer type', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?customerType=business')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // All returned customers should be business type
      response.body.customers.forEach((customer: any) => {
        expect(customer.customerType).toBe('business');
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /customers', () => {
    it('should create a new customer with minimal data', async () => {
      const newCustomer = {
        name: 'E2E Test Customer',
        phone: '555-E2E-TEST',
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newCustomer)
        .expect(HttpStatus.CREATED);

      createdCustomerId = response.body.id;

      expect(response.body.name).toBe('E2E Test Customer');
      expect(response.body.phone).toBe('555-E2E-TEST');
      expect(response.body.customerType).toBe('business'); // default
      expect(response.body.status).toBe('active'); // default
      expect(response.body.totalOrders).toBe(0);
      expect(response.body.totalSpent).toBe(0);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should create a business customer with all fields', async () => {
      const businessCustomer = {
        name: 'Business E2E Test',
        email: 'business-e2e@test.com',
        phone: '555-BIZ-TEST',
        addressLine1: '123 E2E Street',
        addressLine2: 'Suite 42',
        city: 'TestCity',
        state: 'TS',
        zipCode: '12345',
        customerType: 'business',
        companyName: 'E2E Corp',
        taxId: '12-3456789',
        preferredContact: 'email',
        marketingOptIn: true,
        notes: 'E2E test customer notes',
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(businessCustomer)
        .expect(HttpStatus.CREATED);

      expect(response.body.name).toBe('Business E2E Test');
      expect(response.body.companyName).toBe('E2E Corp');
      expect(response.body.taxId).toBe('12-3456789');
      expect(response.body.customerType).toBe('business');
      expect(response.body.preferredContact).toBe('email');
      expect(response.body.marketingOptIn).toBe(true);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should create an individual customer', async () => {
      const individualCustomer = {
        name: 'Individual E2E Test',
        phone: '555-IND-TEST',
        customerType: 'individual',
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(individualCustomer)
        .expect(HttpStatus.CREATED);

      expect(response.body.customerType).toBe('individual');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidCustomer = {
        email: 'missing-name@test.com',
        // missing name and phone
      };

      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCustomer)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({ name: 'Test', phone: '555-1234' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /customers/:customerId', () => {
    it('should return customer by ID', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'GetById Test', phone: '555-GET-BY-ID' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      // Then fetch it
      const response = await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(customerId);
      expect(response.body.name).toBe('GetById Test');
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('totalSpent');
      expect(response.body).toHaveProperty('averageOrderValue');
      expect(response.body).toHaveProperty('lastOrderAt');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/customers/${fakeCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/customers/some-id')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /customers/:customerId', () => {
    it('should update customer fields', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Update Test', phone: '555-UPDATE' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      // Update it
      const updateData = {
        name: 'Updated Name',
        email: 'updated@test.com',
        notes: 'Updated notes',
      };

      const response = await request(app.getHttpServer())
        .put(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('updated@test.com');
      expect(response.body.notes).toBe('Updated notes');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should update customer status to inactive', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Status Update Test', phone: '555-STATUS' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      // Update status
      const response = await request(app.getHttpServer())
        .put(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'inactive' })
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('inactive');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .put(`/customers/${fakeCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Should Fail' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .put('/customers/some-id')
        .send({ name: 'Test' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /customers/:customerId', () => {
    it('should delete (or soft-delete) a customer', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Delete Test', phone: '555-DELETE' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      // Delete it
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify it's deleted (should return 404)
      await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/customers/${fakeCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .delete('/customers/some-id')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /customers/:customerId/orders', () => {
    it('should return customer order history', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Orders Test', phone: '555-ORDERS' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      // Get orders (should be empty for new customer)
      const response = await request(app.getHttpServer())
        .get(`/customers/${customerId}/orders`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('summary');
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.summary).toHaveProperty('totalOrders');
      expect(response.body.summary).toHaveProperty('totalSpent');
      expect(response.body.summary).toHaveProperty('averageOrderValue');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should support pagination for orders', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Orders Pagination Test', phone: '555-ORD-PAGE' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/customers/${customerId}/orders?page=1&limit=5`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/customers/${fakeCustomerId}/orders`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /customers/:customerId/analytics', () => {
    it('should return customer analytics', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Analytics Test', phone: '555-ANALYTICS' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/customers/${customerId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('orderFrequency');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('trends');
      expect(response.body.overview).toHaveProperty('totalOrders');
      expect(response.body.overview).toHaveProperty('totalSpent');
      expect(response.body.overview).toHaveProperty('customerLifetimeValue');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should support period parameter', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Analytics Period Test', phone: '555-PERIOD' })
        .expect(HttpStatus.CREATED);

      const customerId = createResponse.body.id;

      await request(app.getHttpServer())
        .get(`/customers/${customerId}/analytics?period=30d`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/customers/${fakeCustomerId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /customers/import', () => {
    it('should import multiple customers', async () => {
      const importData = {
        customers: [
          { name: 'Import Test 1', phone: '555-IMP-001' },
          { name: 'Import Test 2', phone: '555-IMP-002' },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/customers/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(importData)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('imported');
      expect(response.body).toHaveProperty('failed');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.imported).toBe(2);
      expect(response.body.failed).toBe(0);

      // Cleanup: find and delete imported customers
      const listResponse = await request(app.getHttpServer())
        .get('/customers?search=Import%20Test')
        .set('Authorization', `Bearer ${authToken}`);

      for (const customer of listResponse.body.customers) {
        if (customer.name.startsWith('Import Test')) {
          await request(app.getHttpServer())
            .delete(`/customers/${customer.id}`)
            .set('Authorization', `Bearer ${authToken}`);
        }
      }
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/customers/import')
        .send({ customers: [] })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Customer response schema validation', () => {
    it('should return all expected fields in customer response', async () => {
      // Create a business customer with all fields
      const fullCustomer = {
        name: 'Schema Test Customer',
        email: 'schema@test.com',
        phone: '555-SCHEMA',
        addressLine1: '123 Schema St',
        addressLine2: 'Apt 1',
        city: 'SchemaCity',
        state: 'SC',
        zipCode: '99999',
        customerType: 'business',
        companyName: 'Schema Corp',
        taxId: '99-9999999',
        preferredContact: 'phone',
        marketingOptIn: true,
        notes: 'Schema validation test',
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fullCustomer)
        .expect(HttpStatus.CREATED);

      // Validate all required response fields
      const expectedFields = [
        'id',
        'name',
        'email',
        'phone',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'zipCode',
        'customerType',
        'companyName',
        'taxId',
        'preferredContact',
        'marketingOptIn',
        'status',
        'notes',
        'loyaltyPoints',
        'totalOrders',
        'totalSpent',
        'averageOrderValue',
        'lastOrderAt',
        'createdAt',
        'updatedAt',
      ];

      expectedFields.forEach((field) => {
        expect(response.body).toHaveProperty(field);
      });

      // Validate field types
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.name).toBe('string');
      expect(typeof response.body.phone).toBe('string');
      expect(typeof response.body.marketingOptIn).toBe('boolean');
      expect(typeof response.body.loyaltyPoints).toBe('number');
      expect(typeof response.body.totalOrders).toBe('number');
      expect(typeof response.body.totalSpent).toBe('number');
      expect(typeof response.body.averageOrderValue).toBe('number');

      // Validate enum values
      expect(['individual', 'business']).toContain(response.body.customerType);
      expect(['active', 'inactive']).toContain(response.body.status);
      expect(['email', 'phone', 'text', null]).toContain(response.body.preferredContact);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/customers/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });
});

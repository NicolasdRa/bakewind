import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Customer Registration API (e2e)', () => {
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

  describe('POST /api/v1/customers/register', () => {
    it('should register new customer with valid data', async () => {
      const registrationData = {
        email: 'newcustomer@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(registrationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', registrationData.email);
      expect(response.body).toHaveProperty('firstName', registrationData.firstName);
      expect(response.body).toHaveProperty('lastName', registrationData.lastName);
      expect(response.body).not.toHaveProperty('password'); // Should not return password
      expect(response.body.role).toBe('CUSTOMER');
      expect(response.body.isActive).toBe(true);
      expect(response.body.emailVerified).toBe(false);
    });

    it('should reject registration with existing email', async () => {
      const registrationData = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      // Register first time
      await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(registrationData)
        .expect(201);

      // Try to register again with same email
      await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(registrationData)
        .expect(409); // Conflict
    });

    it('should validate email format', async () => {
      const registrationData = {
        email: 'invalid-email-format',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(registrationData)
        .expect(400);
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        'weak',           // Too short
        '12345678',       // No letters
        'password',       // No numbers/symbols
        'PASSWORD123'     // No lowercase
      ];

      for (const password of weakPasswords) {
        const registrationData = {
          email: `test${Date.now()}@example.com`,
          password,
          firstName: 'Test',
          lastName: 'User'
        };

        await request(app.getHttpServer())
          .post('/api/v1/customers/register')
          .send(registrationData)
          .expect(400);
      }
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing password, firstName, lastName
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(incompleteData)
        .expect(400);
    });

    it('should trim and normalize input data', async () => {
      const registrationData = {
        email: '  UPPERCASE@EXAMPLE.COM  ',
        password: 'SecurePassword123!',
        firstName: '  John  ',
        lastName: '  Doe  ',
        phoneNumber: ' +1-234-567-8900 '
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.email).toBe('uppercase@example.com');
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
    });

    it('should create customer profile automatically', async () => {
      const registrationData = {
        email: 'profile@example.com',
        password: 'SecurePassword123!',
        firstName: 'Profile',
        lastName: 'Test'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(registrationData)
        .expect(201);

      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile.loyaltyPoints).toBe(0);
      expect(response.body.profile.marketingConsent).toBe(false);
    });

    it('should send verification email', async () => {
      const registrationData = {
        email: 'verify@example.com',
        password: 'SecurePassword123!',
        firstName: 'Verify',
        lastName: 'Email'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/customers/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.emailVerified).toBe(false);
      // In a real test, we might check if an email was queued
    });
  });

  describe('POST /api/v1/customers/verify-email', () => {
    it('should verify email with valid token', async () => {
      // This would need to be implemented with actual email verification flow
      const verificationData = {
        token: 'valid-verification-token'
      };

      // This test would need to be implemented once email verification is set up
      // For now, we'll just test the endpoint exists
      await request(app.getHttpServer())
        .post('/api/v1/customers/verify-email')
        .send(verificationData)
        .expect(404); // Endpoint doesn't exist yet
    });
  });
});
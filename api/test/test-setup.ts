import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../src/app.module';

/**
 * Creates and configures a NestJS application for E2E testing.
 * Uses Fastify adapter to match production configuration.
 * Applies the same global prefix as the production app.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  // Register cookie support (required by auth controller)
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'test-secret-key',
  });

  // Note: We do NOT set global prefix here because some controllers
  // already have 'api/v1' in their path (inventory, products, order-locks, widgets)
  // while others use just the route name (auth, health, etc.)
  // The production main.ts sets global prefix which affects controllers without api/v1

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

/**
 * Test user credentials for E2E tests.
 * These should match the seeded test data in the database.
 * See: src/database/seeds/users.seed.ts
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@bakewind.com',
    password: 'password123',
  },
  manager: {
    email: 'manager@bakewind.com',
    password: 'password123',
  },
  staff: {
    email: 'staff@bakewind.com',
    password: 'password123',
  },
  viewer: {
    email: 'viewer@bakewind.com',
    password: 'password123',
  },
};

/**
 * Helper function to login and get auth token
 */
export async function getAuthToken(
  app: INestApplication,
  user = TEST_USERS.admin,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const request = require('supertest');
  // Auth controller uses just '/auth' path (global prefix handled separately)
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: user.password });

  if (loginResponse.status !== 200) {
    throw new Error(
      `Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`,
    );
  }

  return loginResponse.body.accessToken;
}

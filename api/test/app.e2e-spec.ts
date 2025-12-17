import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './test-setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) should return welcome message', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', 'Welcome to BakeWind API');
        expect(res.body).toHaveProperty('version', '1.0.0');
        expect(res.body).toHaveProperty('documentation', '/api/v1/docs');
        expect(res.body).toHaveProperty('timestamp');
      });
  });
});

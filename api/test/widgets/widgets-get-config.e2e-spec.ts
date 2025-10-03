import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Widgets API - GET /api/v1/widgets/config (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@bakery.com',
        password: 'password123',
      })
      .expect(HttpStatus.OK);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/widgets/config', () => {
    it('should retrieve widget configuration for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      // Validate response schema matches WidgetConfiguration
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('user_id');
      expect(response.body).toHaveProperty('layout_type');
      expect(response.body).toHaveProperty('widgets');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');

      // Validate layout_type enum
      expect(['grid', 'list', 'masonry']).toContain(response.body.layout_type);

      // Validate widgets array
      expect(Array.isArray(response.body.widgets)).toBe(true);
      expect(response.body.widgets.length).toBeLessThanOrEqual(20);

      if (response.body.widgets.length > 0) {
        const widget = response.body.widgets[0];
        expect(widget).toHaveProperty('id');
        expect(widget).toHaveProperty('type');
        expect(widget).toHaveProperty('position');
        expect(widget.position).toHaveProperty('x');
        expect(widget.position).toHaveProperty('y');
        expect(widget.position).toHaveProperty('w');
        expect(widget.position).toHaveProperty('h');
      }
    });

    it('should return 404 for first-time user with no configuration', async () => {
      // Create a new user and get token
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: `newuser${Date.now()}@bakery.com`,
          password: 'password123',
        })
        .expect(HttpStatus.CREATED);

      const newUserToken = signupResponse.body.access_token;

      await request(app.getHttpServer())
        .get('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/config')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/widgets/config')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});

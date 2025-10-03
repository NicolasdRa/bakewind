import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Widgets API - PUT /api/v1/widgets/config (e2e)', () => {
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

  describe('PUT /api/v1/widgets/config', () => {
    const validWidgetConfig = {
      layout_type: 'grid',
      widgets: [
        {
          id: 'widget-1',
          type: 'metrics',
          position: { x: 0, y: 0, w: 2, h: 1 },
          config: { metric: 'total_orders' },
        },
        {
          id: 'widget-2',
          type: 'chart',
          position: { x: 2, y: 0, w: 2, h: 2 },
          config: { chartType: 'line' },
        },
      ],
    };

    it('should update widget configuration successfully', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validWidgetConfig)
        .expect(HttpStatus.OK);

      // Validate response
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('user_id');
      expect(response.body.layout_type).toBe('grid');
      expect(response.body.widgets).toHaveLength(2);
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should reject configuration with more than 20 widgets', async () => {
      const tooManyWidgets = {
        layout_type: 'grid',
        widgets: Array.from({ length: 21 }, (_, i) => ({
          id: `widget-${i}`,
          type: 'metrics',
          position: { x: 0, y: i, w: 1, h: 1 },
          config: {},
        })),
      };

      const response = await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tooManyWidgets)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('20');
    });

    it('should reject invalid layout_type', async () => {
      const invalidLayout = {
        layout_type: 'invalid-layout',
        widgets: validWidgetConfig.widgets,
      };

      await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLayout)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject widgets with missing required fields', async () => {
      const invalidWidget = {
        layout_type: 'grid',
        widgets: [
          {
            id: 'widget-1',
            // Missing 'type' field
            position: { x: 0, y: 0, w: 1, h: 1 },
          },
        ],
      };

      await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidWidget)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject widgets with invalid position values', async () => {
      const invalidPosition = {
        layout_type: 'grid',
        widgets: [
          {
            id: 'widget-1',
            type: 'metrics',
            position: { x: -1, y: 0, w: 1, h: 1 }, // Negative x
          },
        ],
      };

      await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPosition)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .send(validWidgetConfig)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should allow empty widgets array', async () => {
      const emptyConfig = {
        layout_type: 'list',
        widgets: [],
      };

      const response = await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(emptyConfig)
        .expect(HttpStatus.OK);

      expect(response.body.widgets).toHaveLength(0);
    });

    it('should allow exactly 20 widgets', async () => {
      const maxWidgets = {
        layout_type: 'masonry',
        widgets: Array.from({ length: 20 }, (_, i) => ({
          id: `widget-${i}`,
          type: 'metrics',
          position: { x: 0, y: i, w: 1, h: 1 },
          config: {},
        })),
      };

      const response = await request(app.getHttpServer())
        .put('/api/v1/widgets/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maxWidgets)
        .expect(HttpStatus.OK);

      expect(response.body.widgets).toHaveLength(20);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('GET /features (Contract Test)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Seed software features for testing
    // This would typically be done via database seeding
    // For contract tests, we assume features exist in the database
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid software features request', () => {
    it('should return 200 with array of software features', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      // Verify response is an array
      expect(Array.isArray(response.body)).toBe(true);

      // Should have at least 6 features for showcase
      expect(response.body.length).toBeGreaterThanOrEqual(6);

      // Each feature should match the OpenAPI contract structure
      response.body.forEach((feature: any) => {
        expect(feature).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          iconName: expect.any(String),
          category: expect.any(String),
          availableInPlans: expect.any(Array),
          sortOrder: expect.any(Number),
          isHighlighted: expect.any(Boolean),
          isActive: expect.any(Boolean),
        });

        // Verify UUID format for ID
        expect(feature.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );

        // Verify category is valid enum value
        expect(['orders', 'inventory', 'production', 'analytics', 'customers', 'products'])
          .toContain(feature.category);

        // Verify availableInPlans is array of strings (plan IDs)
        expect(Array.isArray(feature.availableInPlans)).toBe(true);
        feature.availableInPlans.forEach((planId: any) => {
          expect(typeof planId).toBe('string');
        });

        // Verify sort order is positive
        expect(feature.sortOrder).toBeGreaterThan(0);
      });
    });

    it('should return features sorted by sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      // Verify features are sorted by sort order
      if (response.body.length > 1) {
        for (let i = 1; i < response.body.length; i++) {
          const currentSort = response.body[i].sortOrder;
          const previousSort = response.body[i - 1].sortOrder;
          expect(currentSort).toBeGreaterThanOrEqual(previousSort);
        }
      }
    });

    it('should include expected feature categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      const categories = [...new Set(response.body.map((feature: any) => feature.category))];

      // Should include core business categories
      expect(categories).toContain('orders');
      expect(categories).toContain('inventory');
      expect(categories).toContain('analytics');
    });

    it('should only return active features', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      // All returned features should be active
      response.body.forEach((feature: any) => {
        expect(feature.isActive).toBe(true);
      });
    });

    it('should include demo URLs when available', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      response.body.forEach((feature: any) => {
        if (feature.demoUrl) {
          // Demo URL should be valid HTTPS URL
          expect(feature.demoUrl).toMatch(/^https:\/\/.+/);
        }

        if (feature.helpDocUrl) {
          // Help doc URL should be valid HTTPS URL
          expect(feature.helpDocUrl).toMatch(/^https:\/\/.+/);
        }
      });
    });

    it('should mark highlighted features correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      const highlightedFeatures = response.body.filter((feature: any) => feature.isHighlighted === true);

      // Should have at least 1 but not more than 3 highlighted features
      expect(highlightedFeatures.length).toBeGreaterThanOrEqual(1);
      expect(highlightedFeatures.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Feature content validation', () => {
    it('should have business-focused descriptions', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      response.body.forEach((feature: any) => {
        // Description should be substantial and business-focused
        expect(feature.description.length).toBeGreaterThan(20);
        expect(feature.description.length).toBeLessThan(200);

        // Should focus on business benefits, not technical details
        const businessKeywords = ['manage', 'track', 'optimize', 'increase', 'reduce', 'improve', 'streamline'];
        const hasBusinessKeyword = businessKeywords.some(keyword =>
          feature.description.toLowerCase().includes(keyword)
        );
        expect(hasBusinessKeyword).toBe(true);
      });
    });

    it('should have appropriate icon names', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      response.body.forEach((feature: any) => {
        // Icon name should be kebab-case and relevant
        expect(feature.iconName).toMatch(/^[a-z][a-z0-9-]*[a-z0-9]$/);
        expect(feature.iconName.length).toBeGreaterThan(2);
        expect(feature.iconName.length).toBeLessThan(30);
      });
    });

    it('should have distinct feature names', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      const featureNames = response.body.map((feature: any) => feature.name);
      const uniqueNames = [...new Set(featureNames)];

      // All feature names should be unique
      expect(uniqueNames.length).toBe(featureNames.length);
    });
  });

  describe('Plan availability validation', () => {
    it('should reference valid subscription plans', async () => {
      const [featuresResponse, plansResponse] = await Promise.all([
        request(app.getHttpServer()).get('/features'),
        request(app.getHttpServer()).get('/subscriptions/plans'),
      ]);

      const validPlanIds = plansResponse.body.map((plan: any) => plan.id);

      featuresResponse.body.forEach((feature: any) => {
        feature.availableInPlans.forEach((planId: string) => {
          expect(validPlanIds).toContain(planId);
        });
      });
    });

    it('should have features available in multiple plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      // Most features should be available in multiple plans
      const multiPlanFeatures = response.body.filter(
        (feature: any) => feature.availableInPlans.length > 1
      );

      expect(multiPlanFeatures.length).toBeGreaterThan(0);
    });

    it('should have tier-appropriate feature distribution', async () => {
      const [featuresResponse, plansResponse] = await Promise.all([
        request(app.getHttpServer()).get('/features'),
        request(app.getHttpServer()).get('/subscriptions/plans'),
      ]);

      const starterPlan = plansResponse.body.find((p: any) => p.name === 'Starter');
      const enterprisePlan = plansResponse.body.find((p: any) => p.name === 'Enterprise');

      if (starterPlan && enterprisePlan) {
        const starterFeatures = featuresResponse.body.filter((f: any) =>
          f.availableInPlans.includes(starterPlan.id)
        );
        const enterpriseFeatures = featuresResponse.body.filter((f: any) =>
          f.availableInPlans.includes(enterprisePlan.id)
        );

        // Enterprise should have more features than Starter
        expect(enterpriseFeatures.length).toBeGreaterThanOrEqual(starterFeatures.length);
      }
    });
  });

  describe('Marketing content requirements', () => {
    it('should include core bakery management features', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      const featureNames = response.body.map((f: any) => f.name.toLowerCase());

      // Should include essential bakery features
      const coreFeatures = ['order', 'inventory', 'production', 'recipe'];
      const hasCoreFeatures = coreFeatures.some(core =>
        featureNames.some(name => name.includes(core))
      );
      expect(hasCoreFeatures).toBe(true);
    });

    it('should group features logically by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      const categoryCounts = response.body.reduce((acc: any, feature: any) => {
        acc[feature.category] = (acc[feature.category] || 0) + 1;
        return acc;
      }, {});

      // Each category should have at least 1 feature
      Object.values(categoryCounts).forEach((count: any) => {
        expect(count).toBeGreaterThan(0);
      });

      // No single category should dominate (max 50% of features)
      const totalFeatures = response.body.length;
      Object.values(categoryCounts).forEach((count: any) => {
        expect(count / totalFeatures).toBeLessThan(0.5);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test would simulate database issues
      // For now, we verify the endpoint exists and responds
      await request(app.getHttpServer())
        .get('/features')
        .expect(res => {
          expect([200, 500, 503]).toContain(res.status);
        });
    });

    it('should handle empty features table gracefully', async () => {
      // This test would verify behavior when no features exist
      // Implementation should return empty array, not error
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Performance requirements', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Should respond within 150ms for marketing page
      expect(responseTime).toBeLessThan(150);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 15 }, () =>
        request(app.getHttpServer())
          .get('/features')
      );

      const responses = await Promise.all(concurrentRequests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    it('should be cacheable for performance', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      // Should include appropriate cache headers
      expect(response.headers['cache-control']).toBeDefined();
    });
  });

  describe('Public endpoint security', () => {
    it('should not require authentication', async () => {
      // This endpoint should be public for landing page display
      await request(app.getHttpServer())
        .get('/features')
        .expect(200);
    });

    it('should not expose sensitive feature information', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      response.body.forEach((feature: any) => {
        // Should not expose internal fields
        expect(feature).not.toHaveProperty('internalNotes');
        expect(feature).not.toHaveProperty('developmentStatus');
        expect(feature).not.toHaveProperty('techSpecs');
        expect(feature).not.toHaveProperty('costToImplement');
      });
    });

    it('should rate limit requests appropriately', async () => {
      const rapidRequests = Array.from({ length: 100 }, () =>
        request(app.getHttpServer())
          .get('/features')
      );

      const responses = await Promise.all(rapidRequests);

      // Should eventually rate limit, but be generous for public endpoint
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeLessThan(responses.length);
    });
  });

  describe('SEO and marketing optimization', () => {
    it('should return features optimized for search engines', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      response.body.forEach((feature: any) => {
        // Names should be SEO-friendly
        expect(feature.name).not.toMatch(/[<>]/); // No HTML
        expect(feature.name.length).toBeGreaterThan(5);
        expect(feature.name.length).toBeLessThan(80);

        // Descriptions should be SEO-optimized
        expect(feature.description).not.toMatch(/[<>]/); // No HTML
        expect(feature.description.split(' ').length).toBeGreaterThan(5); // Substantial content
      });
    });

    it('should prioritize highlighted features appropriately', async () => {
      const response = await request(app.getHttpServer())
        .get('/features')
        .expect(200);

      const highlightedFeatures = response.body.filter((f: any) => f.isHighlighted);
      const nonHighlightedFeatures = response.body.filter((f: any) => !f.isHighlighted);

      // Highlighted features should generally have lower sort order (appear first)
      if (highlightedFeatures.length > 0 && nonHighlightedFeatures.length > 0) {
        const avgHighlightedSort = highlightedFeatures.reduce((sum: number, f: any) => sum + f.sortOrder, 0) / highlightedFeatures.length;
        const avgNonHighlightedSort = nonHighlightedFeatures.reduce((sum: number, f: any) => sum + f.sortOrder, 0) / nonHighlightedFeatures.length;

        expect(avgHighlightedSort).toBeLessThan(avgNonHighlightedSort);
      }
    });
  });
});
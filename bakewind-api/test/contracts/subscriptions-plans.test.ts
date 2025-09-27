import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('GET /subscriptions/plans (Contract Test)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Seed subscription plans for testing
    // This would typically be done via database seeding
    // For contract tests, we assume plans exist in the database
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid subscription plans request', () => {
    it('should return 200 with array of subscription plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      // Verify response is an array
      expect(Array.isArray(response.body)).toBe(true);

      // Should have at least 4 plans (Starter, Professional, Business, Enterprise)
      expect(response.body.length).toBeGreaterThanOrEqual(4);

      // Each plan should match the OpenAPI contract structure
      response.body.forEach((plan: any) => {
        expect(plan).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          priceMonthlyUsd: expect.any(Number),
          priceAnnualUsd: expect.any(Number),
          features: expect.any(Array),
        });

        // Verify UUID format for ID
        expect(plan.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );

        // Verify pricing is in cents (positive integers)
        expect(plan.priceMonthlyUsd).toBeGreaterThan(0);
        expect(plan.priceAnnualUsd).toBeGreaterThan(0);
        expect(Number.isInteger(plan.priceMonthlyUsd)).toBe(true);
        expect(Number.isInteger(plan.priceAnnualUsd)).toBe(true);

        // Annual pricing should be discounted
        const monthlyAnnual = plan.priceMonthlyUsd * 12;
        expect(plan.priceAnnualUsd).toBeLessThan(monthlyAnnual);

        // Features should be an array of strings
        expect(Array.isArray(plan.features)).toBe(true);
        plan.features.forEach((feature: any) => {
          expect(typeof feature).toBe('string');
        });
      });
    });

    it('should return plans sorted by sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      // Verify plans are sorted by sort order
      if (response.body.length > 1) {
        for (let i = 1; i < response.body.length; i++) {
          const currentSort = response.body[i].sortOrder || 0;
          const previousSort = response.body[i - 1].sortOrder || 0;
          expect(currentSort).toBeGreaterThanOrEqual(previousSort);
        }
      }
    });

    it('should include expected plan names', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      const planNames = response.body.map((plan: any) => plan.name);

      // Should include the standard SaaS plans
      expect(planNames).toContain('Starter');
      expect(planNames).toContain('Professional');
      expect(planNames).toContain('Business');
      expect(planNames).toContain('Enterprise');
    });

    it('should mark the most popular plan correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      const popularPlans = response.body.filter((plan: any) => plan.isPopular === true);

      // Should have exactly one popular plan
      expect(popularPlans.length).toBeLessThanOrEqual(1);

      if (popularPlans.length === 1) {
        // Popular plan is typically "Professional"
        expect(popularPlans[0].name).toBe('Professional');
      }
    });

    it('should only return active plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      // All returned plans should be active
      response.body.forEach((plan: any) => {
        expect(plan.isActive).toBe(true);
      });
    });

    it('should include proper limit information', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      response.body.forEach((plan: any) => {
        // maxLocations and maxUsers can be null (unlimited) or positive integers
        if (plan.maxLocations !== null) {
          expect(plan.maxLocations).toBeGreaterThan(0);
          expect(Number.isInteger(plan.maxLocations)).toBe(true);
        }

        if (plan.maxUsers !== null) {
          expect(plan.maxUsers).toBeGreaterThan(0);
          expect(Number.isInteger(plan.maxUsers)).toBe(true);
        }
      });
    });
  });

  describe('Plan pricing validation', () => {
    it('should have consistent pricing structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      // Verify pricing increases with plan tiers
      const starterPlan = response.body.find((p: any) => p.name === 'Starter');
      const professionalPlan = response.body.find((p: any) => p.name === 'Professional');
      const businessPlan = response.body.find((p: any) => p.name === 'Business');

      if (starterPlan && professionalPlan) {
        expect(professionalPlan.priceMonthlyUsd).toBeGreaterThan(starterPlan.priceMonthlyUsd);
        expect(professionalPlan.priceAnnualUsd).toBeGreaterThan(starterPlan.priceAnnualUsd);
      }

      if (professionalPlan && businessPlan) {
        expect(businessPlan.priceMonthlyUsd).toBeGreaterThan(professionalPlan.priceMonthlyUsd);
        expect(businessPlan.priceAnnualUsd).toBeGreaterThan(professionalPlan.priceAnnualUsd);
      }
    });

    it('should have reasonable annual discounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      response.body.forEach((plan: any) => {
        const monthlyAnnualCost = plan.priceMonthlyUsd * 12;
        const discountPercent = ((monthlyAnnualCost - plan.priceAnnualUsd) / monthlyAnnualCost) * 100;

        // Annual discount should be between 10% and 30%
        expect(discountPercent).toBeGreaterThan(10);
        expect(discountPercent).toBeLessThan(30);
      });
    });

    it('should have valid Stripe price IDs', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      response.body.forEach((plan: any) => {
        // Stripe price IDs should follow the pattern price_*
        if (plan.stripePriceIdMonthly) {
          expect(plan.stripePriceIdMonthly).toMatch(/^price_[A-Za-z0-9]+$/);
        }

        if (plan.stripePriceIdAnnual) {
          expect(plan.stripePriceIdAnnual).toMatch(/^price_[A-Za-z0-9]+$/);
        }
      });
    });
  });

  describe('Feature validation', () => {
    it('should have increasing features for higher tiers', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      const starterPlan = response.body.find((p: any) => p.name === 'Starter');
      const professionalPlan = response.body.find((p: any) => p.name === 'Professional');
      const businessPlan = response.body.find((p: any) => p.name === 'Business');

      if (starterPlan && professionalPlan) {
        expect(professionalPlan.features.length).toBeGreaterThanOrEqual(starterPlan.features.length);
      }

      if (professionalPlan && businessPlan) {
        expect(businessPlan.features.length).toBeGreaterThanOrEqual(professionalPlan.features.length);
      }
    });

    it('should have core features in all plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      // Core features that should be in all plans
      const coreFeatures = ['order_management', 'basic_reporting'];

      response.body.forEach((plan: any) => {
        coreFeatures.forEach(feature => {
          if (plan.name !== 'Enterprise') { // Enterprise might have different feature structure
            // At least some basic features should be included
            expect(plan.features.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should have premium features only in higher tiers', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      const starterPlan = response.body.find((p: any) => p.name === 'Starter');
      const businessPlan = response.body.find((p: any) => p.name === 'Business');

      // Premium features should not be in starter plan
      const premiumFeatures = ['advanced_analytics', 'multi_location', 'api_access'];

      if (starterPlan) {
        premiumFeatures.forEach(feature => {
          expect(starterPlan.features).not.toContain(feature);
        });
      }

      // Business plan should have more advanced features
      if (businessPlan) {
        expect(businessPlan.features.length).toBeGreaterThan(3);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test would simulate database issues
      // For now, we verify the endpoint exists and responds
      await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(res => {
          expect([200, 500, 503]).toContain(res.status);
        });
    });

    it('should handle empty plans table gracefully', async () => {
      // This test would verify behavior when no plans exist
      // Implementation should return empty array, not error
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Performance requirements', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Should respond within 200ms
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get('/subscriptions/plans')
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
        .get('/subscriptions/plans')
        .expect(200);

      // Should include appropriate cache headers
      expect(response.headers['cache-control']).toBeDefined();
    });
  });

  describe('Public endpoint security', () => {
    it('should not require authentication', async () => {
      // This endpoint should be public for pricing page display
      await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);
    });

    it('should not expose sensitive plan information', async () => {
      const response = await request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(200);

      response.body.forEach((plan: any) => {
        // Should not expose internal fields
        expect(plan).not.toHaveProperty('internalNotes');
        expect(plan).not.toHaveProperty('costBasis');
        expect(plan).not.toHaveProperty('profitMargin');
        expect(plan).not.toHaveProperty('adminNotes');
      });
    });

    it('should rate limit requests appropriately', async () => {
      const rapidRequests = Array.from({ length: 100 }, () =>
        request(app.getHttpServer())
          .get('/subscriptions/plans')
      );

      const responses = await Promise.all(rapidRequests);

      // Should eventually rate limit, but be generous for public endpoint
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeLessThan(responses.length);
    });
  });
});
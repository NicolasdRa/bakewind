/**
 * T086: Integration test for pricing page display
 *
 * Tests the pricing page functionality including:
 * - Display of all 4 subscription plans
 * - Feature comparison accuracy
 * - CTA button functionality
 * - Responsive design
 * - Pricing calculations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Pricing Page Display (T086)', () => {
  const baseUrl = process.env.VITE_BASE_URL || 'http://localhost:3000';
  const expectedPlans = ['Starter', 'Professional', 'Business', 'Enterprise'];

  beforeAll(async () => {
    console.log('Testing pricing page at:', `${baseUrl}/pricing`);
  });

  afterAll(async () => {
    // Cleanup after tests
  });

  it('should load pricing page successfully', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toMatch(/<title>.*pricing.*<\/title>/i);
    expect(html).toContain('pricing');
  });

  it('should display all 4 subscription plans', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for all expected plan names
    expectedPlans.forEach(planName => {
      expect(html).toMatch(new RegExp(planName, 'i'));
    });

    // Check for plan structure
    expect(html).toMatch(/plan|tier|package/i);
    expect(html).toMatch(/\$\d+/); // Should contain pricing
    expect(html).toMatch(/month|monthly|year|annual/i);
  });

  it('should show accurate pricing information', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for pricing patterns
    const priceMatches = html.match(/\$\d+(?:\.\d{2})?/g) || [];
    expect(priceMatches.length).toBeGreaterThan(0);

    // Should have different price points
    const uniquePrices = [...new Set(priceMatches)];
    expect(uniquePrices.length).toBeGreaterThan(1);

    // Check for billing period mentions
    expect(html).toMatch(/per month|\/mo|monthly/i);
    expect(html).toMatch(/billed/i);
  });

  it('should display feature comparison accurately', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Expected core features that should be mentioned
    const expectedFeatures = [
      'Order Management',
      'Inventory Tracking',
      'Production Planning',
      'Customer Management',
      'Analytics',
      'Reports',
      'Support'
    ];

    expectedFeatures.forEach(feature => {
      expect(html).toMatch(new RegExp(feature, 'i'));
    });

    // Check for feature availability indicators
    expect(html).toMatch(/included|available|✓|✔|check/i);
    expect(html).toMatch(/not included|unavailable|✗|✘|×/i);
  });

  it('should show trial information prominently', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for trial mentions
    expect(html).toMatch(/free trial|14 days|trial period/i);
    expect(html).toMatch(/no credit card|no payment/i);
    expect(html).toMatch(/start.*trial|try.*free/i);
  });

  it('should have functional CTA buttons for each plan', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for CTA buttons
    const buttonMatches = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
    const linkMatches = html.match(/<a[^>]+class="[^"]*btn[^"]*"[^>]*>/gi) || [];

    const totalCTAs = buttonMatches.length + linkMatches.length;
    expect(totalCTAs).toBeGreaterThanOrEqual(expectedPlans.length);

    // Check for common CTA text
    expect(html).toMatch(/get started|choose plan|select|start trial/i);

    // Check for proper links/actions
    expect(html).toMatch(/href="[^"]*trial[^"]*"|action="[^"]*signup[^"]*"/i);
  });

  it('should support annual/monthly billing toggle', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for billing toggle
    expect(html).toMatch(/monthly.*annual|annual.*monthly/i);
    expect(html).toMatch(/toggle|switch|select/i);
    expect(html).toMatch(/save|discount|off/i);

    // Check for toggle interface elements
    expect(html).toMatch(/type="radio"|type="checkbox"|switch|toggle/i);
  });

  it('should display plan limitations clearly', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for limitation indicators
    expect(html).toMatch(/up to|limit|maximum|users|locations/i);
    expect(html).toMatch(/\d+\s+(users?|locations?|orders?)/i);

    // Check for "unlimited" mentions in higher tiers
    expect(html).toMatch(/unlimited|no limit/i);
  });

  it('should have enterprise contact option', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for enterprise plan specifics
    expect(html).toMatch(/enterprise|custom|contact.*sales/i);
    expect(html).toMatch(/contact.*us|get.*quote|custom.*pricing/i);

    // Should have contact method
    expect(html).toMatch(/mailto:|phone:|contact.*form/i);
  });

  it('should be mobile responsive', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for responsive CSS classes or media queries
    expect(html).toMatch(/responsive|mobile|tablet|desktop/i);
    expect(html).toMatch(/grid|flex|container/i);
    expect(html).toMatch(/class="[^"]*(?:sm:|md:|lg:|xl:)/);

    // Check for viewport meta tag
    expect(html).toMatch(/<meta name="viewport"/i);
  });

  it('should include FAQ or help section', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for FAQ or help content
    expect(html).toMatch(/faq|frequently.*asked|help|questions/i);
    expect(html).toMatch(/what.*if|how.*does|can.*i|when.*will/i);

    // Common pricing FAQ topics
    expect(html).toMatch(/cancel|refund|upgrade|downgrade/i);
  });

  it('should show popular/recommended plan', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for plan highlighting
    expect(html).toMatch(/popular|recommended|most.*popular|best.*value/i);
    expect(html).toMatch(/highlight|featured|badge|ribbon/i);
  });

  it('should link to terms and privacy policy', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for legal links
    expect(html).toMatch(/terms.*service|terms.*use/i);
    expect(html).toMatch(/privacy.*policy/i);
    expect(html).toMatch(/href="[^"]*terms|href="[^"]*privacy/i);
  });

  it('should handle plan comparison interaction', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for comparison functionality
    expect(html).toMatch(/compare|comparison/i);
    expect(html).toMatch(/feature|included|available/i);

    // Check for interactive elements
    expect(html).toMatch(/onclick|click|hover|tab/i);
    expect(html).toMatch(/table|grid|list/i);
  });

  it('should show customer testimonials or social proof', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check for social proof elements
    expect(html).toMatch(/testimonial|review|customer|client/i);
    expect(html).toMatch(/trusted.*by|used.*by|\d+.*businesses/i);

    // Check for quote or review structure
    expect(html).toMatch(/quote|review|rating|stars/i);
  });

  it('should have proper SEO optimization', async () => {
    const response = await fetch(`${baseUrl}/pricing`);
    const html = await response.text();

    // Check SEO elements
    expect(html).toMatch(/<meta name="description" content="[^"]+"/i);
    expect(html).toMatch(/<h1[^>]*>.*pricing.*<\/h1>/i);

    // Check for structured data
    expect(html).toMatch(/<script type="application\/ld\+json">/i);

    // Check for proper heading hierarchy
    expect(html).toMatch(/<h[1-6][^>]*>/gi);
  });

  it('should load within acceptable time limits', async () => {
    const startTime = performance.now();

    const response = await fetch(`${baseUrl}/pricing`);

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    expect(response.status).toBe(200);
    expect(loadTime).toBeLessThan(1000); // Should load within 1 second

    console.log(`Pricing page loaded in ${loadTime.toFixed(2)}ms`);
  });
});
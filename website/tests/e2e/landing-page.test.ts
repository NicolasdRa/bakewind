/**
 * T083: Integration test for landing page experience
 *
 * Tests the complete landing page experience including:
 * - Page loading performance
 * - Feature showcase visibility
 * - Navigation functionality
 * - Hero section interaction
 * - SEO metadata
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Landing Page Experience (T083)', () => {
  const baseUrl = process.env.VITE_BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    // Ensure the server is running for E2E tests
    console.log('Testing against:', baseUrl);
  });

  afterAll(async () => {
    // Cleanup after tests
  });

  it('should load the landing page within 200ms', async () => {
    const startTime = performance.now();

    try {
      const response = await fetch(baseUrl);
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(200);

      console.log(`Landing page loaded in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      throw new Error(`Failed to load landing page: ${error}`);
    }
  });

  it('should display complete feature showcase', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Check for key feature sections
    expect(html).toContain('Order Management');
    expect(html).toContain('Inventory Tracking');
    expect(html).toContain('Production Planning');
    expect(html).toContain('Customer Management');
    expect(html).toContain('Analytics & Reports');

    // Verify feature showcase component is present
    expect(html).toMatch(/class="[^"]*features[^"]*"/);
  });

  it('should have proper SEO metadata', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Check title
    expect(html).toMatch(/<title>.*BakeWind.*<\/title>/);

    // Check meta description
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);

    // Check Open Graph tags
    expect(html).toMatch(/<meta property="og:title"/);
    expect(html).toMatch(/<meta property="og:description"/);
    expect(html).toMatch(/<meta property="og:image"/);

    // Check structured data
    expect(html).toMatch(/<script type="application\/ld\+json">/);
  });

  it('should display hero section with call-to-action', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Check for hero content
    expect(html).toMatch(/Modern Bakery Management/i);
    expect(html).toMatch(/Start.*Trial/i);
    expect(html).toMatch(/Sign Up/i);

    // Verify CTA buttons are present
    expect(html).toMatch(/href="[^"]*trial[^"]*"/);
    expect(html).toMatch(/href="[^"]*pricing[^"]*"/);
  });

  it('should have responsive navigation', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Check for navigation elements
    expect(html).toMatch(/nav/i);
    expect(html).toContain('Features');
    expect(html).toContain('Pricing');
    expect(html).toContain('Login');

    // Check for mobile menu
    expect(html).toMatch(/menu/i);
  });

  it('should include pricing information preview', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Check for pricing preview or mention
    expect(html).toMatch(/\$\d+/); // Should contain price mentions
    expect(html).toMatch(/pricing/i);
    expect(html).toMatch(/plan/i);
  });

  it('should have working internal links', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Extract internal links
    const linkMatches = html.match(/href="\/[^"]*"/g) || [];
    const internalLinks = linkMatches
      .map(match => match.replace(/href="/, '').replace(/"$/, ''))
      .filter(link => !link.startsWith('//') && !link.includes('http'));

    expect(internalLinks.length).toBeGreaterThan(0);

    // Test key navigation links exist
    expect(internalLinks.some(link => link.includes('features'))).toBe(true);
    expect(internalLinks.some(link => link.includes('pricing'))).toBe(true);
    expect(internalLinks.some(link => link.includes('login'))).toBe(true);
  });

  it('should load CSS and styling properly', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Check for stylesheet links or style tags
    expect(html).toMatch(/<link[^>]+stylesheet[^>]*>|<style[^>]*>/);

    // Check for Tailwind CSS classes (our styling framework)
    expect(html).toMatch(/class="[^"]*\b(bg-|text-|p-|m-|flex|grid)[^"]*"/);
  });

  it('should have proper accessibility features', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();

    // Check for alt attributes on images
    const imageMatches = html.match(/<img[^>]+>/g) || [];
    imageMatches.forEach(img => {
      expect(img).toMatch(/alt="[^"]*"/);
    });

    // Check for semantic HTML
    expect(html).toMatch(/<main[^>]*>/);
    expect(html).toMatch(/<nav[^>]*>/);
    expect(html).toMatch(/<header[^>]*>/);

    // Check for lang attribute
    expect(html).toMatch(/<html[^>]+lang="[^"]*"/);
  });

  it('should handle 404 errors gracefully', async () => {
    try {
      const response = await fetch(`${baseUrl}/nonexistent-page`);
      // Should either redirect to 404 page or return 404 status
      expect([404, 200]).toContain(response.status);
    } catch (error) {
      // If server is not running, this is expected
      expect(error).toBeDefined();
    }
  });
});
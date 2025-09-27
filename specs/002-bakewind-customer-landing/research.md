# Research: BakeWind SaaS Landing & Customer Portal

**Date**: 2025-09-27
**Feature**: 002-bakewind-customer-landing

## SaaS Subscription Billing Integration

**Decision**: Stripe for subscription billing and payment processing
**Rationale**:
- Industry-standard solution for SaaS recurring billing
- PCI DSS compliant, reducing security burden
- Supports trials, proration, dunning management
- Excellent webhook system for subscription events
- Well-documented API with TypeScript support

**Alternatives considered**:
- PayPal Subscriptions: More complex integration, less SaaS-focused
- Paddle: Merchant of record model too complex for current needs
- LemonSqueezy: Newer platform with less enterprise features

**Implementation approach**:
- Use Stripe Billing for subscription management
- Stripe Elements for secure payment method collection
- Server-side subscription creation via BakeWind API
- Webhook handling for billing events (payment_failed, trial_ended)
- Customer portal for subscription self-service

## SolidStart SSR Architecture for Marketing Site

**Decision**: Full SSR with selective client hydration for landing pages
**Rationale**:
- Critical SEO performance for organic software discovery
- Faster initial page load for trial conversion optimization
- Better Core Web Vitals scores for search ranking
- Reduced JavaScript bundle size improves mobile experience

**Alternatives considered**:
- CSR only: Poor SEO performance hurts organic acquisition
- Static generation: Can't handle dynamic user state for authenticated subscribers
- Hybrid (SSG + CSR): Too complex for current scope and team size

**Implementation approach**:
- SSR for all public marketing pages (landing, pricing, features)
- Client hydration for interactive forms (trial signup, login)
- Server actions for form submissions and authentication
- Streaming SSR for improved perceived performance

## Landing Page Conversion Optimization

**Decision**: Progressive disclosure with clear CTA hierarchy
**Rationale**:
- Trial signup is primary conversion goal
- Secondary goal is pricing page views
- Must accommodate both prospects and existing subscribers
- Mobile-first design for broader reach

**Alternatives considered**:
- Feature-heavy homepage: Analysis paralysis reduces conversions
- Pricing-first approach: Scares away price-sensitive prospects
- Demo-only approach: Doesn't capture leads without contact info

**Implementation approach**:
- Hero section with clear value proposition and trial CTA
- Feature overview with software benefits, not just functionality
- Social proof section with testimonials and usage stats
- Multiple trial signup entry points throughout the page

## Authentication Strategy for Multi-App Architecture

**Decision**: JWT with httpOnly cookies and seamless dashboard redirect
**Rationale**:
- Secure against XSS attacks with httpOnly storage
- Works well with SSR for authenticated user experiences
- Enables seamless flow from marketing site to admin dashboard
- Standard approach with good ecosystem support

**Alternatives considered**:
- localStorage JWT: XSS vulnerable for marketing site
- Session cookies only: Harder to scale across multiple apps
- OAuth only: Too complex for trial signup flow

**Implementation approach**:
- Login returns JWT tokens with role-based permissions
- HttpOnly refresh tokens for long-term sessions
- Automatic redirect to appropriate dashboard based on subscription status
- Silent refresh before token expiration

## Trial User Onboarding Strategy

**Decision**: Guided setup wizard with sample data injection
**Rationale**:
- Reduces time-to-value for trial users
- Demonstrates software capabilities immediately
- Improves trial-to-paid conversion rates
- Provides data for meaningful feature exploration

**Alternatives considered**:
- Empty state start: High abandonment rates
- Tutorial videos only: Passive experience doesn't engage users
- PDF documentation: Poor UX for software evaluation

**Implementation approach**:
- Multi-step onboarding wizard after trial signup
- Sample bakery data (products, orders, customers) pre-populated
- Interactive tutorials overlay on real software features
- Progress tracking with completion incentives

## Performance Monitoring for Conversion Optimization

**Decision**: Real User Monitoring with conversion funnel tracking
**Rationale**:
- Page load speed directly impacts trial signup rates
- Need data-driven optimization of conversion funnel
- Core Web Vitals affect SEO ranking for organic traffic
- Error tracking prevents conversion blockers

**Alternatives considered**:
- Synthetic monitoring only: Doesn't reflect real user experience
- Basic analytics only: Missing performance correlation with conversions
- No monitoring: Can't optimize without data

**Implementation approach**:
- Core Web Vitals tracking on all marketing pages
- Conversion funnel analysis from landing to trial completion
- Error boundary reporting for form submission failures
- A/B testing framework for CTA optimization

## SEO Strategy for Software Discovery

**Decision**: Technical SEO with software-focused content strategy
**Rationale**:
- Organic search is primary customer acquisition channel
- "Bakery management software" and related terms are target keywords
- Schema.org structured data improves search visibility
- Fast, accessible sites rank higher in search results

**Alternatives considered**:
- Paid advertising only: Too expensive for sustainable growth
- Social media focus: Limited reach for B2B software
- Content marketing only: Need technical foundation first

**Implementation approach**:
- Software application schema.org markup
- Optimized meta tags and OpenGraph for social sharing
- Semantic HTML with proper heading hierarchy
- Fast loading with optimized images and minimal JavaScript

## All Technical Clarifications Resolved

All technology choices have been researched and documented above. The implementation approach balances:
- **Conversion optimization** through performance and UX
- **Scalability** via proven SaaS architecture patterns
- **Security** through industry-standard authentication
- **Maintainability** by extending existing BakeWind infrastructure

No NEEDS CLARIFICATION items remain - implementation can proceed with Phase 1 design.
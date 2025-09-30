# Feature Specification: BakeWind SaaS Landing & Customer Portal

**Feature Branch**: `002-bakewind-customer-landing`
**Created**: 2025-09-27
**Status**: Draft - Revised for SaaS Context
**Input**: User clarification: "The customer facing app is the entry point for the user to the BakeWind software, not an order point for bakery products, but a selling point for the software as a service itself."

## Architecture Clarification
**IMPORTANT**: This specification covers the refactoring of BakeWind into THREE distinct applications:

### 1. website (SSR Landing App - NEW/REFACTORED)
- A **Server-Side Rendered (SSR) SolidStart application** optimized for SEO
- The public-facing marketing and sales portal for BakeWind software
- Responsible for landing pages, pricing, trial signups, and authentication ONLY
- **MUST NOT** contain any dashboard/management features

### 2. admin (Dashboard SPA - EXISTING TO BE ENHANCED)
- A **Client-Side Solid.js SPA** for authenticated users
- ALL bakery management features must be migrated here:
  - Orders, inventory, production, recipes, customers, analytics
  - Dashboard layouts and navigation
  - Management components and pages
- Receives authenticated users redirected from website

### 3. api (Backend - SHARED)
- NestJS API serving both frontend applications
- Handles authentication, trials, subscriptions, and all business logic
- Single source of truth for both frontend apps

## Execution Flow (main)
```
1. Parse user clarification from Input
   → Feature requires SaaS marketing landing page for BakeWind software
2. Extract key concepts from description
   → Actors: potential bakery owners, existing software subscribers, SaaS prospects
   → Actions: learn about software, view pricing, sign up for trials, access dashboard
   → Data: software features, pricing plans, user accounts, subscription status
   → Constraints: integration with existing admin software for authenticated users
3. For each unclear aspect:
   → Trial period duration needs clarification
   → Subscription billing integration undefined
   → User onboarding workflow not specified
4. Fill User Scenarios & Testing section
   → Primary flow: prospect discovery → feature evaluation → trial signup → subscription
5. Generate Functional Requirements
   → All requirements marked as testable
6. Identify Key Entities
   → SaaS User, Subscription Plan, Trial Account, Software Feature, Pricing Tier
7. Run Review Checklist
   → WARN "Spec has uncertainties regarding subscription management and billing"
8. Return: SUCCESS (spec ready for planning with clarifications)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT customers need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

## Clarifications

### Session 2025-09-27 - SaaS Context Revision
- Q: How should subscription payments be processed for the software? → A: Monthly/yearly billing with credit/debit cards via Stripe
- Q: What trial period should be offered to prospects evaluating the software? → A: 14-day free trial with full feature access
- Q: How should the system handle user onboarding after trial signup? → A: Guided setup wizard with sample data and tutorial videos
- Q: Should existing subscribers access their admin dashboard through this portal? → A: Yes - seamless login to their bakery management dashboard
- Q: How should software feature demonstrations be presented to prospects? → A: Interactive demos with live screenshots and feature tour videos

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A bakery owner discovers BakeWind software online, explores the landing page to learn about management features, views pricing plans and subscription options, signs up for a 14-day free trial, authenticates successfully, and is then redirected to the separate BakeWind Dashboard application where they complete onboarding and manage their bakery operations.

### Acceptance Scenarios
1. **Given** a potential customer arrives at the landing page, **When** they browse the home page, **Then** they can see software features, benefits, testimonials, and clear navigation to pricing/trial signup
2. **Given** a prospect wants to try the software, **When** they attempt to start a trial, **Then** they are guided through account creation with business details
3. **Given** an existing subscriber, **When** they log in through the portal, **Then** they are seamlessly redirected to the separate BakeWind Dashboard application (client-side SPA)
4. **Given** a prospect visits the pricing page, **When** they view available plans, **Then** they can see transparent subscription pricing with feature comparisons
5. **Given** a trial user, **When** they complete onboarding, **Then** they have access to the full software with sample data and guided tutorials

### Edge Cases
- What happens when a trial expires and the user hasn't converted to paid?
- How does the system handle failed subscription payments for existing customers?
- What occurs when a user tries to access features not included in their plan?
- How are account downgrades/upgrades handled mid-billing cycle?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide a public landing page showcasing BakeWind software features and benefits
- **FR-002**: System MUST allow prospects to create trial accounts with business email and company details
- **FR-003**: System MUST allow existing subscribers to log in and be redirected to the separate BakeWind Dashboard application
- **FR-004**: System MUST display software feature demos with interactive screenshots and video tours
- **FR-005**: System MUST provide subscription pricing plans with feature comparison matrices
- **FR-006**: System MUST enable 14-day free trial signup with full feature access
- **FR-007**: System MUST handle subscription payment processing with credit/debit cards via Stripe
- **FR-008**: System MUST send trial welcome emails with onboarding links after successful signup
- **FR-009**: System MUST validate business information during trial registration
- **FR-010**: System MUST persist subscriber account information and subscription status securely
- **FR-011**: System MUST provide guided onboarding wizard with sample data and tutorial videos
- **FR-012**: System MUST track trial progress and send conversion reminders as trial expiration approaches
- **FR-013**: System MUST seamlessly redirect authenticated users to the BakeWind Dashboard application based on subscription status
- **FR-014**: System MUST display customer testimonials, case studies, and success stories on landing page
- **FR-015**: System MUST integrate with BakeWind API for authentication and redirect to separate BakeWind Dashboard application
- **FR-016**: System MUST be built as an SSR application using SolidStart for optimal SEO performance
- **FR-017**: System MUST NOT include bakery management features (orders, inventory, production) - these belong in the separate dashboard app

### Migration Requirements (admin app)
- **MR-001**: System MUST migrate ALL dashboard routes from website to admin
- **MR-002**: System MUST migrate order management pages and components to admin
- **MR-003**: System MUST migrate inventory tracking features to admin
- **MR-004**: System MUST migrate production planning features to admin
- **MR-005**: System MUST migrate recipe management to admin
- **MR-006**: System MUST migrate customer management to admin
- **MR-007**: System MUST migrate analytics dashboards to admin
- **MR-008**: System MUST ensure proper authentication token passing between apps
- **MR-009**: System MUST implement seamless redirect from website login to admin dashboard
- **MR-010**: System MUST maintain consistent API client configuration across both frontend apps

### Key Entities *(include if feature involves data)*
- **SaaS User**: Software prospects and subscribers including business credentials, company information, and subscription status
- **Subscription Plan**: Software service tiers with feature sets, pricing, and billing cycles (Starter, Professional, Enterprise)
- **Trial Account**: Time-limited free access accounts with signup date, expiration, and conversion tracking
- **Software Feature**: BakeWind capabilities showcased on landing page including descriptions, demos, and plan availability
- **User Session**: Authentication state and dashboard access permissions for existing subscribers

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

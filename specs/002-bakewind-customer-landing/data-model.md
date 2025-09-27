# Data Model: BakeWind SaaS Landing & Customer Portal

**Date**: 2025-09-27
**Feature**: 002-bakewind-customer-landing

## Entity Definitions

### SaaS User
Represents both prospects and subscribers in the BakeWind software ecosystem.

**Fields**:
- `id` (UUID, primary key) - Unique user identifier
- `email` (string, unique, required) - User email address for authentication
- `password_hash` (string, required) - Bcrypt hashed password
- `first_name` (string, required) - User's first name
- `last_name` (string, required) - User's last name
- `business_name` (string, required) - Name of the bakery/business
- `phone_number` (string, optional) - Contact phone number
- `role` (enum: trial_user, subscriber, admin) - User permission level
- `subscription_status` (enum: trial, active, past_due, canceled) - Current billing status
- `trial_ends_at` (timestamp, nullable) - When trial expires (null for paid users)
- `is_email_verified` (boolean, default: false) - Email verification status
- `created_at` (timestamp) - Account creation date
- `updated_at` (timestamp) - Last modification date
- `last_login_at` (timestamp, nullable) - Last successful login

**Validation Rules**:
- Email must be valid format and unique across system
- Password must be minimum 8 characters with complexity requirements
- Business name required for trial signup
- Phone number must be valid format if provided
- Trial users must have trial_ends_at set
- Subscriber role requires active subscription_status

**State Transitions**:
- trial_user → subscriber (upon successful payment)
- trial_user → canceled (trial expires without payment)
- subscriber → past_due (payment failure)
- past_due → subscriber (payment recovered)
- past_due → canceled (dunning period expires)

### Subscription Plan
Defines the available software service tiers and their attributes.

**Fields**:
- `id` (UUID, primary key) - Unique plan identifier
- `name` (string, required) - Display name (Starter, Professional, Business, Enterprise)
- `description` (text, required) - Plan description for marketing
- `price_monthly_usd` (integer, required) - Price in cents for USD monthly billing
- `price_annual_usd` (integer, required) - Price in cents for USD annual billing
- `max_locations` (integer, nullable) - Maximum bakery locations (null = unlimited)
- `max_users` (integer, nullable) - Maximum user accounts (null = unlimited)
- `features` (JSON array) - List of included feature identifiers
- `stripe_price_id_monthly` (string) - Stripe price ID for monthly billing
- `stripe_price_id_annual` (string) - Stripe price ID for annual billing
- `is_popular` (boolean, default: false) - Display "Most Popular" badge
- `sort_order` (integer, required) - Display order on pricing page
- `is_active` (boolean, default: true) - Available for new signups
- `created_at` (timestamp) - Plan creation date
- `updated_at` (timestamp) - Last modification date

**Validation Rules**:
- Name must be unique and non-empty
- Prices must be positive integers (in cents)
- Annual price should be discounted vs monthly
- Stripe price IDs must be valid and active
- Features array must contain valid feature identifiers
- Sort order determines pricing page display sequence

### Trial Account
Tracks trial-specific data and conversion metrics for prospects.

**Fields**:
- `id` (UUID, primary key) - Unique trial identifier
- `user_id` (UUID, foreign key to SaaS User) - Associated user account
- `signup_source` (string) - Marketing attribution (landing_page, pricing_page, etc.)
- `business_size` (enum: 1, 2-3, 4-10, 10+) - Number of bakery locations
- `trial_length_days` (integer, default: 14) - Trial duration
- `onboarding_completed` (boolean, default: false) - Setup wizard completion
- `sample_data_loaded` (boolean, default: false) - Demo data injection status
- `conversion_reminders_sent` (integer, default: 0) - Email reminder count
- `converted_at` (timestamp, nullable) - Date of trial-to-paid conversion
- `converted_to_plan_id` (UUID, nullable) - Which plan they subscribed to
- `cancellation_reason` (string, nullable) - Why trial wasn't converted
- `created_at` (timestamp) - Trial start date
- `updated_at` (timestamp) - Last modification date

**Validation Rules**:
- User ID must reference valid SaaS User with trial_user role
- Signup source required for attribution tracking
- Business size maps to subscription plan recommendations
- Trial length must be positive integer
- Converted trials must have converted_at and converted_to_plan_id

**Lifecycle Events**:
- Created upon trial signup completion
- Onboarding completion triggers sample data loading
- Conversion reminders sent at day 10, 13, and trial end
- Conversion updates user role and subscription status

### Software Feature
Catalog of BakeWind capabilities showcased on the landing page.

**Fields**:
- `id` (UUID, primary key) - Unique feature identifier
- `name` (string, required) - Feature display name
- `description` (text, required) - Marketing description
- `icon_name` (string, required) - Icon identifier for UI display
- `category` (enum: orders, inventory, production, analytics, customers, products) - Feature grouping
- `available_in_plans` (JSON array) - Plan IDs that include this feature
- `demo_url` (string, nullable) - Link to interactive demo
- `help_doc_url` (string, nullable) - Documentation link
- `sort_order` (integer, required) - Display order on landing page
- `is_highlighted` (boolean, default: false) - Featured on hero section
- `is_active` (boolean, default: true) - Show on public pages
- `created_at` (timestamp) - Feature addition date
- `updated_at` (timestamp) - Last modification date

**Validation Rules**:
- Name must be unique and descriptive
- Description should focus on business benefits, not technical details
- Icon name must reference valid icon in design system
- Available in plans array must contain valid plan IDs
- Demo URL must be valid HTTPS if provided

### User Session
Tracks authentication state and dashboard access for security and analytics.

**Fields**:
- `id` (UUID, primary key) - Unique session identifier
- `user_id` (UUID, foreign key to SaaS User) - Associated user
- `access_token_hash` (string, required) - Hashed JWT access token
- `refresh_token_hash` (string, required) - Hashed refresh token
- `expires_at` (timestamp, required) - Session expiration time
- `ip_address` (string, nullable) - Client IP for security tracking
- `user_agent` (text, nullable) - Browser/device information
- `dashboard_redirect_url` (string, nullable) - Post-login destination
- `is_revoked` (boolean, default: false) - Manual session termination
- `created_at` (timestamp) - Session start time
- `last_activity_at` (timestamp) - Most recent API call

**Validation Rules**:
- User ID must reference valid SaaS User
- Token hashes must be cryptographically secure
- Expires at must be future timestamp
- IP address must be valid IPv4/IPv6 format
- Dashboard redirect URL must be valid internal route

**Security Considerations**:
- All tokens stored as salted hashes, never plaintext
- Automatic cleanup of expired sessions
- IP and user agent tracking for anomaly detection
- Revocation support for compromised sessions

## Relationships

### User ↔ Trial Account
- One-to-one: Each trial user has exactly one trial account
- Cascade delete: Removing user removes trial data
- Trial account created automatically on trial signup

### User ↔ Subscription Plan
- Many-to-one: Multiple users can have same plan
- Nullable: Trial users don't have assigned plans yet
- Historical tracking: Plan changes preserved in audit log

### User ↔ User Session
- One-to-many: Users can have multiple active sessions
- Cascade delete: User deletion revokes all sessions
- Automatic cleanup: Expired sessions pruned daily

### Trial Account ↔ Subscription Plan
- Many-to-one via converted_to_plan_id: Tracks conversion outcomes
- Nullable: Unconverted trials have no associated plan
- Analytics: Enables conversion rate analysis by plan

### Software Feature ↔ Subscription Plan
- Many-to-many via available_in_plans JSON array: Features belong to multiple plans
- Required: All plans must include some features
- Marketing: Drives plan comparison matrices

## Database Considerations

### Indexing Strategy
- Primary keys: UUID with B-tree indexes
- Foreign keys: All relationships indexed
- Query optimization: Email, subscription_status, trial_ends_at
- Analytics: created_at, converted_at for time-series queries

### Data Retention
- User data: Retained until explicit deletion request
- Session data: Auto-cleanup after 30 days inactive
- Trial data: Retained for 2 years for analytics
- Audit logs: 7 years retention for compliance

### Migration Strategy
- Extend existing BakeWind user table with SaaS fields
- Add new tables: trial_accounts, subscription_plans, software_features
- Preserve existing user_sessions table structure
- Backfill existing users with appropriate roles and statuses

---
*Data model ready for API contract generation*
# Component Reuse Strategy

## Overview
The BakeWind SaaS Landing & Customer Portal should maximize code reuse from `bakewind-front-solidstart-backup` to ensure design consistency while adapting content for software marketing rather than bakery management. This document outlines exactly what should be copied, adapted, or referenced.

## Complete Files to Copy Directly

### 1. Core Styles
**Copy these files AS-IS:**
- `src/app.css` - Complete design system with CSS variables
- `src/routes/home/home.module.css` - Landing page styles
- `src/routes/pricing/pricing.module.css` - Pricing page styles
- `src/routes/login/login.module.css` - Login page styles

### 2. Shared Components
**Copy entire component folders:**
```
src/components/
├── Logo/                 # BakeWind logo component
├── ThemeToggle/          # Dark/light theme switcher
├── SEO/                  # SEO meta tags component
├── LoginForm/            # Complete login form UI
├── FeatureIcon/          # Feature display icons
├── DashboardPreview/     # Preview cards for features
├── Header/               # Page headers
├── ui/                   # All UI components (buttons, cards, etc.)
└── common/               # Common utilities
```

### 3. Authentication System
**Copy authentication implementation:**
```
src/auth/
├── AuthContext.tsx       # Authentication context provider
└── useAuth.ts           # Authentication hook

src/lib/
├── auth-queries.ts      # Server-side auth queries
├── permissions.ts       # Role-based permissions
└── cookies.ts          # Cookie management
```

### 4. Hooks
**Copy all custom hooks:**
```
src/hooks/
├── useAuthUser.ts       # Current user hook
├── useCurrentUser.ts    # User state management
└── usePreferences.ts    # User preferences
```

## Routes to Adapt

### 1. Landing Page (`/`)
**From:** `src/routes/home/(home).tsx`
**Adaptation needed:**
- Keep navigation structure
- Keep hero section design
- Replace admin dashboard preview with software feature showcase
- Add software benefits and testimonials section
- Add "Start Free Trial" CTAs instead of "Dashboard" links
- Keep theme toggle functionality

### 2. Pricing Page (`/pricing`)
**From:** `src/routes/pricing/(pricing).tsx`
**Adaptation needed:**
- Keep the pricing card design structure
- Replace with SaaS subscription tiers (Starter, Professional, Enterprise)
- Change CTAs to "Start Free Trial" and "Subscribe Now"
- Add feature comparison matrix for plans
- Remove location-specific pricing, focus on global SaaS pricing

### 3. Login Page (`/login`)
**From:** `src/routes/login/(login).tsx`
**Adaptation needed:**
- Keep complete authentication flow
- Keep server-side auth check
- Redirect existing subscribers to their bakery management dashboard
- Keep error handling and loading states
- Add "Start Free Trial" link prominently for new prospects

### 4. Logout (`/logout`)
**From:** `src/routes/logout/(logout).tsx`
**Copy AS-IS** - No changes needed

### 5. Select Location (`/select-location`)
**From:** `src/routes/select-location/(select-location).tsx`
**Adaptation needed:**
- Keep location selector UI
- Adapt to customer context (for ordering)
- Add location availability status
- Show location-specific menus/prices

## New Routes Needed

### Routes that need NEW implementation:
1. `/trial-signup` - Free trial registration with business details (can base on LoginForm)
2. `/features` - Software feature showcase with demos and videos
3. `/testimonials` - Customer success stories and case studies
4. `/demo` - Interactive software demonstration
5. `/onboarding` - Trial user guided setup wizard
6. `/account` - Subscription management and billing

## API Integration to Adapt

### From `src/routes/api/`:
- **auth/login.ts** - Adapt for customer authentication
- **auth/logout.ts** - Can reuse mostly as-is
- **auth/user.ts** - Adapt for customer user data

## Utilities to Copy

### From `src/utils/`:
- Image optimization utilities
- Date formatting helpers
- Price formatting functions
- Validation utilities

## State Management

### From `src/stores/`:
- Adapt `appStore.ts` for SaaS portal state
- Remove `bakeryStore.ts` mock data (not needed for marketing site)
- Add new stores:
  - `subscriptionStore.ts` - User subscription status and billing
  - `trialStore.ts` - Trial account progress and expiration
  - `featuresStore.ts` - Software feature showcase and demo state

## Configuration Files

**Copy and adapt:**
- `tailwind.config.js` - Keep all theme configuration
- `postcss.config.js` - Keep as-is
- `tsconfig.json` - Keep TypeScript settings
- `app.config.ts` - Keep SolidStart configuration

## Implementation Priority

### Phase 1: Foundation (Copy directly)
1. Copy `app.css` and all style modules
2. Copy all shared components
3. Copy authentication system
4. Copy configuration files

### Phase 2: Core Pages (Adapt)
1. Adapt landing page for customers
2. Adapt login/logout flows
3. Adapt pricing page
4. Implement registration

### Phase 3: Customer Features (New)
1. Product catalog
2. Shopping cart
3. Checkout flow
4. Order history

## Code Examples

### Reusing LoginForm Component
```tsx
// In customer app's login page
import { LoginForm } from '~/components/LoginForm'
import { loginCustomer } from '~/routes/api/auth/customer-login'

// Use existing LoginForm with customer-specific action
<LoginForm action={loginCustomer} />
```

### Adapting Navigation
```tsx
// From existing nav
<A href="/dashboard" class={styles.dashboardButton}>
  Dashboard
</A>

// Change to
<A href="/orders" class={styles.dashboardButton}>
  My Orders
</A>
```

### Reusing Theme System
```tsx
// Copy entire ThemeToggle usage as-is
import ThemeToggle from '~/components/ThemeToggle/ThemeToggle'

// Works exactly the same in customer app
<ThemeToggle theme={theme()} onToggle={toggleTheme} />
```

## Benefits of This Approach

1. **Consistency**: Exact same look and feel across all BakeWind applications
2. **Speed**: 60-70% of code can be reused directly
3. **Maintainability**: Shared components can be updated in one place
4. **Quality**: Reusing tested, working code reduces bugs
5. **User Experience**: Familiar interface for users who see both apps

## Important Notes

- **DO NOT** change color schemes or design tokens
- **DO NOT** modify the core CSS variables
- **DO** maintain the same file structure for easy updates
- **DO** keep the same naming conventions
- **DO** preserve all accessibility features
- **DO** maintain theme switching functionality

## Migration Checklist

- [ ] Copy all CSS files
- [ ] Copy all shared components
- [ ] Copy authentication system
- [ ] Copy and adapt routes
- [ ] Copy configuration files
- [ ] Test theme switching
- [ ] Verify responsive design
- [ ] Check accessibility features
- [ ] Validate consistent styling
- [ ] Test authentication flow
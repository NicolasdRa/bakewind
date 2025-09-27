# BakeWind SaaS Landing & Customer Portal - Style Guide

## Design System Alignment

The SaaS landing portal MUST inherit and use the exact same warm bakery-themed design system as the existing BakeWind applications. This creates a cohesive brand experience where the warm, artisanal aesthetic reinforces BakeWind's identity as software designed specifically for bakeries by people who understand the industry.

## Core Design Principles

### 1. Warm Bakery Theme
- **Primary Color**: Warm orange/amber (`#f59e0b`) - represents the warmth of freshly baked goods
- **Neutral Palette**: Warm stone tones - creates a cozy, artisanal feeling
- **Accent Colors**: Complementary warm tones that evoke comfort and quality

### 2. Inherited CSS Variables

The customer app must use the SAME CSS variables defined in `app.css`:

#### Color System
```css
/* Primary Brand Colors */
--color-primary-500: #f59e0b;  /* Main brand orange */
--color-primary-600: #d97706;  /* Hover state */
--color-primary-400: #fbbf24;  /* Light variant */
--color-primary-700: #b45309;  /* Dark variant */

/* Neutral Colors (warm stone) */
--color-neutral-50: #fafaf9;   /* Backgrounds */
--color-neutral-100: #f5f5f4;
--color-neutral-800: #292524;  /* Text */
--color-neutral-900: #1c1917;  /* Dark text */
```

#### Typography Scale
```css
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 1.875rem;
--font-size-4xl: 2.25rem;
```

#### Spacing System
```css
--spacing-1: 0.25rem;
--spacing-2: 0.5rem;
--spacing-3: 0.75rem;
--spacing-4: 1rem;
--spacing-6: 1.5rem;
--spacing-8: 2rem;
```

### 3. Component Classes to Reuse

#### Buttons
```css
.btn-base         /* Base button styling */
.btn-primary      /* Orange gradient button */
.btn-secondary    /* Bordered button */
.btn-ghost        /* Text-only button */
.btn-sm/md/lg     /* Size variants */
```

#### Cards
```css
.card-base        /* Standard card */
.card-elevated    /* Card with shadow */
.card-glass       /* Glassmorphism effect */
.card-interactive /* Hover animations */
```

#### Forms
```css
.form-field       /* Field wrapper */
.form-label       /* Label styling */
.form-input       /* Input styling */
.input-base       /* Base input */
```

#### Utility Classes
```css
.shadow-subtle    /* Soft shadows */
.shadow-card      /* Card shadows */
.transition-smooth /* Animations */
.hover-lift       /* Hover effects */
.glass-morphism   /* Glass effect */
```

### 4. Theme Support

The app MUST support both light and dark themes using the same approach:
- Light theme: Default (warm, inviting)
- Dark theme: `[data-theme="dark"]` (cozy evening bakery feel)

## Component-Specific Requirements

### Landing Page Hero
- Use warm gradient background: `linear-gradient(135deg, #f59e0b, #d97706)`
- Large, appetizing product images
- Glass morphism for overlays
- Smooth animations on scroll

### Product Cards
- Use `.card-interactive` class for hover effects
- Display product images prominently
- Price badge with `.badge-primary`
- Hover animation with slight lift

### Navigation
- Sticky nav with glass morphism: `.nav-sticky`
- Warm logo colors
- Smooth transitions between pages
- Mobile-responsive hamburger menu

### Shopping Cart
- Floating cart icon with badge
- Slide-in panel from right
- Glass morphism background
- Smooth add/remove animations

### Checkout Form
- Clean, minimal design
- Clear section separation
- Progress indicator with primary color
- Success states in green (#059669)

### Footer
- Dark background with warm accents
- Social media icons
- Newsletter signup with primary button
- Contact information clearly displayed

## Animation Guidelines

Use the existing animation classes:
```css
--animate-fade-in     /* Page transitions */
--animate-slide-up    /* Card appearances */
--animate-scale-in    /* Modal popups */
--animate-float       /* Floating elements */
```

## Icon Usage

- Use consistent icon library (match existing apps)
- Warm-toned icons where appropriate
- Size consistency: 20px for UI, 24px for navigation

## Image Guidelines

- High-quality bakery product photos
- Warm, appetizing color grading
- Consistent aspect ratios for product grids
- Lazy loading with skeleton screens

## Typography

- Headers: Bold, warm, inviting
- Body text: Clear, readable (system fonts)
- Price displays: Large, prominent
- Success messages: Green with checkmark
- Error messages: Red with clear explanations

## Responsive Design

- Mobile-first approach
- Breakpoints match existing apps:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators using primary color
- Color contrast ratios meet WCAG AA

## DO's and DON'Ts

### DO's
✅ Use warm, inviting colors from the palette
✅ Maintain consistent spacing using CSS variables
✅ Apply smooth transitions and animations
✅ Keep the bakery theme throughout
✅ Use glass morphism for modern feel
✅ Follow existing button and card patterns

### DON'Ts
❌ Don't introduce new color schemes
❌ Don't use cold or tech-focused designs
❌ Don't skip hover states and transitions
❌ Don't use different shadow styles
❌ Don't change typography scales
❌ Don't ignore dark theme support

## Implementation Notes

1. Copy the entire `app.css` from `bakewind-front-solidstart-backup`
2. Use the same Tailwind configuration
3. Import shared component styles
4. Maintain CSS variable naming conventions
5. Test both light and dark themes
6. Ensure animations are smooth and performant

This style guide ensures the customer application feels like a natural extension of the BakeWind brand, maintaining visual consistency while providing an excellent user experience for customers browsing and ordering bakery products.
# Component Patterns Guide

This document defines the component and styling patterns for the BakeWind admin application. Follow these patterns when creating new components or refactoring existing ones.

## Typography Components

Use Typography components instead of raw HTML elements for consistent styling.

### Heading Component

**Location**: `~/components/common/Typography/Heading`

**Usage**: Replace raw `<h1>` - `<h6>` elements

```tsx
import { Heading } from '~/components/common/Typography';

// Variants
<Heading variant="page">Page Title</Heading>        // 1.875rem, bold
<Heading variant="section">Section Title</Heading>  // 1.5rem, semibold (default)
<Heading variant="card">Card Title</Heading>        // 1.125rem, semibold
<Heading variant="label">Label Title</Heading>      // 0.875rem, uppercase

// With semantic level (defaults to h2)
<Heading level="h1" variant="page">Main Title</Heading>
```

### Text Component

**Location**: `~/components/common/Typography/Text`

**Usage**: Replace raw `<p>`, `<span>`, `<label>` elements

```tsx
import { Text } from '~/components/common/Typography';

// Variants
<Text variant="body">Regular body text</Text>        // 1rem (default)
<Text variant="body-sm">Smaller body text</Text>     // 0.875rem
<Text variant="caption">Caption text</Text>          // 0.75rem
<Text variant="label">Form label text</Text>         // 0.875rem, medium weight
<Text variant="helper">Helper/hint text</Text>       // 0.8125rem

// Colors
<Text color="primary">Primary text</Text>            // --text-primary (default)
<Text color="secondary">Secondary text</Text>        // --text-secondary
<Text color="tertiary">Tertiary text</Text>          // --text-tertiary
<Text color="muted">Muted text</Text>                // --text-muted
<Text color="error">Error text</Text>                // --error-color
<Text color="success">Success text</Text>            // --success-color

// Render as different elements
<Text as="p">Paragraph (default)</Text>
<Text as="span">Inline text</Text>
<Text as="label">Form label</Text>

// With custom class
<Text as="span" class={styles.appName}>BakeWind</Text>
```

---

## Button Component

**Location**: `~/components/common/Button`

**Usage**: Replace raw `<button>` elements

```tsx
import Button from '~/components/common/Button';

// Variants
<Button variant="primary">Primary Action</Button>    // Filled primary color
<Button variant="secondary">Secondary</Button>       // Outlined
<Button variant="ghost">Ghost</Button>               // Transparent with hover
<Button variant="text">Text Link</Button>            // Minimal, link-like
<Button variant="subtle">Utility</Button>            // Minimal, muted (for theme toggles, etc.)
<Button variant="success">Success</Button>           // Green
<Button variant="danger">Danger</Button>             // Red

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Loading state
<Button loading>Loading...</Button>

// Mobile icon only (hides text on mobile)
<Button mobileIconOnly>
  <PlusIcon />
  <span class={styles.buttonText}>Add Item</span>
</Button>
```

### Theme Toggle Pattern

```tsx
<Button
  variant="subtle"
  onClick={toggleTheme}
  aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
  title={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
>
  <Show when={isDark()} fallback={<MoonIcon class={styles.themeIcon} />}>
    <SunIcon class={styles.themeIcon} />
  </Show>
  <Text as="span" variant="helper" color="tertiary">
    {isDark() ? 'Light Mode' : 'Dark Mode'}
  </Text>
</Button>
```

---

## Icons

**Location**: `~/components/icons`

All SVG icons should be centralized in the icons folder.

```tsx
import { SunIcon, MoonIcon, WindIcon, PlusIcon } from '~/components/icons';

// Usage with class for sizing
<WindIcon class={styles.logo} />
<SunIcon class={styles.themeIcon} />
```

### Icon Sizing (CSS)

```css
.logo {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-primary);
  flex-shrink: 0;
}

.themeIcon {
  width: 1rem;
  height: 1rem;
}
```

---

## Link Patterns

### Internal Navigation Links

Use `<A>` from `@solidjs/router` with Text component inside:

```tsx
import { A } from '@solidjs/router';
import { Text } from '~/components/common/Typography';

// Primary link
<A href="/trial-signup" class={styles.link}>
  <Text as="span" variant="body-sm">Don't have an account? Start free trial</Text>
</A>

// Secondary link
<A href="/forgot-password" class={styles.linkSecondary}>
  <Text as="span" variant="body-sm" color="secondary">Forgot your password?</Text>
</A>
```

### External Links

Keep raw `<a>` tags for external URLs, but still wrap text:

```tsx
<a href="https://example.com" class={styles.footerLink}>
  <Text as="span" variant="body-sm">Privacy Policy</Text>
</a>
```

### Anchor Links (same page)

```tsx
<a href="#terms" class={styles.inlineLink}>
  <Text as="span">Terms of Service</Text>
</a>
```

---

## CSS Module Conventions

### No Inline Styles

**Bad:**
```tsx
<p style={{ color: "var(--text-secondary)" }}>Text</p>
```

**Good:**
```tsx
<Text color="secondary">Text</Text>
// or
<p class={styles.helperText}>Text</p>
```

### No Tailwind Classes

**Bad:**
```tsx
<div class="space-y-4 p-4 rounded-lg mt-6 text-center text-sm">
```

**Good:**
```tsx
<div class={styles.form}>
```

### CSS File Organization

Structure CSS modules with section headers and media queries at bottom:

```css
/* Component Name - Theme-aware */

/* ==========================================================================
   Base Styles
   ========================================================================== */

.container {
  /* layout styles */
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Error Message */
.error {
  background-color: var(--error-light);
  border: 1px solid var(--error-color);
  color: var(--error-color);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

/* Success Message */
.success {
  background-color: var(--success-light);
  border: 1px solid var(--success-color);
  color: var(--success-color);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

/* Links */
.links {
  margin-top: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.link {
  text-decoration: none;
  color: var(--primary-color);
  transition: color 0.2s;
}

.link:hover {
  color: var(--primary-hover);
}

.linkSecondary {
  text-decoration: none;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.linkSecondary:hover {
  color: var(--text-primary);
}

/* ==========================================================================
   Desktop (768px)
   ========================================================================== */

@media (min-width: 768px) {
  .container {
    /* desktop overrides */
  }
}
```

### CSS Variables

Always use CSS custom properties from the design system:

```css
/* Colors */
color: var(--text-primary);
color: var(--text-secondary);
color: var(--text-tertiary);
color: var(--text-muted);
color: var(--primary-color);
color: var(--error-color);
color: var(--success-color);

/* Backgrounds */
background-color: var(--bg-primary);
background-color: var(--bg-secondary);
background-color: var(--error-light);
background-color: var(--success-light);

/* Borders */
border-color: var(--border-color);
border-color: var(--border-hover);

/* Shadows */
box-shadow: var(--shadow-card);
box-shadow: var(--input-focus-ring);
```

---

## Form Components

### Form Wrapper

**Location**: `~/components/common/Form`

Provides consistent form layout with optional error display.

```tsx
import Form from '~/components/common/Form';

// Basic usage with error handling
<Form onSubmit={handleSubmit} error={error()}>
  <TextField label="Email" ... />
  <TextField label="Password" ... />
  <Button type="submit" fullWidth>Submit</Button>
</Form>

// With gap variants (sm = 0.75rem, md = 1rem, lg = 1.5rem)
<Form onSubmit={handleSubmit} error={error()} gap="lg">
  {/* fields */}
</Form>

// With additional class
<Form onSubmit={handleSubmit} error={error()} class={styles.customForm}>
  {/* fields */}
</Form>
```

### FormMessage Component

**Location**: `~/components/common/FormMessage`

Consolidates error, success, warning, and info messages.

```tsx
import FormMessage from '~/components/common/FormMessage';

// Error message (typically handled by Form component)
<FormMessage variant="error">Something went wrong</FormMessage>

// Success with title
<FormMessage variant="success" title="Check your email!">
  We've sent password reset instructions to your email address.
</FormMessage>

// Warning
<FormMessage variant="warning" title="Action Required">
  Your trial expires in 3 days.
</FormMessage>

// Info
<FormMessage variant="info">
  This action cannot be undone.
</FormMessage>
```

### FormFooter Component

**Location**: `~/components/common/FormFooter`

Standardizes navigation links below forms.

```tsx
import FormFooter from '~/components/common/FormFooter';

// Single link
<FormFooter links={[
  { href: "/login", text: "Already have an account? Sign in" }
]} />

// Multiple links with variants
<FormFooter links={[
  { href: "/trial-signup", text: "Don't have an account? Start free trial" },
  { href: "/forgot-password", text: "Forgot your password?", variant: "secondary" }
]} />

// With back arrow pattern
<FormFooter links={[
  { href: "/login", text: "← Back to Login", variant: "secondary" }
]} />

// External links
<FormFooter links={[
  { href: "https://example.com/help", text: "Get Help", external: true }
]} />
```

### Complete Form Example

```tsx
import Form from '~/components/common/Form';
import FormFooter from '~/components/common/FormFooter';
import FormMessage from '~/components/common/FormMessage';
import TextField from '~/components/common/TextField';
import Button from '~/components/common/Button';

const LoginForm = () => {
  const [error, setError] = createSignal('');

  return (
    <>
      <Form onSubmit={handleSubmit} error={error()}>
        <TextField label="Email" type="email" ... />
        <TextField label="Password" type="password" ... />
        <Button type="submit" variant="primary" size="lg" fullWidth>
          Sign In
        </Button>
      </Form>

      <FormFooter links={[
        { href: "/trial-signup", text: "Don't have an account? Start free trial" },
        { href: "/forgot-password", text: "Forgot your password?", variant: "secondary" }
      ]} />
    </>
  );
};
```

---

## TextField Component

**Location**: `~/components/common/TextField`

Complete form field with label, input, and helper text.

```tsx
import TextField from '~/components/common/TextField';

<TextField
  label="Email Address"
  type="email"
  id="email"
  value={email()}
  onInput={(e) => setEmail(e.currentTarget.value)}
  placeholder="your.email@example.com"
  required
  autocomplete="email"
/>

// With helper text
<TextField
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
  ...
/>
```

---

## Raw Form Labels (when needed)

For custom form layouts, use the CSS module pattern:

```tsx
<label class={styles.label}>
  Email
  <input
    type="email"
    class={styles.input}
    placeholder="Enter your email"
  />
</label>
```

---

## Cleanup Checklist

When refactoring a component:

1. [ ] Replace raw `<h1>`-`<h6>` with `<Heading>`
2. [ ] Replace raw `<p>`, `<span>` with `<Text>`
3. [ ] Replace raw `<button>` with `<Button>`
4. [ ] Replace raw `<form>` with `<Form>` (handles layout + error display)
5. [ ] Replace manual error/success divs with `<FormMessage>`
6. [ ] Replace form link sections with `<FormFooter>`
7. [ ] Wrap link text with `<Text as="span">`
8. [ ] Use `<A>` for internal links (from `@solidjs/router`)
9. [ ] Remove inline styles
10. [ ] Replace Tailwind classes with CSS module classes
11. [ ] Create/update CSS module with proper organization
12. [ ] Remove unused CSS classes (especially .form, .error, .success, .links)
13. [ ] Ensure media queries are grouped at bottom

---

## SolidJS & Architecture Patterns

Patterns are categorized by enforcement level. Not all patterns apply universally.

### RULES (Always Follow)

Non-negotiable standards:

- **CSS Modules only** - no inline styles or Tailwind classes
- **CSS Variables** - use design system tokens (`--text-primary`, `--spacing-2`, etc.)
- **Typography components** - use `Heading`/`Text` for all text content
- **Centralized Icons** - all SVGs in `~/components/Icons`
- **No `any` types** - use proper TypeScript typing

### RECOMMENDATIONS (Default Practice)

Follow unless there's a good reason to deviate:

- **`createStore` for collections** - use for objects/arrays with multiple items
- **Module-level constants** - define static data outside component functions
- **Thin page components** - delegate complex logic to specialized child components
- **No side effects in hooks** - avoid `createEffect` inside reusable hooks

### PATTERNS (Situational)

Apply when the specific conditions are met:

| Pattern | When to Apply |
|---------|---------------|
| `createMemo` | Expensive computations or derived values accessed 2+ times |
| `classList` | **Only** for conditional classes; use `class` for static classes |
| Factory functions | 3+ entities with identical CRUD operations |
| Dedicated stores | State is shared across multiple unrelated components |
| Component extraction | Logic exceeds ~50 lines OR is reused in 2+ places |
| Constants file extraction | Constants are used by multiple files |

### ANTI-PATTERNS (Avoid)

- **Callback registration between stores** - creates hidden dependencies
- **Static data inside components** - recreates on every render
- **`createEffect` inside multi-use hooks** - runs for every component using the hook
- **`classList={{ [styles.foo]: true }}`** - use `class={styles.foo}` for non-conditional classes

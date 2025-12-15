# Badge Component Usage Guide

A reusable, outlined badge component for status indicators, labels, and tags throughout the admin app.

## Import

```tsx
import Badge from "~/components/common/Badge";
import { getCategoryBadgeColor, getProductStatusVariant } from "~/components/common/Badge.config";
```

## Basic Usage

### Using Semantic Variants

```tsx
// Success badge (green)
<Badge variant="success">Active</Badge>

// Error badge (red)
<Badge variant="error">Out of Stock</Badge>

// Warning badge (yellow)
<Badge variant="warning">Low Stock</Badge>

// Info badge (blue)
<Badge variant="info">Pending</Badge>

// Primary badge (amber/brand color)
<Badge variant="primary">Featured</Badge>

// Neutral badge (gray)
<Badge variant="neutral">Inactive</Badge>
```

### Using Custom Colors

For categories or custom color schemes:

```tsx
<Badge color="border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400">
  Custom
</Badge>
```

### With Configuration Helpers

```tsx
import { getCategoryBadgeColor, getProductStatusVariant } from "~/components/common/Badge.config";

// Product category badge
<Badge color={getCategoryBadgeColor(product.category)}>
  {product.category}
</Badge>

// Product status badge
<Badge variant={getProductStatusVariant(product.status)}>
  {product.status}
</Badge>

// Stock status badge
<Badge variant={getStockStatusVariant(stockStatus)}>
  {stockStatusLabel}
</Badge>
```

## Size Variants

```tsx
<Badge size="sm" variant="success">Small</Badge>
<Badge size="md" variant="success">Medium</Badge>  {/* Default */}
<Badge size="lg" variant="success">Large</Badge>
```

## Border Radius

```tsx
<Badge rounded="sm" variant="primary">Slightly rounded</Badge>
<Badge rounded="md" variant="primary">Medium rounded</Badge>
<Badge rounded="lg" variant="primary">Large rounded</Badge>
<Badge rounded="full" variant="primary">Pill</Badge>  {/* Default */}
```

## Complete Examples

### Stock Status in Inventory Table

```tsx
const getStockStatus = (item) => {
  if (item.current_stock === 0) return 'out';
  if (item.low_stock) return 'low';
  return 'good';
};

const getStockStatusLabel = (status) => {
  if (status === 'out') return 'Out of Stock';
  if (status === 'low') return 'Low Stock';
  return 'In Stock';
};

// In component
<Badge variant={getStockStatusVariant(stockStatus)}>
  {getStockStatusLabel(stockStatus)}
</Badge>
```

### Product Category

```tsx
<Badge color={getCategoryBadgeColor(product.category)}>
  {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
</Badge>
```

### Product Status

```tsx
<Badge variant={getProductStatusVariant(product.status)}>
  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
</Badge>
```

### User Role

```tsx
import { getRoleBadgeColor } from "~/components/common/Badge.config";

<Badge color={getRoleBadgeColor(user.role)}>
  {user.role}
</Badge>
```

## Available Color Configurations

The `Badge.config.ts` file provides predefined configurations for:

- **Product Categories**: bread, pastry, cake, cookie, sandwich, beverage, seasonal, custom
- **Product Status**: active, inactive, seasonal, discontinued
- **Stock Status**: out, low, good, critical
- **User Status**: active, inactive, pending, suspended
- **User Roles**: admin, manager, head_baker, baker, cashier, etc.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element` | - | Badge content (required) |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` | `'neutral'` | Semantic color variant |
| `color` | `string` | - | Custom Tailwind classes (overrides variant) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `rounded` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'full'` | Border radius |
| `class` | `string` | - | Additional CSS classes |

## Design Specifications

- **Border**: 1.5px solid
- **Background**: Transparent
- **Border & Text Color**: Matching (uses `currentColor` pattern)
- **Font Weight**: Semibold (600)
- **Transition**: 200ms color transition
- **Dark Mode**: Automatically adapts with lighter border/text colors

## Migration from Inline Badges

### Before

```tsx
<span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
  Error
</span>
```

### After

```tsx
<Badge variant="error">Error</Badge>
```

## Best Practices

1. **Use semantic variants** when possible (`success`, `error`, `warning`, `info`)
2. **Use config helpers** for consistent category/status colors across the app
3. **Keep content short** - badges work best with 1-3 words
4. **Default to pill shape** (`rounded="full"`) for status indicators
5. **Use medium size** for most table badges
6. **Test in dark mode** to ensure proper contrast

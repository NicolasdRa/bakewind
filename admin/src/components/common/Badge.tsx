import { Component, JSX } from "solid-js";

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /**
   * Text content to display in the badge (alternative to children)
   */
  label?: string;

  /**
   * Text content to display in the badge
   */
  children?: JSX.Element;

  /**
   * Visual style variant - uses semantic color tokens
   */
  variant?: BadgeVariant;

  /**
   * Custom color string (for inline styles or simple color names)
   * When a simple color name is passed (e.g., "green", "blue"),
   * it generates appropriate Tailwind classes
   */
  color?: string;

  /**
   * Size of the badge
   * @default 'md'
   */
  size?: BadgeSize;

  /**
   * Border radius style
   * @default 'full' (pill shape)
   */
  rounded?: 'sm' | 'md' | 'lg' | 'full';

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Badge Component
 *
 * A reusable outlined badge/pill component for status indicators, labels, and tags.
 * Uses transparent background with colored border and text.
 *
 * @example
 * ```tsx
 * // Using semantic variants
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error">Out of Stock</Badge>
 *
 * // Using custom colors
 * <Badge color="border-purple-600 text-purple-600">Custom</Badge>
 *
 * // With size and shape
 * <Badge variant="warning" size="sm" rounded="md">Low Stock</Badge>
 * ```
 */
const Badge: Component<BadgeProps> = (props) => {
  const variant = () => props.variant || 'neutral';
  const size = () => props.size || 'md';
  const rounded = () => props.rounded || 'full';

  // Map simple color names to Tailwind classes
  const colorToTailwind: Record<string, string> = {
    green: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
    blue: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
    red: 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400',
    yellow: 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
    orange: 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    purple: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400',
    gray: 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
    amber: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400',
  };

  // Variant to color class mapping
  const getVariantClasses = (): string => {
    if (props.color) {
      // Check if it's a simple color name
      const mapped = colorToTailwind[props.color.toLowerCase()];
      if (mapped) return mapped;
      // Otherwise treat as direct Tailwind classes
      return props.color;
    }

    const variants: Record<BadgeVariant, string> = {
      primary: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400',
      success: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
      warning: 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
      error: 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400',
      info: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
      neutral: 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
    };

    return variants[variant()];
  };

  // Size classes
  const getSizeClasses = (): string => {
    const sizes: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-[0.625rem]',      // 10px font, tight padding
      md: 'px-3 py-1 text-xs',                 // 12px font, standard padding
      lg: 'px-4 py-1.5 text-sm',               // 14px font, generous padding
    };

    return sizes[size()];
  };

  // Border radius classes
  const getRoundedClasses = (): string => {
    const roundedStyles: Record<typeof rounded extends () => infer R ? R : never, string> = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    return roundedStyles[rounded()];
  };

  return (
    <span
      class={`
        inline-flex items-center justify-center
        bg-transparent border-[1.5px]
        font-semibold
        transition-colors duration-200
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${getRoundedClasses()}
        ${props.class || ''}
      `.trim().replace(/\s+/g, ' ')}
    >
      {props.label || props.children}
    </span>
  );
};

export default Badge;

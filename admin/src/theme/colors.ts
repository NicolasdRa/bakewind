/**
 * BakeWind Design System - Color Tokens
 *
 * This file provides TypeScript constants for programmatic access to design system colors.
 * For CSS usage, prefer CSS variables defined in app.css
 *
 * Usage:
 * import { colors, semanticColors } from '@/theme/colors'
 *
 * // Access raw color values
 * const primaryColor = colors.primary[500]
 *
 * // Access semantic tokens (CSS variable references)
 * const successBg = semanticColors.success.light
 */

/**
 * Raw Color Palette
 * Use these for JavaScript/TypeScript logic where you need actual hex values
 */
export const colors = {
  primary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
} as const

/**
 * Semantic Color Variables (CSS Variable References)
 * Use these when you need to reference theme-aware colors that adapt to light/dark mode
 * These return CSS variable references, not actual hex values
 */
export const semanticColors = {
  // Background colors
  bg: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    tertiary: 'var(--bg-tertiary)',
    surface: 'var(--bg-surface)',
    hover: 'var(--bg-hover)',
    active: 'var(--bg-active)',
  },

  // Text colors
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-tertiary)',
    muted: 'var(--text-muted)',
  },

  // Border colors
  border: {
    default: 'var(--border-color)',
    light: 'var(--border-light)',
    hover: 'var(--border-hover)',
  },

  // Primary/Brand colors
  primary: {
    default: 'var(--primary-color)',
    hover: 'var(--primary-hover)',
    light: 'var(--primary-light)',
    dark: 'var(--primary-dark)',
  },

  // Success colors
  success: {
    default: 'var(--success-color)',
    hover: 'var(--success-hover)',
    light: 'var(--success-light)',
    lighter: 'var(--success-lighter)',
    dark: 'var(--success-dark)',
    text: 'var(--success-text)',
  },

  // Warning colors
  warning: {
    default: 'var(--warning-color)',
    hover: 'var(--warning-hover)',
    light: 'var(--warning-light)',
    lighter: 'var(--warning-lighter)',
    dark: 'var(--warning-dark)',
    text: 'var(--warning-text)',
  },

  // Error colors
  error: {
    default: 'var(--error-color)',
    hover: 'var(--error-hover)',
    light: 'var(--error-light)',
    lighter: 'var(--error-lighter)',
    dark: 'var(--error-dark)',
    text: 'var(--error-text)',
  },

  // Info colors
  info: {
    default: 'var(--info-color)',
    hover: 'var(--info-hover)',
    light: 'var(--info-light)',
    lighter: 'var(--info-lighter)',
    dark: 'var(--info-dark)',
    text: 'var(--info-text)',
  },

  // Glass & Effects
  glass: {
    bg: 'var(--glass-bg)',
    border: 'var(--glass-border)',
  },

  overlay: {
    bg: 'var(--overlay-bg)',
  },
} as const

/**
 * Shadow Tokens (CSS Variable References)
 */
export const shadows = {
  sm: 'var(--shadow-sm)',
  base: 'var(--shadow-base)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
  inner: 'var(--shadow-inner)',
  primary: 'var(--shadow-primary)',
  success: 'var(--shadow-success)',
  error: 'var(--shadow-error)',
  card: 'var(--shadow-card)',
} as const

/**
 * Gradient Tokens (CSS Variable References)
 */
export const gradients = {
  primary: 'var(--gradient-primary)',
  success: 'var(--gradient-success)',
  error: 'var(--gradient-error)',
  warning: 'var(--gradient-warning)',
  info: 'var(--gradient-info)',
  primaryRadial: 'var(--gradient-primary-radial)',
  successRadial: 'var(--gradient-success-radial)',
  shimmer: 'var(--gradient-shimmer)',
} as const

/**
 * Type exports for better TypeScript support
 */
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
export type ColorFamily = keyof typeof colors
export type SemanticColorKey = keyof typeof semanticColors

/**
 * Utility function to get a color value
 * @param family - Color family (primary, success, error, etc.)
 * @param shade - Color shade (50-900)
 * @returns Hex color value
 */
export function getColor(family: ColorFamily, shade: ColorShade): string {
  return colors[family][shade]
}

/**
 * Utility function to convert hex to rgba
 * @param hex - Hex color value
 * @param alpha - Alpha value (0-1)
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

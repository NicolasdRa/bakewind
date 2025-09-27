# CLAUDE.md - BakeWind Frontend

## Project Overview

BakeWind Frontend is a SolidStart application for bakery management built with modern web technologies. The project has undergone refactoring and cleanup but still has areas needing consolidation following SolidStart best practices for 2025.

### Technology Stack
- **Framework**: SolidStart 1.1.0 with SolidJS 1.9.5
- **Styling**: Tailwind CSS v4 (using @tailwindcss/vite)
- **Build**: Vinxi 0.5.7
- **Node**: Version 22+ required
- **Package Manager**: npm

## Project Structure

```
src/
├── app.tsx                 # Root application component
├── app.css                 # Global styles
├── entry-client.tsx        # Client entry point
├── auth/                   # Authentication logic
│   ├── AuthContext.tsx     # Auth provider context
│   └── useAuth.ts         # Auth hook
├── components/            # UI components
│   ├── widgets/           # Widget components (15 widgets)
│   ├── ui/                # Reusable UI components
│   ├── Sidebar/           # Navigation sidebar
│   ├── Header/            # Page headers
│   └── ...                # Other components
├── hooks/                 # Custom hooks
│   ├── useAccountMutations.ts
│   ├── useAuth.ts         # Duplicate? Check vs auth/useAuth.ts
│   ├── useCurrentUser.ts
│   └── usePreferences.ts
├── layouts/               # Layout components
│   └── DashboardLayout/   # Main dashboard layout
├── routes/                # File-based routing
│   ├── (dashboard)/       # Dashboard route group
│   │   ├── analytics/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── production/
│   │   ├── products/
│   │   ├── profile/
│   │   ├── recipes/
│   │   └── settings/
│   ├── home/
│   ├── login/
│   ├── logout/
│   ├── pricing/
│   └── select-location/
├── stores/                # Global state management
│   ├── appStore.ts        # Application state
│   └── bakeryStore.ts     # Business logic state
├── types/                 # TypeScript definitions
│   ├── auth.ts
│   ├── bakery.ts
│   └── widget.ts
└── utils/                 # Utility functions
    ├── api.ts
    └── imageOptimization.ts
```

## Areas Needing Cleanup & Consolidation

### 1. Duplicate Authentication Logic
- **Issue**: Two `useAuth` implementations exist:
  - `/src/auth/useAuth.ts`
  - `/src/hooks/useAuth.ts`
- **Action**: Consolidate into single auth module, remove duplication

### 2. CSS Module Usage Inconsistency
- **Current**: Mix of CSS modules and Tailwind classes
- **Recommendation**: Migrate fully to Tailwind v4 for consistency
- **Files with CSS modules**:
  - Components using `.module.css` files (10+ components)
  - Consider migrating to Tailwind-only approach

### 3. Widget Architecture
- **Current**: 15 widget components with inconsistent patterns
- **Recommendation**:
  - Create unified widget interface
  - Implement consistent prop patterns
  - Use BaseWidget component consistently

### 4. Mock Data in Production Code
- **Issue**: `bakeryStore.ts` contains 1000+ lines with extensive mock data
- **Action**:
  - Extract mock data to separate development files
  - Implement proper data fetching from backend API
  - Use environment-based data loading

### 5. Commented Code
- **Location**: `DashboardLayout.tsx` has commented header logic (lines 59-63)
- **Action**: Remove or properly implement conditional header

### 6. TODO Comments
- **Found**: `useAccountMutations.ts` has unimplemented API endpoint
- **Action**: Implement or create tracking issue

### 7. Route Organization
- **Current**: Mix of route patterns (grouped and ungrouped)
- **Recommendation**: Consistent use of route groups for related pages

### 8. Component Organization
- **Issue**: Large number of components without clear categorization
- **Recommendation**:
  ```
  components/
  ├── common/        # Shared UI elements
  ├── features/      # Feature-specific components
  ├── layouts/       # Layout components
  └── widgets/       # Dashboard widgets
  ```

### 9. State Management
- **Current**: Two separate stores (app and bakery)
- **Consider**: Whether stores can be consolidated or better organized

### 10. Missing Features (from package.json name)
- **Issue**: Package name is "example-with-tailwindcss"
- **Action**: Update to proper project name

## Best Practices for SolidStart 2025

### 1. File-Based Routing
- Use route groups `(group)` for shared layouts
- Implement proper layout nesting
- Use `index.tsx` for default routes

### 2. Data Fetching
- Implement proper server functions
- Use `createResource` for async data
- Add proper loading and error states

### 3. Component Patterns
```tsx
// Prefer typed props with explicit interfaces
interface ComponentProps {
  // props
}

// Use consistent naming
export default function ComponentName(props: ComponentProps) {
  // implementation
}
```

### 4. State Management
- Use signals and stores appropriately
- Avoid unnecessary global state
- Implement proper store actions

### 5. Performance
- Lazy load routes and heavy components
- Implement proper code splitting
- Use `Suspense` boundaries effectively

### 6. TypeScript
- Strict mode enabled
- Proper type exports/imports
- Avoid `any` types

## Development Workflow

```bash
# Install dependencies
npm install

# Development
npm run dev          # Start dev server
npm run dev:direct   # Start without DB init

# Build
npm run build        # Production build

# Start production
npm run start        # With DB check
npm run start:direct # Without DB check
```

## Immediate Actions Required

1. **Remove Mock Data**: Extract bakeryStore mock data to separate file
2. **Consolidate Auth**: Merge duplicate auth implementations
3. **Clean Commented Code**: Remove or implement commented sections
4. **Fix Package Name**: Update package.json name field
5. **Implement TODOs**: Address unimplemented API endpoints
6. **Standardize Styling**: Choose between CSS modules or Tailwind-only
7. **Widget Refactor**: Create consistent widget architecture
8. **Route Guards**: Ensure all protected routes use consistent guards
9. **Error Boundaries**: Add proper error boundaries to all routes
10. **Testing Setup**: Add testing infrastructure (currently missing)

## Configuration Files

- `app.config.ts` - Vinxi/SolidStart configuration
- `tailwind.config.js` - Should be created for Tailwind v4
- `tsconfig.json` - TypeScript configuration (verify exists)

## API Integration

Currently missing proper API integration:
- No API client setup
- Mock data hardcoded in stores
- Missing error handling
- No request/response typing

Implement proper API layer:
```tsx
// src/api/client.ts
// src/api/endpoints/
// src/api/types/
```

## Security Considerations

- Implement proper CORS handling
- Add CSRF protection
- Secure authentication tokens
- Validate all user inputs
- Sanitize data before rendering

## Performance Optimizations

1. **Bundle Size**: Analyze and reduce bundle size
2. **Lazy Loading**: Implement for routes and components
3. **Image Optimization**: Use OptimizedImage component consistently
4. **Caching**: Implement proper caching strategies
5. **Code Splitting**: Ensure proper splitting at route level

## Monitoring & Analytics

Currently missing:
- Error tracking
- Performance monitoring
- User analytics
- Business metrics tracking

## Deployment Considerations

- Environment variable management
- Build optimization
- CDN setup for static assets
- Proper logging setup
- Health check endpoints

---

This document should be updated as the codebase evolves to maintain accuracy and usefulness for AI assistants and developers.
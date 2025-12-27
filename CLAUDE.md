# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BakeWind is a complete bakery management SaaS platform with three distinct applications:

### Applications Architecture
1. **api/**: NestJS backend API with PostgreSQL (shared by both frontends)
2. **website/**: SSR SolidStart app for landing pages, marketing, pricing, and authentication
3. **admin/**: Client-side Solid.js SPA for bakery management dashboard (orders, inventory, production, analytics)

**IMPORTANT**: Keep clear separation between customer-facing landing app (website) and dashboard management app (admin). Do NOT mix dashboard features into the SSR customer app.

## Common Development Commands

### Backend API (api/)

```bash
# Development
npm run start:dev        # Start with hot reload
npm run start:debug      # Start with debugging

# Production
npm run build           # Build for production
npm run start:prod      # Run production build

# Database
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Run migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Drizzle Studio
npm run db:seed         # Seed database

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Generate coverage report
npm run test:e2e        # Run e2e tests

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format with Prettier
```

### Customer Landing App (website/)

```bash
# Development
npm run dev             # Start dev server
npm run dev:direct      # Start without DB init

# Production
npm run build           # Build for production
npm run start           # Start production server
```

### Admin Dashboard App (admin/)

```bash
# Development
npm run dev             # Start dev server (port 3001)

# Production
npm run build           # Build for production
npm run preview         # Preview production build
```

## Architecture

### Backend (NestJS) - api/
- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with Passport
- **Port**: 5000
- **Main modules**:
  - `auth/` - Authentication and authorization
  - `users/` - User management
  - `database/` - Database schemas and configuration
  - `products/`, `orders/`, `customers/` - Business domain modules
  - `inventory/`, `production/`, `recipes/` - Production management
  - `analytics/` - Business analytics
  - `health/` - Health checks

### Customer Landing App (website/) - Port 3000
- **Framework**: SolidStart with SSR for SEO optimization
- **Styling**: Tailwind CSS v4
- **Purpose**: Public landing pages, pricing, marketing content (NO authentication)
- **Key directories**:
  - `routes/` - SSR routes for landing, pricing, features
  - `components/` - Marketing UI components (NO dashboard components)
  - `lib/app-urls.ts` - Centralized URLs for linking to admin app

### Admin Dashboard App (admin/) - Port 3001
- **Framework**: Solid.js client-side SPA
- **Router**: @solidjs/router for client-side routing
- **Purpose**: ALL authentication + bakery management features
- **Features**: Login, signup, orders, inventory, production, recipes, analytics
- **Key directories**:
  - `pages/auth/` - Authentication pages (Login, Trial Signup, Register, Forgot Password)
  - `pages/` - Dashboard page components
  - `components/auth/` - Auth UI components (AuthLayout)
  - `stores/authStore.tsx` - Cookie-based auth state management
  - `api/` - API client for backend communication
  - `layouts/` - Layout components

### Database Schema (Backend)
- Located in `api/src/database/schemas/`
- Key schemas: customers, orders, products, inventory, recipes, locations, users
- Relations defined in `relations.ts`
- Using UUID primary keys

## Environment Configuration

### Backend (api/)
Create `.env` file from `.env.example`:
- Database connection (PostgreSQL)
- JWT secrets
- CORS configuration
- Rate limiting settings

### Website (website/)
Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_ADMIN_APP_URL=http://localhost:3001
```

### Admin (admin/)
Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_CUSTOMER_APP_URL=http://localhost:3000
```

## Important Notes

### Application Routing Pattern
- **website/**: SSR routes for public pages (landing, pricing, features)
- **admin/**: Client-side routing for ALL authentication + management features
- No reverse proxy needed - apps run on separate ports in development

### Database Operations
- Backend API uses PostgreSQL with connection string from `DATABASE_URL`
- Website: No local database, all data from API
- Admin: No local database, uses localStorage for tokens
- Backend uses Drizzle ORM for all database operations

### Authentication Flow (Admin-Centric)
1. User visits marketing website (SSR app at localhost:3000) - NO auth state
2. User clicks "Sign In" or "Start Trial" → Redirects to admin app auth pages
3. User logs in on admin app (localhost:3001/login)
4. Backend API validates and sets httpOnly cookies (access + refresh tokens)
5. Admin app redirects to /dashboard/overview
6. All authenticated requests use httpOnly cookies automatically
7. Website remains completely stateless - pure marketing content

**Important**: All authentication (login, signup, password reset) happens in the admin app.
The marketing website has NO auth pages - it only links to admin auth routes.

### Port Configuration (Development)
- **api**: localhost:5000
- **website**: localhost:3000
- **admin**: localhost:3001

**No reverse proxy required** - Each app runs independently on its own port.
User navigates between apps via direct links (e.g., website links to `http://localhost:3001/login`).

### Testing
- Backend: Jest for unit/e2e tests
- Run tests before committing major changes

### Build Requirements
- Node.js >= 22 (required for SolidStart)
- PostgreSQL for backend API
- No local database for website/admin apps (API only)
- Separate build processes for each application

## API Testing

### Postman Collection
A complete Postman collection is available for testing all API endpoints:
- **Location**: `api/postman/bakewind-api.postman_collection.json`
- **Documentation**: `docs/postman-collection.md`
- **Import**: Open Postman → Import → Select the collection file

The collection includes all endpoints organized by module:
- Authentication (Login, Signup, Refresh, Logout)
- Inventory (CRUD + Consumption Tracking)
- Users, Locations, Customers
- Trials, Subscriptions
- Health Checks

**Important**: When updating or adding API endpoints, remember to update the Postman collection and documentation.

See `docs/postman-collection.md` for detailed usage instructions.

## Folder Structure
```
bakewind/
├── api/           # Backend NestJS API (port 5000)
│   ├── postman/   # Postman collection for API testing
│   └── src/       # API source code
├── website/       # Customer landing SolidStart app (port 3000)
├── admin/         # Admin dashboard Solid.js SPA (port 3001)
├── docs/          # Project documentation
│   └── postman-collection.md  # Postman collection guide
├── specs/         # Feature specifications
└── CLAUDE.md      # This file
```

## CSS Styling Preferences

### Media Query Organization
Group all media queries at the bottom of CSS module files, organized by breakpoint:

```css
/* Base styles first */
.element { ... }

/* Tablet and up (640px) */
@media (min-width: 640px) {
  .element { ... }
}

/* Desktop (768px) */
@media (min-width: 768px) {
  .element { ... }
}
```

### Icons
- All SVG icons should be abstracted into `admin/src/components/icons/index.tsx`
- Use the centralized icon components instead of inline SVGs
- App logo uses `WindIcon` component

### Typography
Use the Typography components instead of raw `<h1>`-`<h6>` and `<p>` elements:

```tsx
import { Heading, Text } from '~/components/common/Typography'

// Headings - use variant to control visual style, level for semantic HTML
<Heading variant="page">Page Title</Heading>        // 1.875rem
<Heading variant="section">Section Title</Heading>  // 1.5rem (default)
<Heading variant="card">Card Title</Heading>        // 1.125rem
<Heading variant="label">Label Title</Heading>      // 0.875rem uppercase

// Text - use variant for size, color for theme-aware colors
<Text>Default body text</Text>
<Text variant="body-sm" color="secondary">Smaller secondary text</Text>
<Text variant="caption" color="muted">Small muted caption</Text>
<Text as="span">Inline text</Text>
```

Available text colors: `primary`, `secondary`, `tertiary`, `muted`, `error`, `success`

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- always re-use available components before implementing a new one
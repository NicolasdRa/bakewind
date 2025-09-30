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
- **Purpose**: Public landing pages, pricing, trial signups, authentication
- **Key directories**:
  - `routes/` - SSR routes for landing, pricing, features, login
  - `components/` - Marketing UI components (NO dashboard components)
  - `stores/` - Authentication state management

### Admin Dashboard App (admin/) - Port 3001
- **Framework**: Solid.js client-side SPA
- **Router**: @solidjs/router for client-side routing
- **Purpose**: Authenticated bakery management features
- **Features**: Orders, inventory, production, recipes, analytics
- **Key directories**:
  - `pages/` - Dashboard page components
  - `components/` - Reusable UI components
  - `stores/` - Auth store and state management
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
- **website/**: SSR routes for public pages (landing, pricing, features, login)
- **admin/**: Client-side routing for authenticated management features
- Authentication in website redirects to admin after successful login

### Database Operations
- Backend API uses PostgreSQL with connection string from `DATABASE_URL`
- Website: No local database, all data from API
- Admin: No local database, uses localStorage for tokens
- Backend uses Drizzle ORM for all database operations

### Authentication Flow
1. User logs in via website (SSR app at localhost:3000)
2. Backend API validates and returns JWT tokens (access + refresh)
3. Website redirects to admin (SPA at localhost:3001) with tokens in URL params
4. Admin extracts tokens, stores in localStorage, cleans URL
5. Admin uses JWT for authenticated API requests
6. No dashboard routes in website - clean separation

### Port Configuration
- **api**: localhost:5000
- **website**: localhost:3000
- **admin**: localhost:3001

### Testing
- Backend: Jest for unit/e2e tests
- Run tests before committing major changes

### Build Requirements
- Node.js >= 22 (required for SolidStart)
- PostgreSQL for backend API
- No local database for website/admin apps (API only)
- Separate build processes for each application

## Folder Structure
```
bakewind/
├── api/           # Backend NestJS API (port 5000)
├── website/       # Customer landing SolidStart app (port 3000)
├── admin/         # Admin dashboard Solid.js SPA (port 3001)
├── specs/         # Feature specifications
└── CLAUDE.md      # This file
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
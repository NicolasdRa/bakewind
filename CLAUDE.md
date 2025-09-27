# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BakeWind is a bakery management system consisting of:
- **Backend**: NestJS API with PostgreSQL database using Drizzle ORM
- **Frontend**: SolidStart application with Tailwind CSS

## Common Development Commands

### Backend (bakewind-backend/)

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

### Frontend (bakewind-frontend/)

```bash
# Development
npm run dev             # Initialize DB and start dev server
npm run dev:direct      # Start without DB init

# Production
npm run build           # Build for production
npm run start           # Ensure DB and start server
npm run start:direct    # Start without DB check

# Database
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Run migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Drizzle Studio
npm run db:init         # Initialize dev database
npm run db:init:seed    # Initialize with seed data
npm run db:reset        # Force reset database
```

## Architecture

### Backend (NestJS)
- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with Passport
- **Main modules**:
  - `auth/` - Authentication and authorization
  - `users/` - User management
  - `database/` - Database schemas and configuration
  - `products/`, `orders/`, `customers/` - Business domain modules
  - `inventory/`, `production/`, `recipes/` - Production management
  - `analytics/` - Business analytics
  - `health/` - Health checks

### Frontend (SolidStart)
- **Framework**: SolidStart with file-based routing
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Drizzle ORM (local data)
- **State Management**: Custom stores in `stores/`
- **Routing**: File-based with route groups for dashboard layout
- **Key directories**:
  - `routes/(dashboard)/` - Dashboard routes with shared layout
  - `components/` - Reusable UI components
  - `lib/` - Utilities and helpers
  - `queries/` - Data fetching hooks
  - `auth/` - Authentication context

### Database Schema (Backend)
- Located in `bakewind-backend/src/database/schemas/`
- Key schemas: customers, orders, products, inventory, recipes, locations, users
- Relations defined in `relations.ts`
- Using UUID primary keys

## Environment Configuration

### Backend
Create `.env` file from `.env.example`:
- Database connection (PostgreSQL)
- JWT secrets
- CORS configuration
- Rate limiting settings

### Frontend
- SQLite database at `drizzle/db.sqlite`
- Configuration in `app.config.ts` and `drizzle.config.ts`

## Important Notes

### Frontend Routing Pattern
The frontend uses SolidStart's route group pattern with `(dashboard)` for shared layouts. The DashboardLayout persists across route changes for better performance.

### Database Operations
- Backend uses PostgreSQL with connection string from `DATABASE_URL`
- Frontend uses local SQLite for client-side data
- Both use Drizzle ORM with similar patterns

### Authentication Flow
- Backend provides JWT-based authentication
- Frontend manages auth state via AuthContext
- Protected routes handled by route guards

### Testing
- Backend: Jest for unit/e2e tests
- Run tests before committing major changes

### Build Requirements
- Node.js >= 22 (frontend requirement)
- PostgreSQL for backend
- SQLite for frontend local data

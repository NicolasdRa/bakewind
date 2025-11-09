# Multi-Tenancy Analysis for BakeWind SaaS

**Document Version**: 1.0
**Date**: 2025-11-09
**Status**: Critical Assessment

---

## Executive Summary

**Current State**: BakeWind is currently a **single-tenant, multi-user** application designed for one bakery business with multiple employees. It **lacks any multi-tenancy implementation** and would have **critical security vulnerabilities** if deployed as a SaaS platform.

**Risk Level**: 🔴 **CRITICAL** - Current implementation would allow data leakage between different bakery customers.

**Safe Deployment**:
- ✅ Single bakery instance (one deployment per customer)
- ❌ Multi-tenant SaaS (multiple customers on shared platform)

---

## Table of Contents

1. [Architecture Analysis](#1-architecture-analysis)
2. [Security Vulnerabilities](#2-security-vulnerabilities)
3. [Implementation Plan](#3-implementation-plan)
4. [Recommended Architecture Pattern](#4-recommended-architecture-pattern)
5. [Migration Effort Estimate](#5-migration-effort-estimate)
6. [Immediate Next Steps](#6-immediate-next-steps)

---

## 1. Architecture Analysis

### 1.1 Current Design Pattern

BakeWind is designed as a **single-tenant, multi-user** system:

- **Model**: Single bakery with role-based access (ADMIN, MANAGER, BAKER, VIEWER)
- **User Association**: Each user has a `businessName` string field (not a foreign key)
- **Data Scope**: All queries are global - no tenant filtering exists
- **Security**: Authentication only, no tenant-based authorization

**This works for**: One bakery per deployment
**This fails for**: Multiple bakeries sharing the same database/deployment

### 1.2 Missing Components for SaaS Multi-Tenancy

#### A. Organization/Tenant Table

**Status**: ❌ **Does not exist**

**Current Implementation**:
- `api/src/database/schemas/users.schema.ts:70` - `businessName` is a plain string
- `api/src/database/schemas/saas-users.ts:32-34` - `companyName` duplicated per user
- No central organization entity

**Required Schema**:
```typescript
// api/src/database/schemas/organizations.schema.ts
export const organizationsTable = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  subscriptionPlanId: uuid('subscription_plan_id').references(() => subscriptionPlansTable.id),
  trialAccountId: uuid('trial_account_id').references(() => trialAccountsTable.id),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

#### B. Tenant Foreign Keys

**Status**: ❌ **Missing on ALL business tables**

Every business domain table lacks tenant isolation:

| Table | Location | Status |
|-------|----------|--------|
| Products | `api/src/database/schemas/products.schema.ts` | ❌ No tenant_id |
| Inventory | `api/src/database/schemas/inventory.schema.ts` | ❌ No tenant_id |
| Orders | `api/src/database/schemas/orders.schema.ts` | ❌ No tenant_id |
| Customers | `api/src/database/schemas/customers.schema.ts` | ❌ No tenant_id |
| Recipes | `api/src/database/schemas/recipes.schema.ts` | ❌ No tenant_id |
| Production | `api/src/database/schemas/production.schema.ts` | ❌ No tenant_id |
| Internal Orders | `api/src/database/schemas/internal-orders.schema.ts` | ❌ No tenant_id |
| Suppliers | `api/src/database/schemas/suppliers.schema.ts` | ❌ No tenant_id |
| Analytics | `api/src/database/schemas/analytics.schema.ts` | ❌ No tenant_id |
| Locations | `api/src/database/schemas/locations.schema.ts` | ❌ No tenant_id |

**Impact**: User A from Bakery A can query and modify User B's data from Bakery B.

**Required Addition**:
```typescript
// Add to EVERY business table
tenantId: uuid('tenant_id')
  .references(() => organizationsTable.id, { onDelete: 'cascade' })
  .notNull(),
```

**Required Indexes**:
```sql
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);
-- ... and so on for all tables
```

---

#### C. JWT Tenant Context

**Status**: ❌ **Not in token payload**

**Current JWT Payload** (`api/src/auth/auth.service.ts:22-29`):
```typescript
export interface JwtPayload {
  sub: string;        // user ID
  email: string;      // user email
  role: string;       // user role
  type: 'access' | 'refresh';
  iat?: number;
  exp: number;
}
```

**Missing**: `tenantId` or `organizationId`

**Impact**: No way to identify which tenant a request belongs to.

**Required Update**:
```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;   // ← ADD THIS
  type: 'access' | 'refresh';
  iat?: number;
  exp: number;
}
```

---

#### D. Tenant Context Middleware

**Status**: ❌ **Does not exist**

**Current Middleware** (`api/src/app.module.ts:104-106`):
- Only `CorrelationIdMiddleware` exists
- No tenant extraction or injection

**Required Implementation**:
```typescript
// api/src/common/middleware/tenant-context.middleware.ts
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as JwtPayload;

    if (user && user.tenantId) {
      req['tenantId'] = user.tenantId;
    }

    next();
  }
}
```

---

#### E. Query Scoping

**Status**: ❌ **No tenant filtering anywhere**

**Examples of Unscoped Queries**:

**Products Service** (`api/src/products/products.service.ts:25-66`):
```typescript
async getProducts(filters: any) {
  return this.db
    .select()
    .from(productsTable)
    .where(eq(productsTable.category, filters.category))
    // ❌ NO TENANT FILTER - returns ALL products globally
}
```

**Inventory Service** (`api/src/inventory/inventory.service.ts:28-94`):
```typescript
async getInventory(filters: any) {
  return this.db
    .select()
    .from(inventoryTable)
    // ❌ NO TENANT FILTER - returns ALL inventory items globally
}
```

**Users Service** (`api/src/users/users.service.ts:44-77`):
```typescript
async findAll() {
  return this.db
    .select()
    .from(usersTable);
    // ❌ RETURNS ALL USERS IN ENTIRE DATABASE
}
```

**Impact**: Every query is global. Massive security breach. User from Bakery A can access Bakery B's products, inventory, orders, customers, etc.

**Required Updates**:
```typescript
async getProducts(tenantId: string, filters: any) {
  return this.db
    .select()
    .from(productsTable)
    .where(eq(productsTable.tenantId, tenantId))  // ← ADD THIS
    .where(eq(productsTable.category, filters.category));
}
```

---

#### F. User-Tenant Relationship

**Status**: ❌ **Incorrect model**

**Current Design** (`api/src/database/schemas/users.schema.ts:70`):
```typescript
businessName: varchar('business_name', { length: 255 })
```

**Problem**:
- Each user has their own `businessName` string
- Multiple users cannot share an organization
- No foreign key relationship

**Required Design**:
```typescript
// api/src/database/schemas/user-organizations.schema.ts
export const userOrganizationsTable = pgTable('user_organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: uuid('organization_id')
    .references(() => organizationsTable.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role', { length: 50 }).notNull(), // tenant-scoped role
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Benefits**:
- Many-to-many relationship (users can belong to multiple organizations)
- Tenant-scoped roles (user can be ADMIN in Org A, VIEWER in Org B)
- Support for organization switching

---

#### G. Subscription Enforcement

**Status**: ⚠️ **Partially defined, not enforced**

**Subscription Plans** (`api/src/database/schemas/subscription-plans.schema.ts:30-31`):
```typescript
maxLocations: integer('max_locations'),
maxUsers: integer('max_users'),
```

**Problem**:
- Limits defined but no enforcement logic exists
- No organization-level subscription tracking
- Trial accounts link to individual users, not organizations (`api/src/database/schemas/trial-accounts.schema.ts:30-32`)

**Required Implementation**:
1. Move subscription from user-level to organization-level
2. Track current usage counts
3. Enforce limits before creating new users/locations
4. Return proper error responses (402 Payment Required)

---

#### H. Frontend Tenant State

**Status**: ❌ **No tenant awareness**

**Auth Store** (`admin/src/stores/authStore.ts:14-25`):
```typescript
interface User {
  id: string;
  email: string;
  role: string;
  // ❌ No tenantId or organization
}
```

**API Client** (`admin/src/api/client.ts:85-133`):
- No tenant headers
- No tenant context injection

**Required Updates**:
```typescript
interface User {
  id: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  // For users with multiple orgs
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}
```

---

## 2. Security Vulnerabilities

### 2.1 Critical Issues

#### 🔴 **CRITICAL: Data Leakage Between Tenants**

**Severity**: Critical
**Impact**: Complete data breach

**Problem**:
- Any authenticated user can access ANY other tenant's data
- No tenant boundary enforcement anywhere in the application
- Global queries return data from all bakeries

**Exploit Scenario**:
1. User registers with Bakery A
2. User authenticates and receives JWT token
3. User calls `GET /api/v1/products` → receives products from ALL bakeries
4. User calls `GET /api/v1/inventory` → receives inventory from ALL bakeries
5. User calls `PATCH /api/v1/products/{bakery-b-product-id}` → can modify Bakery B's products

**Affected Endpoints**: ALL business domain endpoints

---

#### 🔴 **CRITICAL: Privilege Escalation**

**Severity**: Critical
**Impact**: Unauthorized modification of other tenants' data

**Problem**:
- No ownership validation in controllers
- User from Tenant A can modify/delete Tenant B's resources

**Example** (`api/src/products/products.controller.ts`):
```typescript
@Patch(':id')
async updateProduct(
  @Param('id') id: string,
  @Body() updateDto: UpdateProductDto
) {
  // ❌ No tenant validation - any user can update any product
  return this.productsService.updateProduct(id, updateDto);
}
```

---

#### 🟠 **HIGH: Subscription Bypass**

**Severity**: High
**Impact**: Revenue loss, resource abuse

**Problem**:
- No enforcement of plan limits (`maxUsers`, `maxLocations`)
- Users can exceed subscription quotas indefinitely
- No billing integration based on actual usage

---

#### 🟡 **MEDIUM: Audit Trail Issues**

**Severity**: Medium
**Impact**: Cannot determine which tenant performed actions

**Problem**:
- Correlation IDs exist but no tenant context
- Cannot audit cross-tenant activities
- Compliance issues (GDPR, SOC2)

---

### 2.2 Attack Vectors

1. **Direct API Manipulation**
   - User discovers another tenant's resource ID
   - Makes direct API call to access/modify it
   - No validation prevents this

2. **User Enumeration**
   - `GET /api/v1/users` returns ALL users globally (`api/src/users/users.service.ts:44-77`)
   - Attacker can enumerate all users across all tenants

3. **Data Mining**
   - Attacker can analyze competitors' products, pricing, inventory
   - Complete business intelligence leak

---

## 3. Implementation Plan

### Phase 1: Database Schema (Foundation)

**Timeline**: 2-3 days
**Priority**: Critical

#### Tasks:

1. **Create Organizations Table**
   ```typescript
   // api/src/database/schemas/organizations.schema.ts
   export const organizationsTable = pgTable('organizations', {
     id: uuid('id').defaultRandom().primaryKey(),
     name: varchar('name', { length: 255 }).notNull(),
     slug: varchar('slug', { length: 255 }).notNull().unique(),
     subscriptionPlanId: uuid('subscription_plan_id').references(() => subscriptionPlansTable.id),
     trialAccountId: uuid('trial_account_id').references(() => trialAccountsTable.id),
     settings: jsonb('settings').default('{}'),
     isActive: boolean('is_active').default(true),
     createdAt: timestamp('created_at').defaultNow().notNull(),
     updatedAt: timestamp('updated_at').defaultNow().notNull(),
   });
   ```

2. **Create User-Organizations Junction Table**
   ```typescript
   // api/src/database/schemas/user-organizations.schema.ts
   export const userOrganizationsTable = pgTable('user_organizations', {
     id: uuid('id').defaultRandom().primaryKey(),
     userId: uuid('user_id')
       .references(() => usersTable.id, { onDelete: 'cascade' })
       .notNull(),
     organizationId: uuid('organization_id')
       .references(() => organizationsTable.id, { onDelete: 'cascade' })
       .notNull(),
     role: varchar('role', { length: 50 }).notNull(),
     isDefault: boolean('is_default').default(false),
     createdAt: timestamp('created_at').defaultNow().notNull(),
   }, (table) => ({
     uniqueUserOrg: unique().on(table.userId, table.organizationId),
   }));
   ```

3. **Add tenantId to ALL Business Tables**

   Update these schemas:
   - `api/src/database/schemas/products.schema.ts`
   - `api/src/database/schemas/inventory.schema.ts`
   - `api/src/database/schemas/orders.schema.ts`
   - `api/src/database/schemas/customers.schema.ts`
   - `api/src/database/schemas/recipes.schema.ts`
   - `api/src/database/schemas/production.schema.ts`
   - `api/src/database/schemas/internal-orders.schema.ts`
   - `api/src/database/schemas/suppliers.schema.ts`
   - `api/src/database/schemas/analytics.schema.ts`
   - `api/src/database/schemas/locations.schema.ts`

   Add to each:
   ```typescript
   tenantId: uuid('tenant_id')
     .references(() => organizationsTable.id, { onDelete: 'cascade' })
     .notNull(),
   ```

4. **Create Database Indexes**
   ```sql
   CREATE INDEX idx_products_tenant_id ON products(tenant_id);
   CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);
   CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
   CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
   CREATE INDEX idx_recipes_tenant_id ON recipes(tenant_id);
   CREATE INDEX idx_production_tenant_id ON production(tenant_id);
   CREATE INDEX idx_internal_orders_tenant_id ON internal_orders(tenant_id);
   CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);
   CREATE INDEX idx_analytics_tenant_id ON analytics(tenant_id);
   CREATE INDEX idx_locations_tenant_id ON locations(tenant_id);
   ```

5. **Update Relations**

   Update `api/src/database/schemas/relations.ts` to include organization relations.

---

### Phase 2: Data Migration

**Timeline**: 1-2 days
**Priority**: Critical

#### Migration Strategy:

```typescript
// api/src/database/migrations/add-multi-tenancy.migration.ts

export async function up(db: Database) {
  // Step 1: Create default organization for existing data
  const [defaultOrg] = await db
    .insert(organizationsTable)
    .values({
      name: 'Default Organization',
      slug: 'default',
      isActive: true,
    })
    .returning();

  // Step 2: Link all existing users to default organization
  const existingUsers = await db.select().from(usersTable);

  for (const user of existingUsers) {
    await db.insert(userOrganizationsTable).values({
      userId: user.id,
      organizationId: defaultOrg.id,
      role: user.role, // preserve existing role
      isDefault: true,
    });
  }

  // Step 3: Backfill tenant_id on all business tables
  await db
    .update(productsTable)
    .set({ tenantId: defaultOrg.id });

  await db
    .update(inventoryTable)
    .set({ tenantId: defaultOrg.id });

  // ... repeat for all business tables
}
```

---

### Phase 3: Backend API Security

**Timeline**: 4-6 days
**Priority**: Critical

#### 3.1 Update JWT Payload

**File**: `api/src/auth/auth.service.ts`

```typescript
// Update interface
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;  // ADD THIS
  type: 'access' | 'refresh';
  iat?: number;
  exp: number;
}

// Update token generation (lines 342-375)
private async generateTokens(user: User, tenantId: string) {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId,  // ADD THIS
    type: 'access',
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
  };

  // ... rest of implementation
}
```

#### 3.2 Update JWT Strategy

**File**: `api/src/auth/strategies/jwt.strategy.ts`

```typescript
async validate(payload: JwtPayload) {
  return {
    id: payload.sub,
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,  // ADD THIS
  };
}
```

#### 3.3 Create Tenant Context Middleware

**File**: `api/src/common/middleware/tenant-context.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;

    if (user && user.tenantId) {
      req['tenantId'] = user.tenantId;
    }

    next();
  }
}
```

**Register in**: `api/src/app.module.ts`

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, TenantContextMiddleware)  // ADD TenantContextMiddleware
      .forRoutes('*');
  }
}
```

#### 3.4 Create Tenant Guard

**File**: `api/src/common/guards/tenant.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    return true;
  }
}
```

**Apply globally** in `api/src/app.module.ts`:

```typescript
providers: [
  // ... existing providers
  {
    provide: APP_GUARD,
    useClass: TenantGuard,
  },
],
```

#### 3.5 Scope All Service Queries

**Example**: `api/src/products/products.service.ts`

```typescript
// BEFORE (insecure)
async getProducts(filters: any) {
  return this.db
    .select()
    .from(productsTable)
    .where(eq(productsTable.category, filters.category));
}

// AFTER (tenant-scoped)
async getProducts(tenantId: string, filters: any) {
  return this.db
    .select()
    .from(productsTable)
    .where(eq(productsTable.tenantId, tenantId))  // ADD THIS
    .where(eq(productsTable.category, filters.category));
}

async getProductById(tenantId: string, id: string) {
  const [product] = await this.db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.id, id),
        eq(productsTable.tenantId, tenantId)  // ADD THIS
      )
    );

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  return product;
}
```

**Apply to ALL services**:
- `api/src/products/products.service.ts`
- `api/src/inventory/inventory.service.ts`
- `api/src/orders/orders.service.ts`
- `api/src/customers/customers.service.ts`
- `api/src/recipes/recipes.service.ts`
- `api/src/production/production.service.ts`
- `api/src/users/users.service.ts`
- All other business domain services

#### 3.6 Update Controllers

**Example**: `api/src/products/products.controller.ts`

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  @Get()
  async getProducts(
    @Req() req: Request,
    @Query() filters: any,
  ) {
    const tenantId = req['tenantId'];
    return this.productsService.getProducts(tenantId, filters);
  }

  @Get(':id')
  async getProduct(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const tenantId = req['tenantId'];
    return this.productsService.getProductById(tenantId, id);
  }

  @Post()
  async createProduct(
    @Req() req: Request,
    @Body() createDto: CreateProductDto,
  ) {
    const tenantId = req['tenantId'];
    return this.productsService.createProduct(tenantId, createDto);
  }

  @Patch(':id')
  async updateProduct(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    const tenantId = req['tenantId'];
    return this.productsService.updateProduct(tenantId, id, updateDto);
  }
}
```

**Apply to ALL controllers**.

---

### Phase 4: Subscription & Authorization

**Timeline**: 3-4 days
**Priority**: High

#### 4.1 Move Subscription to Organization Level

**Update**: `api/src/database/schemas/trial-accounts.schema.ts`

```typescript
// BEFORE
organizationId: uuid('organization_id').references(() => usersTable.id),

// AFTER
organizationId: uuid('organization_id').references(() => organizationsTable.id),
```

#### 4.2 Create Quota Enforcement

**File**: `api/src/common/guards/quota.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, PaymentRequiredException } from '@nestjs/common';
import { OrganizationsService } from '../../organizations/organizations.service';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private organizationsService: OrganizationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    const endpoint = request.route.path;

    // Check if creating a user or location
    if (endpoint.includes('/users') && request.method === 'POST') {
      const canAddUser = await this.organizationsService.canAddUser(tenantId);
      if (!canAddUser) {
        throw new PaymentRequiredException('User limit reached. Upgrade your plan.');
      }
    }

    if (endpoint.includes('/locations') && request.method === 'POST') {
      const canAddLocation = await this.organizationsService.canAddLocation(tenantId);
      if (!canAddLocation) {
        throw new PaymentRequiredException('Location limit reached. Upgrade your plan.');
      }
    }

    return true;
  }
}
```

#### 4.3 Track Usage

**File**: `api/src/organizations/organizations.service.ts`

```typescript
async canAddUser(organizationId: string): Promise<boolean> {
  const org = await this.getOrganizationWithPlan(organizationId);
  const currentUserCount = await this.getUserCount(organizationId);

  return currentUserCount < org.subscriptionPlan.maxUsers;
}

async canAddLocation(organizationId: string): Promise<boolean> {
  const org = await this.getOrganizationWithPlan(organizationId);
  const currentLocationCount = await this.getLocationCount(organizationId);

  return currentLocationCount < org.subscriptionPlan.maxLocations;
}

private async getUserCount(organizationId: string): Promise<number> {
  const result = await this.db
    .select({ count: sql<number>`count(*)` })
    .from(userOrganizationsTable)
    .where(eq(userOrganizationsTable.organizationId, organizationId));

  return result[0].count;
}

private async getLocationCount(organizationId: string): Promise<number> {
  const result = await this.db
    .select({ count: sql<number>`count(*)` })
    .from(locationsTable)
    .where(eq(locationsTable.tenantId, organizationId));

  return result[0].count;
}
```

---

### Phase 5: Frontend Updates

**Timeline**: 2-3 days
**Priority**: Medium

#### 5.1 Update Auth Store

**File**: `admin/src/stores/authStore.tsx`

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  organization: Organization;  // ADD THIS
  // Optional: for multi-org support
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}
```

#### 5.2 Update API Responses

**File**: `api/src/auth/auth.service.ts`

```typescript
async login(loginDto: LoginDto) {
  // ... existing validation

  // Get user's default organization
  const [userOrg] = await this.db
    .select()
    .from(userOrganizationsTable)
    .innerJoin(organizationsTable, eq(userOrganizationsTable.organizationId, organizationsTable.id))
    .where(
      and(
        eq(userOrganizationsTable.userId, user.id),
        eq(userOrganizationsTable.isDefault, true)
      )
    );

  const tokens = await this.generateTokens(user, userOrg.organizationId);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: userOrg.role,
      organization: {
        id: userOrg.organizations.id,
        name: userOrg.organizations.name,
        slug: userOrg.organizations.slug,
      },
    },
    ...tokens,
  };
}
```

#### 5.3 Display Organization in UI

**File**: `admin/src/components/layout/Header.tsx`

```tsx
import { useAuth } from '../../stores/authStore';

export function Header() {
  const { user } = useAuth();

  return (
    <header>
      <div class="organization-info">
        <span>{user()?.organization.name}</span>
      </div>
      {/* ... rest of header */}
    </header>
  );
}
```

---

### Phase 6: Database Row-Level Security (Optional but Recommended)

**Timeline**: 2 days
**Priority**: Medium (Defense in Depth)

#### Enable PostgreSQL RLS

```sql
-- Enable RLS on all business tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_policy ON products
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_policy ON inventory
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- ... repeat for all tables
```

#### Set Tenant Context in Connection

**File**: `api/src/database/database.service.ts`

```typescript
async setTenantContext(tenantId: string) {
  await this.db.execute(
    sql`SET LOCAL app.current_tenant = ${tenantId}`
  );
}
```

**Call in middleware**:

```typescript
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private databaseService: DatabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;

    if (user && user.tenantId) {
      req['tenantId'] = user.tenantId;
      await this.databaseService.setTenantContext(user.tenantId);
    }

    next();
  }
}
```

---

### Phase 7: Testing & Validation

**Timeline**: 5 days
**Priority**: Critical

#### 7.1 Unit Tests

Create tests for tenant isolation:

```typescript
// api/src/products/products.service.spec.ts
describe('ProductsService - Tenant Isolation', () => {
  it('should only return products for specified tenant', async () => {
    const tenant1Products = await service.getProducts(tenant1Id, {});
    const tenant2Products = await service.getProducts(tenant2Id, {});

    expect(tenant1Products.every(p => p.tenantId === tenant1Id)).toBe(true);
    expect(tenant2Products.every(p => p.tenantId === tenant2Id)).toBe(true);
    expect(tenant1Products).not.toEqual(tenant2Products);
  });

  it('should not allow access to other tenant resources', async () => {
    const tenant1Product = await service.createProduct(tenant1Id, productDto);

    await expect(
      service.getProductById(tenant2Id, tenant1Product.id)
    ).rejects.toThrow(NotFoundException);
  });
});
```

#### 7.2 Integration Tests

```typescript
// api/test/tenant-isolation.e2e-spec.ts
describe('Tenant Isolation (e2e)', () => {
  it('should prevent cross-tenant data access', async () => {
    // Create two tenants with users
    const { token: token1 } = await createTenantAndUser('Bakery A');
    const { token: token2, productId } = await createTenantAndUser('Bakery B');

    // Try to access Tenant B's product with Tenant A's token
    const response = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(404); // Should not find resource
  });
});
```

#### 7.3 Security Audit Checklist

- [ ] All business tables have `tenant_id` foreign key
- [ ] All queries filter by `tenant_id`
- [ ] JWT includes `tenantId`
- [ ] Tenant context middleware active
- [ ] Tenant guard applied globally
- [ ] No global queries (users, products, etc.)
- [ ] Resource ownership validated in all PATCH/DELETE endpoints
- [ ] Subscription limits enforced
- [ ] Frontend displays organization context
- [ ] RLS policies active (if implemented)
- [ ] Integration tests pass
- [ ] Load testing with multiple tenants

---

## 4. Recommended Architecture Pattern

### 4.1 Hybrid Approach: Application-Level + Row-Level Security

**Use Both for Defense in Depth**:

1. **Application-Level Scoping** (Primary)
   - More flexible
   - Better error messages
   - Easier debugging
   - Explicit tenant context

2. **PostgreSQL RLS** (Secondary)
   - Database-level enforcement
   - Cannot be bypassed by application bugs
   - Additional safety layer
   - Protects against SQL injection

### 4.2 Base Repository Pattern

Create a tenant-scoped base repository:

```typescript
// api/src/common/repositories/tenant-scoped.repository.ts
export abstract class TenantScopedRepository<T> {
  constructor(
    protected db: Database,
    protected table: PgTable,
  ) {}

  async find(tenantId: string, filters?: any) {
    return this.db
      .select()
      .from(this.table)
      .where(eq(this.table.tenantId, tenantId))
      .where(filters);
  }

  async findById(tenantId: string, id: string) {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.tenantId, tenantId)
        )
      );

    return record;
  }

  async create(tenantId: string, data: any) {
    return this.db
      .insert(this.table)
      .values({ ...data, tenantId })
      .returning();
  }

  async update(tenantId: string, id: string, data: any) {
    return this.db
      .update(this.table)
      .set(data)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.tenantId, tenantId)
        )
      )
      .returning();
  }

  async delete(tenantId: string, id: string) {
    return this.db
      .delete(this.table)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.tenantId, tenantId)
        )
      );
  }
}
```

**Usage**:

```typescript
@Injectable()
export class ProductsRepository extends TenantScopedRepository<Product> {
  constructor(db: Database) {
    super(db, productsTable);
  }

  // Add product-specific methods
  async findByCategory(tenantId: string, category: string) {
    return this.find(tenantId, eq(this.table.category, category));
  }
}
```

### 4.3 Tenant Context Decorator

Create a decorator to extract tenant context:

```typescript
// api/src/common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
```

**Usage in controllers**:

```typescript
@Get()
async getProducts(
  @TenantId() tenantId: string,
  @Query() filters: any,
) {
  return this.productsService.getProducts(tenantId, filters);
}
```

---

## 5. Migration Effort Estimate

### 5.1 Detailed Timeline

| Phase | Component | Complexity | Days | Dependencies |
|-------|-----------|-----------|------|--------------|
| **1** | Create organizations table | Medium | 1 | None |
| **1** | Create user-organizations table | Medium | 0.5 | Phase 1.1 |
| **1** | Add tenant_id to all tables | High | 1.5 | Phase 1.1 |
| **1** | Create indexes | Low | 0.5 | Phase 1.3 |
| **1** | Update relations | Low | 0.5 | Phase 1.3 |
| **2** | Data migration script | Medium | 1 | Phase 1 complete |
| **2** | Testing migration | Medium | 1 | Phase 2.1 |
| **3** | Update JWT payload | Low | 0.5 | None |
| **3** | Update JWT strategy | Low | 0.5 | Phase 3.1 |
| **3** | Tenant context middleware | Medium | 1 | Phase 3.2 |
| **3** | Tenant guard | Medium | 1 | Phase 3.3 |
| **3** | Scope products service | Medium | 1 | Phase 3.4 |
| **3** | Scope inventory service | Medium | 1 | Phase 3.4 |
| **3** | Scope orders service | Medium | 1 | Phase 3.4 |
| **3** | Scope other services | High | 2 | Phase 3.4 |
| **3** | Update all controllers | High | 2 | Phase 3.5 |
| **4** | Move subscriptions to org level | Medium | 1 | Phase 2 complete |
| **4** | Quota enforcement | Medium | 2 | Phase 4.1 |
| **4** | Usage tracking | Low | 1 | Phase 4.1 |
| **5** | Update auth store | Low | 0.5 | None |
| **5** | Update API responses | Medium | 1 | Phase 3 complete |
| **5** | UI updates | Low | 1.5 | Phase 5.1 |
| **6** | PostgreSQL RLS (optional) | Medium | 2 | Phase 3 complete |
| **7** | Unit tests | High | 2 | Phases 1-5 |
| **7** | Integration tests | High | 2 | Phases 1-5 |
| **7** | Security audit | High | 1 | Phases 1-7 |

**Total**: **29.5 working days** (~6 weeks)

### 5.2 Team Requirements

**Recommended Team**:
- 1 Backend Developer (NestJS/Drizzle expertise)
- 1 Frontend Developer (Solid.js)
- 1 QA Engineer (security testing)

**With full team**: ~2-3 weeks
**With single developer**: ~6 weeks

---

## 6. Immediate Next Steps

### 6.1 Pre-Implementation Checklist

Before starting implementation:

- [ ] **Backup production database** (if applicable)
- [ ] **Create feature branch** for multi-tenancy work
- [ ] **Set up staging environment** for testing
- [ ] **Review and approve architecture** with team
- [ ] **Plan zero-downtime migration** strategy
- [ ] **Identify breaking changes** for API clients

### 6.2 Implementation Order (Critical Path)

**DO NOT SKIP ANY STEPS**

1. ✅ **Phase 1**: Database schema changes (3-4 days)
2. ✅ **Phase 2**: Data migration (1-2 days)
3. ✅ **Phase 3**: Backend API security (4-6 days)
4. ✅ **Phase 4**: Subscription enforcement (3-4 days)
5. ✅ **Phase 5**: Frontend updates (2-3 days)
6. ⚠️ **Phase 6**: PostgreSQL RLS - optional but recommended (2 days)
7. ✅ **Phase 7**: Testing & security audit (5 days)

**Total**: 20-30 days

### 6.3 Deployment Checklist

Before deploying multi-tenancy to production:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Security audit completed
- [ ] Load testing with multiple tenants completed
- [ ] Data migration tested on staging
- [ ] Rollback plan documented
- [ ] API documentation updated
- [ ] Frontend changes deployed
- [ ] Monitoring alerts configured
- [ ] Incident response plan updated

### 6.4 Current Safe Use Cases

**Until multi-tenancy is implemented**:

✅ **SAFE**: Single bakery deployment (one instance per customer)
❌ **UNSAFE**: Multiple bakeries on same platform/database

**Temporary mitigation** (if multi-tenant deployment is urgent):
1. Deploy separate instances for each customer
2. Use separate databases
3. Isolate at infrastructure level (not application level)

---

## 7. Conclusion

### 7.1 Summary

BakeWind requires a **complete multi-tenancy implementation** before it can safely operate as a SaaS platform serving multiple bakery customers on a shared infrastructure.

**Current State**:
- Designed for single bakery with multiple employees
- No tenant isolation at any layer
- Critical security vulnerabilities if deployed as SaaS

**Required Changes**:
- Add organization/tenant entity and relationships
- Add tenant_id foreign keys to all business tables
- Update JWT to include tenant context
- Implement tenant-scoped queries across entire codebase
- Add subscription enforcement at organization level
- Update frontend to display tenant context

**Effort**: 4-6 weeks of focused development

### 7.2 Risk Assessment

| Deployment Scenario | Risk Level | Recommendation |
|---------------------|-----------|----------------|
| Single bakery per instance | ✅ Low | Safe to deploy |
| Multiple bakeries on shared database (current code) | 🔴 Critical | **DO NOT DEPLOY** |
| Multiple bakeries after multi-tenancy implementation | 🟢 Low | Safe after thorough testing |

### 7.3 Priority Recommendation

**Priority**: 🔴 **CRITICAL** if planning multi-tenant SaaS deployment
**Priority**: 🟡 **Medium** if deploying single-tenant instances only

**Next Action**:
1. Decide on deployment model (single-tenant vs multi-tenant)
2. If multi-tenant: Begin Phase 1 immediately
3. If single-tenant: Defer multi-tenancy work, plan for future

---

## 8. Questions & Support

For questions about this analysis or implementation plan:

1. Review this document thoroughly
2. Check affected file locations mentioned
3. Test proposed changes in development environment
4. Conduct security review before production deployment

**Document Maintenance**:
- Update this document as implementation progresses
- Track completed phases
- Document any deviations from plan
- Add lessons learned

---

**End of Document**

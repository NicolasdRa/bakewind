# BakeWind Customer API Client

This directory contains the complete API client for the BakeWind customer application, featuring type-safe API calls, generated TypeScript types from OpenAPI specifications, and SolidJS-specific composables.

## Architecture

```
src/api/
├── client.ts          # Core API client with auth and error handling
├── products.ts        # Products API endpoints (mock data)
├── orders.ts          # Orders API endpoints (mock data)
├── composables.ts     # SolidJS reactive hooks for API calls
├── types.ts           # Generated TypeScript types from OpenAPI spec
├── index.ts           # Main exports
└── README.md          # This file
```

## Features

- ✅ **Type Safety**: Generated TypeScript types from OpenAPI specification
- ✅ **Authentication**: JWT token management with refresh tokens via httpOnly cookies
- ✅ **Error Handling**: Comprehensive error handling with custom ApiError class
- ✅ **SolidJS Integration**: Reactive composables using createResource
- ✅ **Mock Data**: Complete mock implementations for development
- ✅ **Auto-regeneration**: Scripts to regenerate types when API changes

## Usage

### Basic API Calls

```typescript
import { api } from '../api';

// Get all products
const products = await api.products.getProducts({
  category: 'Bread',
  search: 'sourdough'
});

// Authenticate user
const user = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Create an order
const order = await api.orders.createOrder({
  items: [{ productId: '1', quantity: 2 }],
  customerInfo: { /* ... */ },
  deliveryType: 'pickup',
  paymentMethod: 'card'
});
```

### SolidJS Composables

```typescript
import { useProducts, useProduct, useAuth } from '../api';

function ProductsPage() {
  const { products, loading, error } = useProducts(() => ({
    category: 'Pastries',
    available: true
  }));

  return (
    <Show when={!loading()} fallback={<div>Loading...</div>}>
      <For each={products()}>
        {(product) => <ProductCard product={product} />}
      </For>
    </Show>
  );
}

function ProductDetail(props: { id: string }) {
  const { product, loading, error } = useProduct(() => props.id);

  return (
    <Show when={product()} fallback={<div>Loading...</div>}>
      <h1>{product()!.name}</h1>
      <p>{product()!.description}</p>
    </Show>
  );
}
```

### Authentication

```typescript
import { useAuth } from '../api';

function LoginForm() {
  const auth = useAuth();

  const handleLogin = async (credentials) => {
    try {
      await auth.login(credentials);
      // User is now authenticated
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Show when={!auth.isAuthenticated()}>
      <form onSubmit={handleLogin}>
        {/* Login form */}
      </form>
    </Show>
  );
}
```

## API Client Configuration

The API client automatically configures itself based on the environment:

- **Development**: `http://localhost:5000`
- **Production**: `https://api.bakewind.com`

### Custom Configuration

```typescript
import { apiClient } from '../api';

// Update base URL
apiClient.updateConfig({
  baseUrl: 'https://custom-api.example.com',
  headers: {
    'X-Custom-Header': 'value'
  }
});

// Set authentication token (handled automatically via cookies)
apiClient.setAuthToken('your-jwt-token');
```

## Type Generation

Types are automatically generated from the OpenAPI specification. To regenerate:

```bash
# Generate from local development server
npm run generate-api-types

# Generate from production API
npm run generate-api-types:prod
```

## Mock Data

During development, the API client uses comprehensive mock data:

- **Products**: 6 sample bakery products with full details
- **Orders**: Sample order with realistic data structure
- **Authentication**: Mock login/logout functionality

## Error Handling

The API client includes comprehensive error handling:

```typescript
import { ApiError } from '../api';

try {
  const products = await api.products.getProducts();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.statusText}`);
    console.error('Response data:', error.data);
  } else {
    console.error('Network error:', error.message);
  }
}
```

## Available Endpoints

### Authentication (`api.auth`)
- `login(credentials)` - Authenticate user
- `register(userData)` - Register new user
- `logout()` - Sign out user
- `refresh()` - Refresh access token
- `getProfile()` - Get current user profile

### Products (`api.products`)
- `getProducts(filters)` - Get all products with filtering
- `getProduct(id)` - Get single product by ID
- `getCategories()` - Get product categories
- `getFeaturedProducts(limit)` - Get featured products
- `searchProducts(query)` - Search products

### Orders (`api.orders`)
- `createOrder(data)` - Create new order
- `getOrders(page, limit)` - Get user's orders
- `getOrder(id)` - Get single order
- `cancelOrder(id)` - Cancel order
- `trackOrder(id)` - Track order status
- `reorder(orderId)` - Reorder previous order

### Users (`api.users`)
- `getProfile()` - Get user profile
- `updateProfile(updates)` - Update user profile

### Health (`api.health`)
- `check()` - Check API health status

## Development

When the API server is updated:

1. Restart the API server
2. Run `npm run generate-api-types` to update TypeScript types
3. Update mock data if needed
4. Test the integration

## Migration from Mock to Real API

When real API endpoints become available:

1. Update the respective API files (`products.ts`, `orders.ts`)
2. Replace mock functions with real HTTP calls using the base client
3. Update type definitions if needed
4. Remove mock data

Example migration:

```typescript
// Before (mock)
export const productsApi = {
  getProducts: async (filters) => {
    // Mock implementation
    return mockProducts;
  }
};

// After (real API)
export const productsApi = {
  getProducts: async (filters) => {
    return apiFetch<ProductsResponse>('/products', {
      method: 'GET',
      // Add query parameters from filters
    });
  }
};
```
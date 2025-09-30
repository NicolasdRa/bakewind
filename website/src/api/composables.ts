import { createSignal, createResource, createMemo } from "solid-js";
import { authApi, usersApi, healthApi } from "./client";
import { productsApi } from "./products";
import type { Product, ProductFilters } from "./products";
import { ordersApi } from "./orders";
import type { Order } from "./orders";

// Local api object to avoid circular dependency
const api = {
  auth: authApi,
  users: usersApi,
  health: healthApi,
  products: productsApi,
  orders: ordersApi,
};

// Products composables
export function useProducts(filters?: () => ProductFilters) {
  const [productsResource] = createResource(
    filters,
    (filters) => api.products.getProducts(filters || {})
  );

  return {
    products: createMemo(() => productsResource()?.products || []),
    loading: productsResource.loading,
    error: productsResource.error,
    refetch: productsResource.refetch,
  };
}

export function useProduct(id: () => string) {
  const [productResource] = createResource(
    id,
    (id) => api.products.getProduct(id)
  );

  return {
    product: productResource,
    loading: productResource.loading,
    error: productResource.error,
    refetch: productResource.refetch,
  };
}

export function useFeaturedProducts(limit: () => number = () => 6) {
  const [featuredResource] = createResource(
    limit,
    (limit) => api.products.getFeaturedProducts(limit)
  );

  return {
    products: createMemo(() => featuredResource() || []),
    loading: featuredResource.loading,
    error: featuredResource.error,
    refetch: featuredResource.refetch,
  };
}

// Orders composables
export function useOrders() {
  const [ordersResource] = createResource(
    () => api.orders.getOrders()
  );

  return {
    orders: createMemo(() => ordersResource()?.orders || []),
    loading: ordersResource.loading,
    error: ordersResource.error,
    refetch: ordersResource.refetch,
  };
}

export function useOrder(id: () => string) {
  const [orderResource] = createResource(
    id,
    (id) => api.orders.getOrder(id)
  );

  return {
    order: orderResource,
    loading: orderResource.loading,
    error: orderResource.error,
    refetch: orderResource.refetch,
  };
}

// Authentication composables
export function useAuth() {
  const [user, setUser] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal(null);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.auth.login(credentials);
      setUser(response.user);
      // Token is handled via httpOnly cookies
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
      setUser(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await api.auth.getProfile();
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    getProfile,
    isAuthenticated: createMemo(() => !!user()),
  };
}

// Health check composable
export function useHealth() {
  const [healthResource] = createResource(
    () => api.health.check()
  );

  return {
    health: healthResource,
    loading: healthResource.loading,
    error: healthResource.error,
    isHealthy: createMemo(() => healthResource()?.data?.status === "UP"),
    refetch: healthResource.refetch,
  };
}
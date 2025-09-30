import { Router, Route, A, RouteSectionProps } from "@solidjs/router";
import { Component, Show, lazy, JSX } from "solid-js";
import { AuthProvider, useAuth } from "./stores/authStore";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrdersPage = lazy(() => import("./pages/orders/OrdersPage"));
const InventoryPage = lazy(() => import("./pages/inventory/InventoryPage"));
const ProductionPage = lazy(() => import("./pages/production/ProductionPage"));
const RecipesPage = lazy(() => import("./pages/recipes/RecipesPage"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));

// Protected Route component
const ProtectedRoute: Component<{ children: JSX.Element }> = (props) => {
  const auth = useAuth();

  console.log('[ProtectedRoute] Auth state:', {
    isInitialized: auth.isInitialized,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user?.email
  });

  const handleLoginRedirect = () => {
    const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3000';
    window.location.href = `${customerAppUrl}/login`;
  };

  return (
    <Show
      when={auth.isInitialized && !auth.isLoading}
      fallback={
        <div class="loading-screen">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      }
    >
      <Show
        when={auth.isAuthenticated}
        fallback={
          <div class="auth-redirect">
            <h2>Authentication Required</h2>
            <p>You need to log in to access the BakeWind Admin Dashboard.</p>
            <button onClick={handleLoginRedirect} class="login-redirect-btn" type="button">
              Go to Login
            </button>
          </div>
        }
      >
        {props.children}
      </Show>
    </Show>
  );
};

// Main layout wrapper
const Layout: Component<{ children: JSX.Element }> = (props) => {
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div class="app-layout">
      <Show when={auth.isAuthenticated}>
        <nav class="app-nav">
          <div class="nav-brand">
            <h1>BakeWind Admin</h1>
          </div>
          <div class="nav-menu">
            <A href="/" class="nav-link" activeClass="nav-link-active">
              Dashboard
            </A>
            <A href="/orders" class="nav-link" activeClass="nav-link-active">
              Orders
            </A>
            <A href="/inventory" class="nav-link" activeClass="nav-link-active">
              Inventory
            </A>
            <A href="/production" class="nav-link" activeClass="nav-link-active">
              Production
            </A>
            <A href="/recipes" class="nav-link" activeClass="nav-link-active">
              Recipes
            </A>
            <A href="/customers" class="nav-link" activeClass="nav-link-active">
              Customers
            </A>
            <A href="/analytics" class="nav-link" activeClass="nav-link-active">
              Analytics
            </A>
          </div>
          <div class="nav-user">
            <Show when={auth.user}>
              <span class="user-name">{auth.user?.email}</span>
            </Show>
            <button onClick={handleLogout} class="logout-btn" type="button">
              Logout
            </button>
          </div>
        </nav>
      </Show>
      <main class="app-main">
        {props.children}
      </main>
    </div>
  );
};

// Protected page wrapper - cleaner than wrapping each route
const ProtectedPage: Component<{ children: JSX.Element }> = (props) => (
  <ProtectedRoute>
    {props.children}
  </ProtectedRoute>
);

// Root layout component for Router - wraps all routes with AuthProvider and Layout
const RootLayout: Component<RouteSectionProps> = (props) => {
  console.log('[RootLayout] Rendering');
  return (
    <AuthProvider>
      <Layout>
        {props.children}
      </Layout>
    </AuthProvider>
  );
};

const App: Component = () => {
  console.log('[App] Rendering App component');

  return (
    <Router root={RootLayout}>
      <Route
        path="/"
        component={() => (
          <ProtectedPage>
            <Dashboard />
          </ProtectedPage>
        )}
      />
      <Route
        path="/orders"
        component={() => (
          <ProtectedPage>
            <OrdersPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/inventory"
        component={() => (
          <ProtectedPage>
            <InventoryPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/production"
        component={() => (
          <ProtectedPage>
            <ProductionPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/recipes"
        component={() => (
          <ProtectedPage>
            <RecipesPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/customers"
        component={() => (
          <ProtectedPage>
            <CustomersPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/analytics"
        component={() => (
          <ProtectedPage>
            <AnalyticsPage />
          </ProtectedPage>
        )}
      />
    </Router>
  );
};

export default App;
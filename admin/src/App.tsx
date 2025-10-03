import { Router, Route } from "@solidjs/router";
import { Component, lazy } from "solid-js";
import { Navigate } from "@solidjs/router";

import ProtectedPage from "./ProtectedPage";
import RootLayout from "./RootLayout";
import NotFound from "./pages/not-found/NotFoundPage";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrdersPage = lazy(() => import("./pages/orders/OrdersPage"));
const InventoryPage = lazy(() => import("./pages/inventory/InventoryPage"));
const ProductionPage = lazy(() => import("./pages/production/ProductionPage"));
const RecipesPage = lazy(() => import("./pages/recipes/RecipesPage"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const ProductsPage = lazy(() => import("./pages/Products"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const DevLogin = lazy(() => import("./pages/DevLogin"));

// Auth pages (public routes)
const Login = lazy(() => import("./pages/auth/Login"));
const TrialSignup = lazy(() => import("./pages/auth/TrialSignup"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

const App: Component = () => {
  console.log('[App] Rendering App component');

  // Get base path from environment (for proxy setup) or use root
  const basePath = import.meta.env.VITE_BASE_PATH || '';
  console.log('[App] Base path:', basePath);

  return (
    <Router base={basePath} root={RootLayout}>
      {/* PUBLIC AUTH ROUTES - No protection needed */}
      <Route path="/login" component={Login} />
      <Route path="/trial-signup" component={TrialSignup} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Auth callback route - public, no protection */}
      <Route path="/auth/callback" component={AuthCallback} />

      {/* Development-only direct login (bypasses cookie issues on localhost) */}
      <Route path="/dev-login" component={DevLogin} />

      {/* Redirect root to dashboard */}
      <Route path="/" component={() => <Navigate href="/dashboard/overview" />} />

      {/* Dashboard routes - all under /dashboard/* */}
      <Route
        path="/dashboard/overview"
        component={() => (
          <ProtectedPage>
            <Dashboard />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/orders"
        component={() => (
          <ProtectedPage>
            <OrdersPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/inventory"
        component={() => (
          <ProtectedPage>
            <InventoryPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/production"
        component={() => (
          <ProtectedPage>
            <ProductionPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/recipes"
        component={() => (
          <ProtectedPage>
            <RecipesPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/products"
        component={() => (
          <ProtectedPage>
            <ProductsPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/customers"
        component={() => (
          <ProtectedPage>
            <CustomersPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/analytics"
        component={() => (
          <ProtectedPage>
            <AnalyticsPage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/profile"
        component={() => (
          <ProtectedPage>
            <ProfilePage />
          </ProtectedPage>
        )}
      />
      <Route
        path="/dashboard/settings"
        component={() => (
          <ProtectedPage>
            <SettingsPage />
          </ProtectedPage>
        )}
      />
      <Route path="*paramName" component={NotFound} />
    </Router>
  );
};

export default App;
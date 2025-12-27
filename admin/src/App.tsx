import { Router, Route, Navigate } from "@solidjs/router";
import { Component, lazy } from "solid-js";

import RootLayout from "./layouts/RootLayout";
import ProtectedLayout from "./layouts/ProtectedLayout/ProtectedLayout";
import NotFound from "./pages/not-found/NotFoundPage";
import { configureLogging } from "./utils/loggerConfig";
import { logger } from "./utils/logger";

// Configure logging based on environment
configureLogging();

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/overview/OverviewPage"));
const CustomerOrdersPage = lazy(() => import("./pages/orders/CustomerOrdersPage"));
const InternalOrdersPage = lazy(() => import("./pages/orders/InternalOrdersPage"));
const InventoryPage = lazy(() => import("./pages/inventory/InventoryPage"));
const ProductionPage = lazy(() => import("./pages/production/ProductionPage"));
const RecipesPage = lazy(() => import("./pages/recipes/RecipesPage"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const ProductsPage = lazy(() => import("./pages/products/ProductsPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const BusinessSettings = lazy(() => import("./pages/settings/BusinessSettings"));
const TeamPage = lazy(() => import("./pages/team/TeamPage"));

// Auth pages (public routes)
const Login = lazy(() => import("./pages/auth/Login"));
const TrialSignup = lazy(() => import("./pages/auth/TrialSignup"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const App: Component = () => {
  logger.ui('Rendering App component');

  return (
    <Router root={RootLayout}>
      {/* Public auth routes - no layout wrapper needed */}
      <Route path="/login" component={Login} />
      <Route path="/trial-signup" component={TrialSignup} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Redirect root to dashboard */}
      <Route path="/" component={() => <Navigate href="/dashboard/overview" />} />

      {/* Protected dashboard routes - nested under ProtectedLayout (includes auth guard + DashboardLayout) */}
      <Route path="/dashboard" component={ProtectedLayout}>
        <Route path="/overview" component={Dashboard} />
        <Route path="/orders/customer" component={CustomerOrdersPage} />
        <Route path="/orders/internal" component={InternalOrdersPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/production" component={ProductionPage} />
        <Route path="/recipes" component={RecipesPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/customers" component={CustomersPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/settings/business" component={BusinessSettings} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" component={NotFound} />
    </Router>
  );
};

export default App;

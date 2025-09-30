import { Router, Route, } from "@solidjs/router";
import { Component, lazy } from "solid-js";

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
        <Route path="*paramName" component={NotFound} />
    </Router>
  );
};

export default App;
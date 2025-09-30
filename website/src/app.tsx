import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, ErrorBoundary } from "solid-js";
import { MetaProvider, Title, Meta, Link } from "@solidjs/meta";
import StoreInitializer from "./components/StoreInitializer";
import "./app.css";

export default function App() {
  return (
    <MetaProvider>
      {/* Global Metadata */}
      <Title>SolidStart Dashboard</Title>
      <Meta name="viewport" content="width=device-width, initial-scale=1" />
      <Meta charset="utf-8" />
      <Meta name="theme-color" content="#2563eb" />
      <Meta name="author" content="SolidStart Dashboard" />
      <Meta name="keywords" content="dashboard, solidjs, tailwindcss, widgets, analytics" />
      <Meta property="og:site_name" content="SolidStart Dashboard" />
      <Meta property="og:locale" content="en_US" />
      <Meta name="twitter:creator" content="@solidjs" />
      
      <Router
        root={props => (
          <ErrorBoundary
            fallback={(err) => (
              <div class="min-h-screen bg-secondary-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                  <div class="text-6xl mb-4">💥</div>
                  <h1 class="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
                  <p class="text-secondary-600 mb-6">
                    Something went wrong. Please try refreshing the page.
                  </p>
                  <p class="text-sm text-secondary-500 mt-4">
                    Error: {err.message}
                  </p>
                </div>
              </div>
            )}
          >
            <StoreInitializer />
            <Suspense>{props.children}</Suspense>
          </ErrorBoundary>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}

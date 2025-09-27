import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { MetaProvider, Title, Meta, Link } from "@solidjs/meta";
import { ErrorBoundary } from "solid-js";

function GlobalMeta() {
  return (
    <>
      <Title>BakeWind Bakery - Fresh Baked Goods & Custom Orders</Title>
      <Meta charset="utf-8" />
      <Meta name="viewport" content="width=device-width, initial-scale=1" />
      <Meta name="description" content="BakeWind Bakery offers fresh baked breads, pastries, cakes, and custom orders. Order online for pickup or delivery. Quality ingredients, traditional methods." />
      <Meta name="keywords" content="bakery, fresh bread, pastries, cakes, custom orders, artisan bakery, online ordering" />
      <Meta name="author" content="BakeWind Bakery" />
      <Meta name="theme-color" content="#8B4513" />

      {/* Open Graph / Facebook */}
      <Meta property="og:type" content="website" />
      <Meta property="og:title" content="BakeWind Bakery - Fresh Baked Goods & Custom Orders" />
      <Meta property="og:description" content="BakeWind Bakery offers fresh baked breads, pastries, cakes, and custom orders. Order online for pickup or delivery." />
      <Meta property="og:image" content="/assets/og-image.jpg" />
      <Meta property="og:url" content="https://bakewind.com" />
      <Meta property="og:site_name" content="BakeWind Bakery" />

      {/* Twitter */}
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content="BakeWind Bakery - Fresh Baked Goods & Custom Orders" />
      <Meta name="twitter:description" content="Order fresh baked goods online from BakeWind Bakery. Quality ingredients, traditional methods." />
      <Meta name="twitter:image" content="/assets/twitter-image.jpg" />

      {/* Structured Data - Local Business */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Bakery",
          "name": "BakeWind Bakery",
          "description": "Artisan bakery specializing in fresh bread, pastries, and custom orders",
          "url": "https://bakewind.com",
          "telephone": "+1-555-BAKEWIND",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Baker Street",
            "addressLocality": "Downtown",
            "addressRegion": "CA",
            "postalCode": "90210",
            "addressCountry": "US"
          },
          "openingHours": [
            "Mo-Fr 06:00-18:00",
            "Sa 07:00-17:00",
            "Su 08:00-15:00"
          ],
          "servesCuisine": "Bakery",
          "priceRange": "$$",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Bakery Products",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Fresh Breads"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Pastries & Croissants"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Custom Cakes"
                }
              }
            ]
          }
        })}
      </script>

      {/* Favicon and Icons */}
      <Link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <Link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <Link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <Link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <Link rel="manifest" href="/site.webmanifest" />

      {/* Preload critical resources */}
      <Link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />

      {/* DNS prefetch for external domains */}
      <Link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <Link rel="dns-prefetch" href="//api.bakewind.com" />
    </>
  );
}

function LoadingFallback() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-amber-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p class="text-amber-800 font-medium">Loading BakeWind...</p>
      </div>
    </div>
  );
}

function ErrorFallback(err: Error) {
  return (
    <div class="min-h-screen flex items-center justify-center bg-red-50">
      <div class="text-center max-w-md mx-auto p-6">
        <h1 class="text-2xl font-bold text-red-800 mb-4">Oops! Something went wrong</h1>
        <p class="text-red-600 mb-4">We're having trouble loading the page. Please try refreshing.</p>
        <button
          class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          onclick={() => window.location.reload()}
        >
          Refresh Page
        </button>
        <details class="mt-4 text-left">
          <summary class="cursor-pointer text-red-600 text-sm">Technical Details</summary>
          <pre class="text-xs text-red-500 mt-2 overflow-auto">{err.message}</pre>
        </details>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MetaProvider>
      <GlobalMeta />
      <ErrorBoundary fallback={ErrorFallback}>
        <Router
          root={props => (
            <Suspense fallback={<LoadingFallback />}>
              {props.children}
            </Suspense>
          )}
        >
          <FileRoutes />
        </Router>
      </ErrorBoundary>
    </MetaProvider>
  );
}
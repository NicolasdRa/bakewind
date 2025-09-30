import { APIEvent } from "@solidjs/start/server";

// Define the site's base URL
const SITE_URL = "https://bakewind.com";

// Static routes with their priorities and change frequencies
const staticRoutes = [
  {
    url: "/",
    priority: 1.0,
    changefreq: "daily",
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: "/products",
    priority: 0.9,
    changefreq: "daily",
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: "/about",
    priority: 0.8,
    changefreq: "monthly",
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: "/contact",
    priority: 0.7,
    changefreq: "monthly",
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: "/login",
    priority: 0.6,
    changefreq: "yearly",
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: "/register",
    priority: 0.6,
    changefreq: "yearly",
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: "/privacy",
    priority: 0.5,
    changefreq: "yearly",
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: "/terms",
    priority: 0.5,
    changefreq: "yearly",
    lastmod: new Date().toISOString().split('T')[0]
  }
];

// Mock product data for sitemap generation
// In a real application, this would come from your API or database
const mockProducts = [
  { id: "1", slug: "sourdough-bread", lastmod: "2024-01-20" },
  { id: "2", slug: "butter-croissants", lastmod: "2024-01-20" },
  { id: "3", slug: "chocolate-chip-cookies", lastmod: "2024-01-20" },
  { id: "4", slug: "blueberry-muffins", lastmod: "2024-01-20" },
  { id: "5", slug: "apple-pie", lastmod: "2024-01-20" },
  { id: "6", slug: "birthday-cake", lastmod: "2024-01-20" }
];

// Product categories for sitemap
const productCategories = [
  { slug: "bread", lastmod: "2024-01-20" },
  { slug: "pastries", lastmod: "2024-01-20" },
  { slug: "cakes", lastmod: "2024-01-20" },
  { slug: "cookies", lastmod: "2024-01-20" },
  { slug: "seasonal", lastmod: "2024-01-20" }
];

function generateSitemapXML(): string {
  const urls: string[] = [];

  // Add static routes
  staticRoutes.forEach(route => {
    urls.push(`
  <url>
    <loc>${SITE_URL}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  });

  // Add product category pages
  productCategories.forEach(category => {
    urls.push(`
  <url>
    <loc>${SITE_URL}/products?category=${category.slug}</loc>
    <lastmod>${category.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  });

  // Add individual product pages
  mockProducts.forEach(product => {
    urls.push(`
  <url>
    <loc>${SITE_URL}/products/${product.id}</loc>
    <lastmod>${product.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('')}
</urlset>`;
}

export async function GET(event: APIEvent) {
  try {
    const sitemap = generateSitemapXML();

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
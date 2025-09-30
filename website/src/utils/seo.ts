import { Meta } from "@solidjs/meta";

// SEO utility functions for BakeWind Bakery

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: any;
}

// Default SEO configuration
export const defaultSEO: SEOConfig = {
  title: "BakeWind Bakery - Fresh Baked Goods & Custom Orders",
  description: "BakeWind Bakery offers fresh baked breads, pastries, cakes, and custom orders. Order online for pickup or delivery. Quality ingredients, traditional methods.",
  keywords: "bakery, fresh bread, pastries, cakes, custom orders, artisan bakery, online ordering",
  image: "/assets/og-image.jpg",
  url: "https://bakewind.com",
  type: "website"
};

// Generate Open Graph meta tags
export function generateOpenGraphTags(config: SEOConfig) {
  return [
    <Meta property="og:title" content={config.title} />,
    <Meta property="og:description" content={config.description} />,
    <Meta property="og:image" content={config.image || defaultSEO.image} />,
    <Meta property="og:url" content={config.url || defaultSEO.url} />,
    <Meta property="og:type" content={config.type || defaultSEO.type} />,
    <Meta property="og:site_name" content="BakeWind Bakery" />
  ];
}

// Generate Twitter meta tags
export function generateTwitterTags(config: SEOConfig) {
  return [
    <Meta name="twitter:card" content="summary_large_image" />,
    <Meta name="twitter:title" content={config.title} />,
    <Meta name="twitter:description" content={config.description} />,
    <Meta name="twitter:image" content={config.image || defaultSEO.image} />
  ];
}

// Product structured data
export function generateProductStructuredData(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  availability: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image,
    "category": product.category,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "BakeWind Bakery"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price.toFixed(2),
      "priceCurrency": "USD",
      "availability": product.availability ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "BakeWind Bakery"
      }
    }
  };
}

// Breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

// Local business structured data (enhanced)
export function generateLocalBusinessStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "name": "BakeWind Bakery",
    "description": "Artisan bakery specializing in fresh bread, pastries, and custom orders",
    "url": "https://bakewind.com",
    "telephone": "+1-555-BAKEWIND",
    "email": "info@bakewind.com",
    "logo": "https://bakewind.com/assets/logo.png",
    "image": "https://bakewind.com/assets/bakery-storefront.jpg",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Baker Street",
      "addressLocality": "Downtown",
      "addressRegion": "CA",
      "postalCode": "90210",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "34.0522",
      "longitude": "-118.2437"
    },
    "openingHours": [
      "Mo-Fr 06:00-18:00",
      "Sa 07:00-17:00",
      "Su 08:00-15:00"
    ],
    "servesCuisine": "Bakery",
    "priceRange": "$$",
    "paymentAccepted": ["Cash", "Credit Card", "Debit Card"],
    "currenciesAccepted": "USD",
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
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Sarah Johnson"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        },
        "reviewBody": "Best bakery in town! Their sourdough bread is absolutely incredible, and the staff is always friendly."
      }
    ]
  };
}

// Recipe structured data (for specialty items)
export function generateRecipeStructuredData(recipe: {
  name: string;
  description: string;
  image: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  yield: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.name,
    "description": recipe.description,
    "image": recipe.image,
    "author": {
      "@type": "Organization",
      "name": "BakeWind Bakery"
    },
    "prepTime": recipe.prepTime,
    "cookTime": recipe.cookTime,
    "totalTime": recipe.totalTime,
    "recipeYield": recipe.yield,
    "recipeIngredient": recipe.ingredients,
    "recipeInstructions": recipe.instructions.map(step => ({
      "@type": "HowToStep",
      "text": step
    })),
    ...(recipe.nutrition && {
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": recipe.nutrition.calories,
        "fatContent": recipe.nutrition.fat + "g",
        "carbohydrateContent": recipe.nutrition.carbs + "g",
        "proteinContent": recipe.nutrition.protein + "g"
      }
    })
  };
}

// FAQ structured data
export function generateFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Generate canonical URL
export function generateCanonicalURL(path: string): string {
  const baseURL = "https://bakewind.com";
  return `${baseURL}${path.startsWith('/') ? path : '/' + path}`;
}

// Generate meta keywords from content
export function generateKeywords(base: string[], additional: string[] = []): string {
  const allKeywords = [...base, ...additional, "bakery", "fresh baked goods", "artisan bread"];
  return [...new Set(allKeywords)].join(", ");
}
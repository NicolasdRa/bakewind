// Products API - Mock implementation until API endpoints are available
// This will be replaced with real API calls once product endpoints are implemented

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  isAvailable: boolean;
  allergens: string[];
  tags?: string[];
  stock?: number;
  ingredients?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
  bakingTime?: string;
  storageInstructions?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  tags?: string[];
  allergens?: string[];
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
}

// Mock data until API is available
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Artisan Sourdough Bread",
    description: "Traditional sourdough made with our 100-year-old starter. Crispy crust, tender crumb, and that distinctive tangy flavor that develops over our 24-hour fermentation process.",
    price: 4.50,
    category: "Bread",
    images: [
      "/assets/products/sourdough-1.jpg",
      "/assets/products/sourdough-2.jpg"
    ],
    isAvailable: true,
    allergens: ["Gluten"],
    tags: ["Popular", "Traditional", "Long Fermentation"],
    stock: 12,
    ingredients: [
      "Organic bread flour",
      "Water",
      "Sea salt",
      "Sourdough starter (flour, water, wild yeast)"
    ],
    nutritionalInfo: {
      calories: 265,
      protein: "9g",
      carbs: "50g",
      fat: "3g",
      fiber: "3g"
    },
    bakingTime: "Baked fresh every morning at 5 AM",
    storageInstructions: "Store at room temperature for up to 3 days. For longer storage, slice and freeze for up to 3 months."
  },
  {
    id: "2",
    name: "Butter Croissants (6-pack)",
    description: "Flaky, buttery croissants made with French butter and laminated dough. Each croissant is hand-rolled and shaped, then proofed overnight for maximum flavor development.",
    price: 12.00,
    category: "Pastries",
    images: [
      "/assets/products/croissants-1.jpg",
      "/assets/products/croissants-2.jpg"
    ],
    isAvailable: true,
    allergens: ["Gluten", "Dairy", "Eggs"],
    tags: ["French", "Buttery", "Laminated"],
    stock: 8,
    ingredients: [
      "Bread flour",
      "French butter (82% fat)",
      "Milk",
      "Eggs",
      "Sugar",
      "Salt",
      "Active dry yeast"
    ],
    nutritionalInfo: {
      calories: 231,
      protein: "5g",
      carbs: "26g",
      fat: "12g",
      fiber: "1g"
    },
    bakingTime: "Baked fresh twice daily at 6 AM and 2 PM",
    storageInstructions: "Best consumed fresh. Store in airtight container for up to 2 days or freeze for up to 1 month."
  },
  {
    id: "3",
    name: "Chocolate Chip Cookies (12-pack)",
    description: "Classic chocolate chip cookies with premium Belgian chocolate chips. Soft and chewy on the inside, slightly crispy on the outside.",
    price: 8.00,
    category: "Cookies",
    images: ["/assets/products/cookies-1.jpg"],
    isAvailable: true,
    allergens: ["Gluten", "Dairy", "Eggs"],
    tags: ["Popular", "Classic"],
    stock: 25,
  },
  {
    id: "4",
    name: "Blueberry Muffins (4-pack)",
    description: "Moist and fluffy muffins bursting with fresh blueberries. Made with organic flour and real vanilla extract.",
    price: 8.00,
    category: "Muffins",
    images: ["/assets/products/muffins-1.jpg"],
    isAvailable: true,
    allergens: ["Gluten", "Dairy", "Eggs"],
    tags: ["Seasonal", "Fresh Fruit"],
    stock: 15,
  },
  {
    id: "5",
    name: "Danish Pastries (6-pack)",
    description: "Assorted Danish pastries with fruit fillings and sweet glaze. Perfect for breakfast or afternoon tea.",
    price: 12.50,
    category: "Pastries",
    images: ["/assets/products/danish-1.jpg"],
    isAvailable: true,
    allergens: ["Gluten", "Dairy", "Eggs"],
    tags: ["Assorted", "Glazed"],
    stock: 10,
  },
  {
    id: "6",
    name: "Fresh Bagels (6-pack)",
    description: "Traditional New York style bagels, boiled and baked daily. Available in plain, sesame, and everything seasoning.",
    price: 6.00,
    category: "Bread",
    images: ["/assets/products/bagels-1.jpg"],
    isAvailable: true,
    allergens: ["Gluten"],
    tags: ["Traditional", "Boiled"],
    stock: 20,
  }
];

const categories = ["All", "Bread", "Pastries", "Cookies", "Muffins", "Cakes"];

// Mock API functions
export const productsApi = {
  // Get all products with optional filtering
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredProducts = [...mockProducts];

    // Apply filters
    if (filters.category && filters.category !== "All") {
      filteredProducts = filteredProducts.filter(p => p.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
      );
    }

    if (filters.available !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.isAvailable === filters.available);
    }

    if (filters.allergens && filters.allergens.length > 0) {
      filteredProducts = filteredProducts.filter(p =>
        !filters.allergens!.some(allergen => p.allergens.includes(allergen))
      );
    }

    if (filters.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredProducts = filteredProducts.filter(p =>
        filters.tags!.some(tag => p.tags?.includes(tag))
      );
    }

    return {
      products: filteredProducts,
      total: filteredProducts.length,
      page: 1,
      limit: filteredProducts.length,
      hasMore: false,
    };
  },

  // Get single product by ID
  getProduct: async (id: string): Promise<Product | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return mockProducts.find(p => p.id === id) || null;
  },

  // Get categories
  getCategories: async (): Promise<string[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return categories;
  },

  // Get featured products
  getFeaturedProducts: async (limit: number = 6): Promise<Product[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return mockProducts
      .filter(p => p.tags?.includes("Popular") || p.isAvailable)
      .slice(0, limit);
  },

  // Search products
  searchProducts: async (query: string): Promise<Product[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));

    const searchLower = query.toLowerCase();
    return mockProducts.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower) ||
      p.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  },
};
import { apiClient } from './client';

// Product Types
export type ProductCategory = 'bread' | 'pastry' | 'cake' | 'cookie' | 'sandwich' | 'beverage' | 'seasonal' | 'custom';
export type ProductStatus = 'active' | 'inactive' | 'seasonal' | 'discontinued';

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  sodium?: number;
}

export interface CustomizationOption {
  name: string;
  type: 'text' | 'select' | 'checkbox';
  options?: string[];
  priceAdjustment?: number;
  required?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  status: ProductStatus;
  basePrice: number;
  costOfGoods: number | null;
  // Calculated fields (computed from basePrice and costOfGoods)
  margin: number | null; // (basePrice - costOfGoods) / basePrice * 100
  markup: number | null; // (basePrice - costOfGoods) / costOfGoods * 100
  profit: number | null; // basePrice - costOfGoods
  marginWarning: boolean; // true if margin < 20%
  // End calculated fields
  recipeId: string | null;
  recipeName: string | null;
  estimatedPrepTime: number | null;
  allergens: string[] | null;
  tags: string[] | null;
  imageUrl: string | null;
  nutritionalInfo: NutritionalInfo | null;
  availableSeasons: string[] | null;
  minimumOrderQuantity: number;
  storageInstructions: string | null;
  shelfLife: number | null;
  customizable: boolean;
  customizationOptions: CustomizationOption[] | null;
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: ProductCategory;
  status?: ProductStatus;
  basePrice: number;
  costOfGoods?: number;
  // margin is calculated automatically, not provided as input
  recipeId?: string;
  recipeName?: string;
  estimatedPrepTime?: number;
  allergens?: string[];
  tags?: string[];
  imageUrl?: string;
  nutritionalInfo?: NutritionalInfo;
  availableSeasons?: string[];
  minimumOrderQuantity?: number;
  storageInstructions?: string;
  shelfLife?: number;
  customizable?: boolean;
  customizationOptions?: CustomizationOption[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  basePrice?: number;
  costOfGoods?: number;
  // margin is calculated automatically, not provided as input
  recipeId?: string;
  recipeName?: string;
  estimatedPrepTime?: number;
  allergens?: string[];
  tags?: string[];
  imageUrl?: string;
  nutritionalInfo?: NutritionalInfo;
  availableSeasons?: string[];
  minimumOrderQuantity?: number;
  storageInstructions?: string;
  shelfLife?: number;
  customizable?: boolean;
  customizationOptions?: CustomizationOption[];
}

export const productsApi = {
  /**
   * Get all products with optional filters
   */
  async getProducts(
    category?: ProductCategory,
    status?: ProductStatus,
    search?: string,
  ): Promise<Product[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const queryString = params.toString();
    return apiClient.get<Product[]>(
      `/products${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get only active products
   */
  async getActiveProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/active');
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/category/${category}`);
  },

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${productId}`);
  },

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>('/products', data);
  },

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
    return apiClient.put<Product>(`/products/${productId}`, data);
  },

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}`);
  },

  /**
   * Calculate and update product popularity based on order counts
   */
  async calculatePopularity(productId: string): Promise<Product> {
    return apiClient.post<Product>(`/products/${productId}/calculate-popularity`, {});
  },

  /**
   * Recalculate popularity for all products
   */
  async recalculateAllPopularity(): Promise<{ updated: number }> {
    return apiClient.post<{ updated: number }>('/products/recalculate-all-popularity', {});
  },
};

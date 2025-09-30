import { createSignal, createEffect, createMemo } from "solid-js";

// Types for cart functionality
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  allergens: string[];
  maxQuantity: number; // Based on stock
}

export interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  lastUpdated: Date;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  hasItems: boolean;
}

// Constants
const CART_STORAGE_KEY = "bakewind_cart";
const TAX_RATE = 0.08; // 8% tax rate

// Initialize cart from localStorage or empty state
function loadCartFromStorage(): CartStore {
  if (typeof localStorage === "undefined") {
    return {
      items: [],
      isOpen: false,
      lastUpdated: new Date(),
    };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated),
      };
    }
  } catch (error) {
    console.warn("Failed to load cart from storage:", error);
  }

  return {
    items: [],
    isOpen: false,
    lastUpdated: new Date(),
  };
}

// Save cart to localStorage
function saveCartToStorage(cart: CartStore): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Failed to save cart to storage:", error);
  }
}

// Create reactive cart store
const [cartState, setCartState] = createSignal<CartStore>(loadCartFromStorage());

// Auto-save to localStorage when cart changes
createEffect(() => {
  const current = cartState();
  saveCartToStorage(current);
});

// Computed values
export const cartSummary = createMemo((): CartSummary => {
  const items = cartState().items;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return {
    itemCount,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    hasItems: itemCount > 0,
  };
});

// Cart actions
export const cartActions = {
  // Add item to cart
  addItem: (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    allergens: string[];
    stock?: number;
  }, quantity: number = 1) => {
    setCartState(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.id === product.id);
      const maxQuantity = product.stock || 99;

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...prev.items];
        const currentQuantity = updatedItems[existingItemIndex].quantity;
        const newQuantity = Math.min(currentQuantity + quantity, maxQuantity);

        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
        };

        return {
          ...prev,
          items: updatedItems,
          lastUpdated: new Date(),
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: Math.min(quantity, maxQuantity),
          image: product.image,
          category: product.category,
          allergens: product.allergens,
          maxQuantity,
        };

        return {
          ...prev,
          items: [...prev.items, newItem],
          lastUpdated: new Date(),
        };
      }
    });
  },

  // Remove item from cart
  removeItem: (productId: string) => {
    setCartState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== productId),
      lastUpdated: new Date(),
    }));
  },

  // Update item quantity
  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      cartActions.removeItem(productId);
      return;
    }

    setCartState(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            quantity: Math.min(quantity, item.maxQuantity),
          };
        }
        return item;
      });

      return {
        ...prev,
        items: updatedItems,
        lastUpdated: new Date(),
      };
    });
  },

  // Clear entire cart
  clearCart: () => {
    setCartState({
      items: [],
      isOpen: false,
      lastUpdated: new Date(),
    });
  },

  // Toggle cart sidebar
  toggleCart: () => {
    setCartState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  },

  // Open cart sidebar
  openCart: () => {
    setCartState(prev => ({
      ...prev,
      isOpen: true,
    }));
  },

  // Close cart sidebar
  closeCart: () => {
    setCartState(prev => ({
      ...prev,
      isOpen: false,
    }));
  },

  // Get item quantity by ID
  getItemQuantity: (productId: string): number => {
    const item = cartState().items.find(item => item.id === productId);
    return item?.quantity || 0;
  },

  // Check if item is in cart
  isInCart: (productId: string): boolean => {
    return cartState().items.some(item => item.id === productId);
  },

  // Get cart analytics
  getAnalytics: () => {
    const items = cartState().items;
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    const averageItemPrice = items.length > 0
      ? items.reduce((sum, item) => sum + item.price, 0) / items.length
      : 0;

    return {
      totalItems: cartSummary().itemCount,
      uniqueProducts: items.length,
      categoryCounts,
      averageItemPrice: Number(averageItemPrice.toFixed(2)),
      cartValue: cartSummary().subtotal,
    };
  },
};

// Export reactive cart state
export const cart = cartState;

// Utility functions
export const cartUtils = {
  // Format price as currency
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  // Get all allergens in cart
  getAllergens: (): string[] => {
    const allAllergens = cartState().items
      .flatMap(item => item.allergens)
      .filter((allergen, index, arr) => arr.indexOf(allergen) === index);

    return allAllergens.sort();
  },

  // Calculate estimated pickup time
  getEstimatedPickupTime: (): Date => {
    const now = new Date();
    const businessHours = {
      start: 6, // 6 AM
      end: 18,  // 6 PM
    };

    const currentHour = now.getHours();
    let pickupTime = new Date(now);

    if (currentHour < businessHours.start) {
      // Before business hours - ready at opening
      pickupTime.setHours(businessHours.start + 1, 0, 0, 0);
    } else if (currentHour >= businessHours.end - 2) {
      // Late in day - ready next morning
      pickupTime.setDate(pickupTime.getDate() + 1);
      pickupTime.setHours(businessHours.start + 1, 0, 0, 0);
    } else {
      // During business hours - ready in 1-2 hours
      pickupTime.setHours(currentHour + 2, 0, 0, 0);
    }

    return pickupTime;
  },

  // Export cart data (for backup/sharing)
  exportCart: (): string => {
    return JSON.stringify(cartState(), null, 2);
  },

  // Import cart data (from backup)
  importCart: (cartData: string): boolean => {
    try {
      const parsed = JSON.parse(cartData);
      if (parsed && Array.isArray(parsed.items)) {
        setCartState({
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated || new Date()),
        });
        return true;
      }
    } catch (error) {
      console.warn("Failed to import cart data:", error);
    }
    return false;
  },
};

// Hook for easy access to cart state and actions
export function useCart() {
  return {
    cart: cartState,
    summary: cartSummary,
    actions: cartActions,
    utils: cartUtils,
  };
}
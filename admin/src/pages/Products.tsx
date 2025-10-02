import { Component } from 'solid-js';

const Products: Component = () => {
  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Products</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage bakery products and pricing
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
        <div class="text-center">
          <div class="text-6xl mb-4">🍰</div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Products Catalog
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Product catalog management will be implemented here. Features will include product details,
            pricing, categories, and recipe associations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Products;

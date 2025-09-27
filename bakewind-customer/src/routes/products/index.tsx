import { Title, Meta } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { For, Suspense, createSignal, Show } from "solid-js";
import "../../styles/globals.css";

// Types for our products
interface Product {
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
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Mock data for now - this will be replaced with actual API calls
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Artisan Sourdough Bread",
    description: "Traditional sourdough made with our 100-year-old starter. Crispy crust, tender crumb, and that distinctive tangy flavor.",
    price: 4.50,
    category: "Bread",
    images: ["/assets/products/sourdough.jpg"],
    isAvailable: true,
    allergens: ["Gluten"],
    tags: ["Popular", "Traditional"],
    stock: 12
  },
  {
    id: "2",
    name: "Butter Croissants (6-pack)",
    description: "Flaky, buttery croissants made with French butter and laminated dough. Perfect for breakfast or afternoon treats.",
    price: 12.00,
    category: "Pastries",
    images: ["/assets/products/croissants.jpg"],
    isAvailable: true,
    allergens: ["Gluten", "Dairy", "Eggs"],
    tags: ["French", "Buttery"],
    stock: 8
  },
  {
    id: "3",
    name: "Chocolate Chip Cookies",
    description: "Classic chocolate chip cookies with Belgian chocolate chips. Soft and chewy texture with a hint of vanilla.",
    price: 2.50,
    category: "Cookies",
    images: ["/assets/products/cookies.jpg"],
    isAvailable: true,
    allergens: ["Gluten", "Dairy", "Eggs"],
    tags: ["Sweet", "Classic"],
    stock: 24
  },
  {
    id: "4",
    name: "Apple Cinnamon Pie",
    description: "Fresh Granny Smith apples with warm cinnamon spice in our signature flaky pie crust. Served whole, serves 8.",
    price: 18.00,
    category: "Pies",
    images: ["/assets/products/apple-pie.jpg"],
    isAvailable: true,
    allergens: ["Gluten", "Dairy"],
    tags: ["Seasonal", "Homestyle"],
    stock: 4
  },
  {
    id: "5",
    name: "Multigrain Seeded Bread",
    description: "Hearty bread packed with sunflower seeds, pumpkin seeds, and multiple grains. Nutritious and flavorful.",
    price: 5.25,
    category: "Bread",
    images: ["/assets/products/multigrain.jpg"],
    isAvailable: true,
    allergens: ["Gluten", "Seeds"],
    tags: ["Healthy", "Seeded"],
    stock: 6
  },
  {
    id: "6",
    name: "Lemon Tart",
    description: "Bright, tangy lemon curd in a crisp pastry shell, topped with a light meringue. Individual serving size.",
    price: 4.75,
    category: "Tarts",
    images: ["/assets/products/lemon-tart.jpg"],
    isAvailable: false,
    allergens: ["Gluten", "Dairy", "Eggs"],
    tags: ["Citrus", "Individual"],
    stock: 0
  }
];

// Server-side data fetching function
async function fetchProducts(category?: string, search?: string): Promise<ProductsResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  let filtered = mockProducts;

  if (category && category !== "all") {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower)
    );
  }

  return {
    data: filtered,
    meta: {
      total: filtered.length,
      page: 1,
      limit: 50,
      totalPages: 1
    }
  };
}

// Filter and Search Components
function ProductFilters(props: {
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  selectedCategory: string;
}) {
  const categories = ["All", "Bread", "Pastries", "Cookies", "Pies", "Tarts"];

  return (
    <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search */}
        <div>
          <label class="label">Search Products</label>
          <input
            type="text"
            placeholder="Search for breads, pastries, etc..."
            class="input"
            onInput={(e) => props.onSearchChange(e.currentTarget.value)}
          />
        </div>

        {/* Category Filter */}
        <div>
          <label class="label">Category</label>
          <select
            class="input"
            value={props.selectedCategory}
            onChange={(e) => props.onCategoryChange(e.currentTarget.value)}
          >
            <For each={categories}>
              {(category) => (
                <option value={category.toLowerCase()}>{category}</option>
              )}
            </For>
          </select>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard(props: { product: Product; onAddToCart: (product: Product) => void }) {
  const { product } = props;

  return (
    <div class="product-card">
      <div class="relative mb-4">
        <img
          src={product.images[0] || "/assets/products/placeholder.jpg"}
          alt={product.name}
          class="w-full h-48 object-cover rounded-lg hover-brightness"
          loading="lazy"
        />
        <Show when={!product.isAvailable}>
          <div class="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-lg flex items-center justify-center">
            <span class="badge-error text-lg font-semibold">Out of Stock</span>
          </div>
        </Show>
        <Show when={product.tags?.includes("Popular")}>
          <div class="absolute top-2 left-2">
            <span class="badge-info">Popular</span>
          </div>
        </Show>
      </div>

      <div class="space-y-3">
        <div>
          <h3 class="text-lg font-semibold text-bakery-brown mb-1">{product.name}</h3>
          <p class="text-gray-600 text-sm line-clamp-2">{product.description}</p>
        </div>

        <div class="flex items-center justify-between">
          <span class="price-display">${product.price.toFixed(2)}</span>
          <span class="text-sm text-gray-500">{product.category}</span>
        </div>

        <Show when={product.allergens.length > 0}>
          <div class="flex flex-wrap gap-1">
            <span class="text-xs text-gray-500">Contains:</span>
            <For each={product.allergens}>
              {(allergen) => (
                <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {allergen}
                </span>
              )}
            </For>
          </div>
        </Show>

        <Show when={product.isAvailable && product.stock !== undefined}>
          <div class="text-xs text-gray-500">
            {product.stock! > 0 ? `${product.stock} available` : "Limited stock"}
          </div>
        </Show>

        <button
          class={`btn w-full justify-center ${
            product.isAvailable ? "btn-primary" : "btn bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!product.isAvailable}
          onClick={() => product.isAvailable && props.onAddToCart(product)}
        >
          <Show
            when={product.isAvailable}
            fallback="Out of Stock"
          >
            Add to Cart
          </Show>
        </button>
      </div>
    </div>
  );
}

// Loading Component
function ProductsLoading() {
  return (
    <div class="content-grid">
      <For each={Array(6).fill(0)}>
        {() => (
          <div class="card animate-pulse">
            <div class="bg-gray-300 h-48 rounded-lg mb-4"></div>
            <div class="space-y-3">
              <div class="bg-gray-300 h-4 rounded w-3/4"></div>
              <div class="bg-gray-300 h-3 rounded w-full"></div>
              <div class="bg-gray-300 h-3 rounded w-2/3"></div>
              <div class="bg-gray-300 h-8 rounded"></div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

// Main Products Page Component
export default function Products() {
  const [selectedCategory, setSelectedCategory] = createSignal("all");
  const [searchTerm, setSearchTerm] = createSignal("");

  // Server-side data fetching with SolidStart
  const products = createAsync(() =>
    fetchProducts(
      selectedCategory() === "all" ? undefined : selectedCategory(),
      searchTerm() || undefined
    )
  );

  const handleAddToCart = (product: Product) => {
    // This will be implemented with the cart store
    console.log("Adding to cart:", product);
    // TODO: Integrate with cart store
  };

  return (
    <>
      <Title>Our Products - BakeWind Bakery</Title>
      <Meta name="description" content="Browse our selection of fresh baked breads, pastries, cookies, pies, and custom cakes. All made with premium ingredients and traditional methods." />

      <main class="min-h-screen bg-bakery-cream">
        {/* Header */}
        <section class="bg-gradient-to-r from-bakery-brown to-bakery-crust text-white section-padding">
          <div class="max-w-content container-padding">
            <div class="text-center">
              <h1 class="text-4xl md:text-5xl font-display font-bold mb-4">
                Our Fresh Baked Products
              </h1>
              <p class="text-xl text-bakery-cream max-w-2xl mx-auto">
                Discover our daily selection of artisan breads, delicate pastries, and sweet treats.
                All baked fresh every morning with the finest ingredients.
              </p>
            </div>
          </div>
        </section>

        {/* Filters and Products */}
        <section class="section-padding">
          <div class="max-w-content container-padding">
            <ProductFilters
              selectedCategory={selectedCategory()}
              onCategoryChange={setSelectedCategory}
              onSearchChange={setSearchTerm}
            />

            <Suspense fallback={<ProductsLoading />}>
              <Show
                when={products()?.data.length > 0}
                fallback={
                  <div class="text-center py-12">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                    <p class="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                }
              >
                <div class="content-grid">
                  <For each={products()?.data}>
                    {(product) => (
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    )}
                  </For>
                </div>

                <Show when={products()?.data.length! > 0}>
                  <div class="text-center mt-12">
                    <p class="text-gray-600">
                      Showing {products()?.data.length} of {products()?.meta.total} products
                    </p>
                  </div>
                </Show>
              </Show>
            </Suspense>
          </div>
        </section>

        {/* CTA Section */}
        <section class="bg-white section-padding">
          <div class="max-w-content container-padding text-center">
            <h2 class="text-3xl font-display font-bold text-bakery-brown mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We take custom orders for special occasions. Contact us to discuss your needs and we'll create something special just for you.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" class="btn-primary text-lg px-8 py-3">
                Contact Us
              </a>
              <a href="/custom-orders" class="btn-outline text-lg px-8 py-3">
                Custom Orders
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
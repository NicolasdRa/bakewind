import { Title, Meta } from "@solidjs/meta";
import { createAsync, useParams, A } from "@solidjs/router";
import { Show, createSignal, For } from "solid-js";
import "../../styles/globals.css";

// Types
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

// Mock detailed product data
const mockDetailedProducts: { [key: string]: Product } = {
  "1": {
    id: "1",
    name: "Artisan Sourdough Bread",
    description: "Traditional sourdough made with our 100-year-old starter. Crispy crust, tender crumb, and that distinctive tangy flavor that develops over our 24-hour fermentation process. This bread embodies the essence of traditional bread-making with its complex flavor profile and perfect texture.",
    price: 4.50,
    category: "Bread",
    images: [
      "/assets/products/sourdough-1.jpg",
      "/assets/products/sourdough-2.jpg",
      "/assets/products/sourdough-3.jpg"
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
  "2": {
    id: "2",
    name: "Butter Croissants (6-pack)",
    description: "Flaky, buttery croissants made with French butter and laminated dough. Each croissant is hand-rolled and shaped, then proofed overnight for maximum flavor development. The result is a perfectly crispy exterior with dozens of delicate, buttery layers inside.",
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
  }
};

// Server-side function to fetch product details
async function fetchProductById(id: string): Promise<Product | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  return mockDetailedProducts[id] || null;
}

// Related products function
async function fetchRelatedProducts(category: string, excludeId: string): Promise<Product[]> {
  // Simulate fetching related products from the same category
  await new Promise(resolve => setTimeout(resolve, 150));

  return Object.values(mockDetailedProducts)
    .filter(p => p.category === category && p.id !== excludeId)
    .slice(0, 3);
}

// Quantity Selector Component
function QuantitySelector(props: {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  max: number;
}) {
  return (
    <div class="flex items-center space-x-3">
      <label class="font-medium text-gray-700">Quantity:</label>
      <div class="flex items-center border border-gray-300 rounded-md">
        <button
          class="px-3 py-2 hover:bg-gray-100 disabled:opacity-50"
          disabled={props.quantity <= 1}
          onClick={() => props.onQuantityChange(Math.max(1, props.quantity - 1))}
        >
          -
        </button>
        <span class="px-4 py-2 border-l border-r border-gray-300 min-w-[3rem] text-center">
          {props.quantity}
        </span>
        <button
          class="px-3 py-2 hover:bg-gray-100 disabled:opacity-50"
          disabled={props.quantity >= props.max}
          onClick={() => props.onQuantityChange(Math.min(props.max, props.quantity + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

// Product Gallery Component
function ProductGallery(props: { images: string[]; productName: string }) {
  const [selectedImage, setSelectedImage] = createSignal(0);

  return (
    <div class="space-y-4">
      {/* Main Image */}
      <div class="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <img
          src={props.images[selectedImage()] || "/assets/products/placeholder.jpg"}
          alt={props.productName}
          class="w-full h-full object-cover hover-scale"
        />
      </div>

      {/* Thumbnail Images */}
      <Show when={props.images.length > 1}>
        <div class="grid grid-cols-4 gap-2">
          <For each={props.images}>
            {(image, index) => (
              <button
                class={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                  selectedImage() === index()
                    ? "border-primary-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedImage(index())}
              >
                <img
                  src={image}
                  alt={`${props.productName} view ${index() + 1}`}
                  class="w-full h-full object-cover"
                />
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

// Nutritional Info Component
function NutritionalInfo(props: { nutrition: Product['nutritionalInfo'] }) {
  return (
    <Show when={props.nutrition}>
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold text-gray-800 mb-3">Nutritional Information (per 100g)</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="flex justify-between">
            <span>Calories:</span>
            <span class="font-medium">{props.nutrition!.calories}</span>
          </div>
          <div class="flex justify-between">
            <span>Protein:</span>
            <span class="font-medium">{props.nutrition!.protein}</span>
          </div>
          <div class="flex justify-between">
            <span>Carbohydrates:</span>
            <span class="font-medium">{props.nutrition!.carbs}</span>
          </div>
          <div class="flex justify-between">
            <span>Fat:</span>
            <span class="font-medium">{props.nutrition!.fat}</span>
          </div>
          <div class="flex justify-between col-span-2">
            <span>Fiber:</span>
            <span class="font-medium">{props.nutrition!.fiber}</span>
          </div>
        </div>
      </div>
    </Show>
  );
}

// Product Detail Page Component
export default function ProductDetail() {
  const params = useParams();
  const [quantity, setQuantity] = createSignal(1);

  // Fetch product data
  const product = createAsync(() => fetchProductById(params.id));
  const relatedProducts = createAsync(() => {
    const prod = product();
    return prod ? fetchRelatedProducts(prod.category, prod.id) : [];
  });

  const handleAddToCart = () => {
    const prod = product();
    if (prod && prod.isAvailable) {
      console.log(`Adding ${quantity()} of ${prod.name} to cart`);
      // TODO: Integrate with cart store
    }
  };

  const totalPrice = () => {
    const prod = product();
    return prod ? (prod.price * quantity()).toFixed(2) : "0.00";
  };

  return (
    <>
      <Show
        when={product()}
        fallback={
          <>
            <Title>Product Not Found - BakeWind Bakery</Title>
            <Meta name="description" content="The requested product could not be found." />
          </>
        }
      >
        <Title>{product()!.name} - BakeWind Bakery</Title>
        <Meta name="description" content={product()!.description} />
      </Show>

      <main class="min-h-screen bg-bakery-cream">
        <Show
          when={product()}
          fallback={
            <div class="section-padding">
              <div class="max-w-content container-padding text-center">
                <h1 class="text-3xl font-bold text-bakery-brown mb-4">Product Not Found</h1>
                <p class="text-gray-600 mb-8">
                  The product you're looking for doesn't exist or has been removed.
                </p>
                <A href="/products" class="btn-primary">
                  Browse All Products
                </A>
              </div>
            </div>
          }
        >
          {(prod) => (
            <>
              {/* Breadcrumb */}
              <section class="bg-white border-b border-gray-200">
                <div class="max-w-content container-padding py-4">
                  <nav class="breadcrumb">
                    <A href="/" class="hover:text-primary-600">Home</A>
                    <span class="breadcrumb-separator">/</span>
                    <A href="/products" class="hover:text-primary-600">Products</A>
                    <span class="breadcrumb-separator">/</span>
                    <A href={`/products?category=${prod.category.toLowerCase()}`} class="hover:text-primary-600">
                      {prod.category}
                    </A>
                    <span class="breadcrumb-separator">/</span>
                    <span class="text-gray-900">{prod.name}</span>
                  </nav>
                </div>
              </section>

              {/* Product Detail */}
              <section class="section-padding">
                <div class="max-w-content container-padding">
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Product Images */}
                    <div>
                      <ProductGallery images={prod.images} productName={prod.name} />
                    </div>

                    {/* Product Info */}
                    <div class="space-y-6">
                      <div>
                        <div class="flex items-center gap-2 mb-2">
                          <span class="badge-info">{prod.category}</span>
                          <Show when={prod.tags?.includes("Popular")}>
                            <span class="badge bg-orange-100 text-orange-800">Popular</span>
                          </Show>
                        </div>
                        <h1 class="text-3xl md:text-4xl font-display font-bold text-bakery-brown mb-4">
                          {prod.name}
                        </h1>
                        <p class="text-lg text-gray-600 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>

                      {/* Price and Availability */}
                      <div class="border-t border-gray-200 pt-6">
                        <div class="flex items-center justify-between mb-4">
                          <span class="text-3xl font-bold text-primary-700">
                            ${prod.price.toFixed(2)}
                          </span>
                          <Show
                            when={prod.isAvailable}
                            fallback={<span class="badge-error">Out of Stock</span>}
                          >
                            <div class="text-right">
                              <span class="badge-success">In Stock</span>
                              <Show when={prod.stock !== undefined}>
                                <div class="text-sm text-gray-500 mt-1">
                                  {prod.stock! > 5 ? "In Stock" : `Only ${prod.stock} left`}
                                </div>
                              </Show>
                            </div>
                          </Show>
                        </div>

                        {/* Quantity and Add to Cart */}
                        <Show when={prod.isAvailable}>
                          <div class="space-y-4">
                            <QuantitySelector
                              quantity={quantity()}
                              onQuantityChange={setQuantity}
                              max={prod.stock || 10}
                            />

                            <div class="flex items-center justify-between text-lg font-semibold">
                              <span>Total:</span>
                              <span class="text-primary-700">${totalPrice()}</span>
                            </div>

                            <button
                              class="btn-primary w-full text-lg py-3 justify-center"
                              onClick={handleAddToCart}
                            >
                              Add to Cart - ${totalPrice()}
                            </button>
                          </div>
                        </Show>
                      </div>

                      {/* Allergens */}
                      <Show when={prod.allergens.length > 0}>
                        <div class="border-t border-gray-200 pt-6">
                          <h3 class="font-semibold text-gray-800 mb-2">Allergen Information</h3>
                          <div class="flex flex-wrap gap-2">
                            <For each={prod.allergens}>
                              {(allergen) => (
                                <span class="badge bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  Contains {allergen}
                                </span>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>
              </section>

              {/* Additional Information */}
              <section class="bg-white section-padding">
                <div class="max-w-content container-padding">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Ingredients */}
                    <Show when={prod.ingredients}>
                      <div>
                        <h3 class="text-xl font-semibold text-bakery-brown mb-4">Ingredients</h3>
                        <ul class="space-y-1 text-gray-600">
                          <For each={prod.ingredients}>
                            {(ingredient) => <li>• {ingredient}</li>}
                          </For>
                        </ul>
                      </div>
                    </Show>

                    {/* Baking & Storage Info */}
                    <div class="space-y-4">
                      <Show when={prod.bakingTime}>
                        <div>
                          <h3 class="font-semibold text-gray-800 mb-2">Baking Schedule</h3>
                          <p class="text-gray-600 text-sm">{prod.bakingTime}</p>
                        </div>
                      </Show>

                      <Show when={prod.storageInstructions}>
                        <div>
                          <h3 class="font-semibold text-gray-800 mb-2">Storage Instructions</h3>
                          <p class="text-gray-600 text-sm">{prod.storageInstructions}</p>
                        </div>
                      </Show>
                    </div>

                    {/* Nutritional Info */}
                    <NutritionalInfo nutrition={prod.nutritionalInfo} />
                  </div>
                </div>
              </section>

              {/* Related Products */}
              <Show when={relatedProducts()?.length > 0}>
                <section class="section-padding bg-bakery-cream">
                  <div class="max-w-content container-padding">
                    <h2 class="text-3xl font-display font-bold text-bakery-brown mb-8 text-center">
                      More {prod.category}
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <For each={relatedProducts()}>
                        {(relatedProduct) => (
                          <A
                            href={`/products/${relatedProduct.id}`}
                            class="product-card block"
                          >
                            <img
                              src={relatedProduct.images[0] || "/assets/products/placeholder.jpg"}
                              alt={relatedProduct.name}
                              class="w-full h-48 object-cover rounded-lg mb-4"
                            />
                            <h3 class="font-semibold text-bakery-brown mb-2">
                              {relatedProduct.name}
                            </h3>
                            <p class="text-gray-600 text-sm mb-2 line-clamp-2">
                              {relatedProduct.description}
                            </p>
                            <div class="flex justify-between items-center">
                              <span class="price-display">${relatedProduct.price.toFixed(2)}</span>
                              <span class="text-sm text-primary-600">View Details →</span>
                            </div>
                          </A>
                        )}
                      </For>
                    </div>
                  </div>
                </section>
              </Show>
            </>
          )}
        </Show>
      </main>
    </>
  );
}
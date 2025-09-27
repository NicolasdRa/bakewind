import { Title, Meta } from "@solidjs/meta";
import "../styles/globals.css";

export default function Home() {
  return (
    <>
      <Title>BakeWind Bakery - Fresh Baked Goods & Custom Orders</Title>
      <Meta name="description" content="Welcome to BakeWind Bakery! Discover our fresh baked breads, artisan pastries, and custom cakes. Order online for pickup or delivery." />

      <main class="min-h-screen bg-gradient-to-br from-bakery-cream via-bakery-wheat to-bakery-crust">
        {/* Hero Section */}
        <section class="section-padding">
          <div class="max-w-content container-padding">
            <div class="text-center">
              <h1 class="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-bakery-brown mb-6 animate-fade-in">
                Welcome to <span class="gradient-text">BakeWind</span>
              </h1>
              <p class="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto text-balance animate-slide-up">
                Your local artisan bakery crafting fresh breads, delicate pastries, and custom celebration cakes with traditional methods and premium ingredients.
              </p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
                <a href="/products" class="btn-primary text-lg px-8 py-3">
                  Shop Now
                </a>
                <a href="/about" class="btn-outline text-lg px-8 py-3">
                  Our Story
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section class="section-padding bg-white/50">
          <div class="max-w-content container-padding">
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-4xl font-display font-bold text-bakery-brown mb-4">
                Why Choose BakeWind?
              </h2>
              <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                We're committed to bringing you the finest baked goods with time-honored techniques and the freshest ingredients.
              </p>
            </div>

            <div class="content-grid">
              <div class="card text-center group hover-scale">
                <div class="text-4xl mb-4 animate-bounce-gentle">🍞</div>
                <h3 class="text-xl font-semibold text-bakery-brown mb-2">Fresh Daily</h3>
                <p class="text-gray-600">All our breads and pastries are baked fresh every morning using traditional techniques.</p>
              </div>

              <div class="card text-center group hover-scale">
                <div class="text-4xl mb-4 animate-bounce-gentle" style="animation-delay: 0.2s;">🌾</div>
                <h3 class="text-xl font-semibold text-bakery-brown mb-2">Premium Ingredients</h3>
                <p class="text-gray-600">We source only the finest organic flours, local dairy, and seasonal ingredients.</p>
              </div>

              <div class="card text-center group hover-scale">
                <div class="text-4xl mb-4 animate-bounce-gentle" style="animation-delay: 0.4s;">🎂</div>
                <h3 class="text-xl font-semibold text-bakery-brown mb-2">Custom Orders</h3>
                <p class="text-gray-600">Special occasion? We create beautiful custom cakes and pastries for your celebrations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section class="section-padding bg-bakery-brown text-white">
          <div class="max-w-content container-padding text-center">
            <h2 class="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Order?
            </h2>
            <p class="text-xl mb-8 text-bakery-cream">
              Browse our selection of fresh baked goods and place your order online for convenient pickup or delivery.
            </p>
            <a href="/products" class="inline-flex items-center btn bg-white text-bakery-brown hover:bg-bakery-cream text-lg px-8 py-3">
              View Our Products
              <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </a>
          </div>
        </section>

        {/* Store Hours */}
        <section class="section-padding bg-white/80">
          <div class="max-w-content container-padding">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 class="text-3xl font-display font-bold text-bakery-brown mb-6">
                  Visit Our Bakery
                </h2>
                <div class="space-y-4">
                  <div class="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span class="font-medium">Monday - Friday</span>
                    <span class="text-primary-600">6:00 AM - 6:00 PM</span>
                  </div>
                  <div class="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span class="font-medium">Saturday</span>
                    <span class="text-primary-600">7:00 AM - 5:00 PM</span>
                  </div>
                  <div class="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span class="font-medium">Sunday</span>
                    <span class="text-primary-600">8:00 AM - 3:00 PM</span>
                  </div>
                </div>
                <div class="mt-6 p-4 bg-primary-50 rounded-lg">
                  <h3 class="font-semibold text-primary-800 mb-2">📍 Location</h3>
                  <p class="text-primary-700">123 Baker Street, Downtown, CA 90210</p>
                  <p class="text-primary-700">📞 +1-555-BAKEWIND</p>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-semibold text-bakery-brown mb-4">Today's Specials</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span>Sourdough Bread</span>
                    <span class="price-display">$4.50</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span>Croissants (6-pack)</span>
                    <span class="price-display">$12.00</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span>Chocolate Chip Cookies</span>
                    <span class="price-display">$2.50</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Apple Pie (whole)</span>
                    <span class="price-display">$18.00</span>
                  </div>
                </div>
                <a href="/products" class="btn-primary w-full mt-4 justify-center">
                  See All Products
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
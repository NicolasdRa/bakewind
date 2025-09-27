import { Title, Meta } from "@solidjs/meta";
import { createSignal, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { useCart } from "../../stores/cart";
import "../../styles/globals.css";

// Order confirmation interface
interface ConfirmedOrder {
  orderNumber: string;
  estimatedReady: string;
  total: number;
  deliveryType: "pickup" | "delivery";
  customerEmail: string;
}

export default function CheckoutConfirmation() {
  const { actions } = useCart();
  const [order, setOrder] = createSignal<ConfirmedOrder | null>(null);

  onMount(() => {
    // Clear the cart after successful order
    actions.clearCart();

    // Simulate order data - in real app this would come from navigation state or API
    setOrder({
      orderNumber: `BW${Date.now().toString().slice(-6)}`,
      estimatedReady: "45 minutes",
      total: 27.49,
      deliveryType: "pickup",
      customerEmail: "customer@example.com",
    });
  });

  const orderData = order();

  return (
    <>
      <Title>Order Confirmed - BakeWind Bakery</Title>
      <Meta name="description" content="Your order has been confirmed! Thank you for choosing BakeWind Bakery." />

      <main class="min-h-screen bg-bakery-cream">
        <section class="section-padding">
          <div class="max-w-2xl mx-auto container-padding text-center">
            {/* Success Icon */}
            <div class="mb-8">
              <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 class="text-4xl font-display font-bold text-bakery-brown mb-2">
                Order Confirmed!
              </h1>
              <p class="text-lg text-gray-600">
                Thank you for your order. We're preparing your delicious baked goods!
              </p>
            </div>

            {/* Order Details */}
            <div class="bg-white rounded-lg shadow-md p-8 text-left mb-8">
              <div class="border-b border-gray-200 pb-4 mb-6">
                <h2 class="text-2xl font-semibold text-bakery-brown mb-2">
                  Order Details
                </h2>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Order Number:</span>
                  <span class="font-mono text-lg font-semibold text-primary-600">
                    #{orderData?.orderNumber}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 class="font-semibold text-gray-800 mb-3">Pickup Information</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Method:</span>
                      <span class="capitalize font-medium">
                        {orderData?.deliveryType === "pickup" ? "Store Pickup" : "Delivery"}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Estimated Ready:</span>
                      <span class="font-medium text-green-600">
                        {orderData?.estimatedReady}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Location:</span>
                      <span class="font-medium">BakeWind Bakery</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 class="font-semibold text-gray-800 mb-3">Order Summary</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Total Amount:</span>
                      <span class="font-semibold text-lg text-primary-600">
                        ${orderData?.total.toFixed(2)}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Payment:</span>
                      <span class="font-medium text-green-600">Confirmed</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-semibold text-blue-800 mb-2">What's Next?</h3>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• You'll receive an email confirmation at {orderData?.customerEmail}</li>
                  <li>• We'll send you a text when your order is ready</li>
                  <li>• Bring your order number for quick pickup</li>
                  <li>• Our bakery is open daily from 6 AM to 6 PM</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 class="text-xl font-semibold text-bakery-brown mb-4">
                Bakery Location & Contact
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h3 class="font-semibold text-gray-800 mb-2">Address</h3>
                  <p class="text-gray-600 text-sm">
                    123 Bakery Lane<br />
                    San Francisco, CA 94102<br />
                    United States
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800 mb-2">Contact</h3>
                  <p class="text-gray-600 text-sm">
                    Phone: (555) 123-BAKE<br />
                    Email: orders@bakewind.com<br />
                    Hours: 6 AM - 6 PM Daily
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <A href="/products" class="btn-primary px-8">
                Continue Shopping
              </A>
              <A href="/account/orders" class="btn-outline px-8">
                View Order History
              </A>
            </div>

            {/* Footer Message */}
            <div class="mt-12 text-center">
              <p class="text-gray-600 text-sm mb-2">
                Questions about your order?
              </p>
              <p class="text-gray-600 text-sm">
                Call us at <a href="tel:555-123-2253" class="text-primary-600 hover:underline">(555) 123-BAKE</a> or
                email <a href="mailto:orders@bakewind.com" class="text-primary-600 hover:underline">orders@bakewind.com</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
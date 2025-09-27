import { Show, For, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useCart } from "../stores/cart";

// Cart Icon Component
export function CartIcon(props: { class?: string; onClick?: () => void }) {
  const { summary } = useCart();

  return (
    <button
      class={`relative p-2 text-gray-600 hover:text-bakery-brown transition-colors ${props.class || ""}`}
      onClick={props.onClick}
      aria-label="Open shopping cart"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.35 4.7a1 1 0 00.95 1.3h9.8a1 1 0 00.95-1.3L15 13M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6"
        />
      </svg>
      <Show when={summary().hasItems}>
        <span class="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {summary().itemCount}
        </span>
      </Show>
    </button>
  );
}

// Cart Item Component
function CartItemComponent(props: { item: any; onUpdateQuantity: (id: string, qty: number) => void; onRemove: (id: string) => void }) {
  const { item } = props;

  return (
    <div class="flex items-center space-x-4 py-4 border-b border-gray-200">
      <img
        src={item.image}
        alt={item.name}
        class="w-16 h-16 object-cover rounded-lg"
      />

      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
        <p class="text-sm text-gray-500">{item.category}</p>
        <p class="text-sm font-semibold text-primary-600">
          ${item.price.toFixed(2)} each
        </p>

        <Show when={item.allergens.length > 0}>
          <div class="flex flex-wrap gap-1 mt-1">
            <For each={item.allergens}>
              {(allergen) => (
                <span class="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                  {allergen}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>

      <div class="flex flex-col items-end space-y-2">
        <button
          class="text-gray-400 hover:text-red-500 transition-colors"
          onClick={() => props.onRemove(item.id)}
          aria-label="Remove item"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="flex items-center border border-gray-300 rounded">
          <button
            class="px-2 py-1 hover:bg-gray-100 text-sm"
            onClick={() => props.onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span class="px-3 py-1 text-sm border-l border-r border-gray-300">
            {item.quantity}
          </span>
          <button
            class="px-2 py-1 hover:bg-gray-100 text-sm"
            onClick={() => props.onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
          >
            +
          </button>
        </div>

        <div class="text-sm font-semibold text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

// Empty Cart Component
function EmptyCart() {
  return (
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🛒</div>
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
      <p class="text-gray-500 mb-6">Add some delicious baked goods to get started!</p>
      <A href="/products" class="btn-primary">
        Browse Products
      </A>
    </div>
  );
}

// Cart Summary Component
function CartSummary(props: { summary: any; onCheckout: () => void }) {
  const { summary } = props;

  return (
    <div class="border-t border-gray-200 pt-6 space-y-4">
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Subtotal ({summary.itemCount} items)</span>
          <span>${summary.subtotal.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>Tax</span>
          <span>${summary.tax.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
          <span>Total</span>
          <span class="text-primary-600">${summary.total.toFixed(2)}</span>
        </div>
      </div>

      <button
        class="btn-primary w-full text-lg py-3 justify-center"
        onClick={props.onCheckout}
      >
        Proceed to Checkout
      </button>

      <p class="text-xs text-gray-500 text-center">
        Free pickup available • Delivery starting at $2.99
      </p>
    </div>
  );
}

// Main Cart Sidebar Component
export function CartSidebar() {
  const { cart, summary, actions, utils } = useCart();
  const [isClosing, setIsClosing] = createSignal(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      actions.closeCart();
      setIsClosing(false);
    }, 150); // Animation duration
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleCheckout = () => {
    actions.closeCart();
    // Navigate to checkout - this will be implemented with routing
    window.location.href = "/checkout";
  };

  return (
    <Show when={cart().isOpen}>
      <div
        class={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isClosing() ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        />

        {/* Cart Panel */}
        <div
          class={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isClosing() ? "translate-x-full" : "translate-x-0"
          }`}
        >
          <div class="flex flex-col h-full">
            {/* Header */}
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">
                Shopping Cart
              </h2>
              <button
                class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={handleClose}
                aria-label="Close cart"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Content */}
            <div class="flex-1 overflow-y-auto">
              <Show
                when={summary().hasItems}
                fallback={<EmptyCart />}
              >
                <div class="p-6">
                  <For each={cart().items}>
                    {(item) => (
                      <CartItemComponent
                        item={item}
                        onUpdateQuantity={actions.updateQuantity}
                        onRemove={actions.removeItem}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* Footer with Summary */}
            <Show when={summary().hasItems}>
              <div class="p-6 bg-gray-50">
                <CartSummary
                  summary={summary()}
                  onCheckout={handleCheckout}
                />
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}

// Mini Cart Component (for header)
export function MiniCart() {
  const { summary, actions } = useCart();

  return (
    <div class="relative">
      <CartIcon onClick={actions.toggleCart} />

      <Show when={summary().hasItems}>
        <div class="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40 hidden group-hover:block">
          <div class="text-sm text-gray-600 mb-2">
            {summary().itemCount} item{summary().itemCount !== 1 ? 's' : ''} in cart
          </div>
          <div class="text-lg font-semibold text-primary-600 mb-3">
            Total: ${summary().total.toFixed(2)}
          </div>
          <div class="space-y-2">
            <button
              class="btn-primary w-full text-sm py-2 justify-center"
              onClick={() => {
                actions.openCart();
              }}
            >
              View Cart
            </button>
            <A href="/checkout" class="btn-outline w-full text-sm py-2 justify-center">
              Quick Checkout
            </A>
          </div>
        </div>
      </Show>
    </div>
  );
}

// Add to Cart Button Component
export function AddToCartButton(props: {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    allergens: string[];
    stock?: number;
  };
  quantity?: number;
  disabled?: boolean;
  class?: string;
  onSuccess?: () => void;
}) {
  const { actions } = useCart();
  const [isAdding, setIsAdding] = createSignal(false);

  const handleAddToCart = async () => {
    if (props.disabled || isAdding()) return;

    setIsAdding(true);

    // Add a small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    actions.addItem(props.product, props.quantity || 1);
    props.onSuccess?.();

    setIsAdding(false);
  };

  return (
    <button
      class={`btn transition-all duration-200 ${
        props.disabled
          ? "btn bg-gray-300 text-gray-500 cursor-not-allowed"
          : isAdding()
          ? "btn-primary opacity-75"
          : "btn-primary hover:shadow-md"
      } ${props.class || ""}`}
      disabled={props.disabled || isAdding()}
      onClick={handleAddToCart}
    >
      <Show
        when={!isAdding()}
        fallback={
          <div class="flex items-center">
            <div class="spinner w-4 h-4 mr-2"></div>
            Adding...
          </div>
        }
      >
        Add to Cart
      </Show>
    </button>
  );
}
import { Title, Meta } from "@solidjs/meta";
import { createSignal, createEffect, Show, For } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useCart } from "../../stores/cart";
import "../../styles/globals.css";

// Types for checkout
interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface DeliveryInfo {
  type: "pickup" | "delivery";
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
  };
  preferredTime: string;
  preferredDate: string;
}

interface PaymentInfo {
  method: "card" | "cash";
  cardInfo?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
}

interface CheckoutData {
  customer: CustomerInfo;
  delivery: DeliveryInfo;
  payment: PaymentInfo;
  specialInstructions?: string;
}

// Validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleaned) && cleaned.length >= 10;
};

const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

const validateZipCode = (zip: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

// Form validation state
interface ValidationErrors {
  [key: string]: string | undefined;
}

// Customer Information Step
function CustomerInfoStep(props: {
  data: CustomerInfo;
  errors: ValidationErrors;
  onUpdate: (field: keyof CustomerInfo, value: string) => void;
}) {
  return (
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-bakery-brown mb-4">Contact Information</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={props.data.firstName}
            onInput={(e) => props.onUpdate("firstName", e.currentTarget.value)}
            class={`input-field ${props.errors.firstName ? "border-red-500" : ""}`}
            placeholder="Enter your first name"
          />
          <Show when={props.errors.firstName}>
            <p class="text-red-500 text-sm mt-1">{props.errors.firstName}</p>
          </Show>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={props.data.lastName}
            onInput={(e) => props.onUpdate("lastName", e.currentTarget.value)}
            class={`input-field ${props.errors.lastName ? "border-red-500" : ""}`}
            placeholder="Enter your last name"
          />
          <Show when={props.errors.lastName}>
            <p class="text-red-500 text-sm mt-1">{props.errors.lastName}</p>
          </Show>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          value={props.data.email}
          onInput={(e) => props.onUpdate("email", e.currentTarget.value)}
          class={`input-field ${props.errors.email ? "border-red-500" : ""}`}
          placeholder="your.email@example.com"
        />
        <Show when={props.errors.email}>
          <p class="text-red-500 text-sm mt-1">{props.errors.email}</p>
        </Show>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          value={props.data.phone}
          onInput={(e) => props.onUpdate("phone", e.currentTarget.value)}
          class={`input-field ${props.errors.phone ? "border-red-500" : ""}`}
          placeholder="(555) 123-4567"
        />
        <Show when={props.errors.phone}>
          <p class="text-red-500 text-sm mt-1">{props.errors.phone}</p>
        </Show>
      </div>
    </div>
  );
}

// Delivery Information Step
function DeliveryInfoStep(props: {
  data: DeliveryInfo;
  errors: ValidationErrors;
  onUpdate: (updates: Partial<DeliveryInfo>) => void;
}) {
  const updateAddress = (field: string, value: string) => {
    props.onUpdate({
      address: {
        ...props.data.address!,
        [field]: value,
      },
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 17; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const displayTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
      slots.push({ value: time, label: displayTime });
    }
    return slots;
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const value = date.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      dates.push({ value, label });
    }

    return dates;
  };

  return (
    <div class="space-y-6">
      <h3 class="text-lg font-semibold text-bakery-brown mb-4">Delivery Options</h3>

      {/* Delivery Type Selection */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          How would you like to receive your order? *
        </label>
        <div class="space-y-3">
          <label class="flex items-center">
            <input
              type="radio"
              name="deliveryType"
              value="pickup"
              checked={props.data.type === "pickup"}
              onChange={() => props.onUpdate({ type: "pickup" })}
              class="mr-3"
            />
            <div>
              <span class="font-medium">Store Pickup</span>
              <span class="block text-sm text-gray-500">
                Free pickup at our bakery location
              </span>
            </div>
          </label>

          <label class="flex items-center">
            <input
              type="radio"
              name="deliveryType"
              value="delivery"
              checked={props.data.type === "delivery"}
              onChange={() => props.onUpdate({
                type: "delivery",
                address: props.data.address || {
                  street: "",
                  city: "",
                  state: "CA",
                  zipCode: "",
                },
              })}
              class="mr-3"
            />
            <div>
              <span class="font-medium">Local Delivery</span>
              <span class="block text-sm text-gray-500">
                $2.99 delivery fee within 10 miles
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Delivery Address (only if delivery selected) */}
      <Show when={props.data.type === "delivery"}>
        <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-800">Delivery Address</h4>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              value={props.data.address?.street || ""}
              onInput={(e) => updateAddress("street", e.currentTarget.value)}
              class={`input-field ${props.errors.street ? "border-red-500" : ""}`}
              placeholder="123 Main Street"
            />
            <Show when={props.errors.street}>
              <p class="text-red-500 text-sm mt-1">{props.errors.street}</p>
            </Show>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={props.data.address?.city || ""}
                onInput={(e) => updateAddress("city", e.currentTarget.value)}
                class={`input-field ${props.errors.city ? "border-red-500" : ""}`}
                placeholder="San Francisco"
              />
              <Show when={props.errors.city}>
                <p class="text-red-500 text-sm mt-1">{props.errors.city}</p>
              </Show>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code *
              </label>
              <input
                type="text"
                value={props.data.address?.zipCode || ""}
                onInput={(e) => updateAddress("zipCode", e.currentTarget.value)}
                class={`input-field ${props.errors.zipCode ? "border-red-500" : ""}`}
                placeholder="94102"
              />
              <Show when={props.errors.zipCode}>
                <p class="text-red-500 text-sm mt-1">{props.errors.zipCode}</p>
              </Show>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Delivery Instructions (Optional)
            </label>
            <textarea
              value={props.data.address?.instructions || ""}
              onInput={(e) => updateAddress("instructions", e.currentTarget.value)}
              class="input-field"
              rows="2"
              placeholder="Apartment number, gate code, etc."
            />
          </div>
        </div>
      </Show>

      {/* Pickup/Delivery Time */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Preferred Date *
          </label>
          <select
            value={props.data.preferredDate}
            onChange={(e) => props.onUpdate({ preferredDate: e.currentTarget.value })}
            class={`input-field ${props.errors.preferredDate ? "border-red-500" : ""}`}
          >
            <option value="">Select a date</option>
            <For each={generateDateOptions()}>
              {(option) => (
                <option value={option.value}>{option.label}</option>
              )}
            </For>
          </select>
          <Show when={props.errors.preferredDate}>
            <p class="text-red-500 text-sm mt-1">{props.errors.preferredDate}</p>
          </Show>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Preferred Time *
          </label>
          <select
            value={props.data.preferredTime}
            onChange={(e) => props.onUpdate({ preferredTime: e.currentTarget.value })}
            class={`input-field ${props.errors.preferredTime ? "border-red-500" : ""}`}
          >
            <option value="">Select a time</option>
            <For each={generateTimeSlots()}>
              {(option) => (
                <option value={option.value}>{option.label}</option>
              )}
            </For>
          </select>
          <Show when={props.errors.preferredTime}>
            <p class="text-red-500 text-sm mt-1">{props.errors.preferredTime}</p>
          </Show>
        </div>
      </div>
    </div>
  );
}

// Payment Information Step
function PaymentInfoStep(props: {
  data: PaymentInfo;
  errors: ValidationErrors;
  onUpdate: (updates: Partial<PaymentInfo>) => void;
}) {
  const updateCardInfo = (field: string, value: string) => {
    props.onUpdate({
      cardInfo: {
        ...props.data.cardInfo!,
        [field]: value,
      },
    });
  };

  return (
    <div class="space-y-6">
      <h3 class="text-lg font-semibold text-bakery-brown mb-4">Payment Information</h3>

      {/* Payment Method Selection */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Payment Method *
        </label>
        <div class="space-y-3">
          <label class="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={props.data.method === "card"}
              onChange={() => props.onUpdate({
                method: "card",
                cardInfo: props.data.cardInfo || {
                  number: "",
                  expiry: "",
                  cvv: "",
                  name: "",
                },
              })}
              class="mr-3"
            />
            <span class="font-medium">Credit/Debit Card</span>
          </label>

          <label class="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={props.data.method === "cash"}
              onChange={() => props.onUpdate({ method: "cash" })}
              class="mr-3"
            />
            <span class="font-medium">Cash on Pickup/Delivery</span>
          </label>
        </div>
      </div>

      {/* Card Information (only if card selected) */}
      <Show when={props.data.method === "card"}>
        <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-800">Card Details</h4>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name *
            </label>
            <input
              type="text"
              value={props.data.cardInfo?.name || ""}
              onInput={(e) => updateCardInfo("name", e.currentTarget.value)}
              class={`input-field ${props.errors.cardName ? "border-red-500" : ""}`}
              placeholder="Name as it appears on card"
            />
            <Show when={props.errors.cardName}>
              <p class="text-red-500 text-sm mt-1">{props.errors.cardName}</p>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Card Number *
            </label>
            <input
              type="text"
              value={props.data.cardInfo?.number || ""}
              onInput={(e) => {
                // Format card number with spaces
                const value = e.currentTarget.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                updateCardInfo("number", value);
              }}
              class={`input-field ${props.errors.cardNumber ? "border-red-500" : ""}`}
              placeholder="1234 5678 9012 3456"
              maxlength="19"
            />
            <Show when={props.errors.cardNumber}>
              <p class="text-red-500 text-sm mt-1">{props.errors.cardNumber}</p>
            </Show>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="text"
                value={props.data.cardInfo?.expiry || ""}
                onInput={(e) => {
                  // Format as MM/YY
                  const value = e.currentTarget.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
                  updateCardInfo("expiry", value);
                }}
                class={`input-field ${props.errors.cardExpiry ? "border-red-500" : ""}`}
                placeholder="MM/YY"
                maxlength="5"
              />
              <Show when={props.errors.cardExpiry}>
                <p class="text-red-500 text-sm mt-1">{props.errors.cardExpiry}</p>
              </Show>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                CVV *
              </label>
              <input
                type="text"
                value={props.data.cardInfo?.cvv || ""}
                onInput={(e) => updateCardInfo("cvv", e.currentTarget.value.replace(/\D/g, ''))}
                class={`input-field ${props.errors.cardCvv ? "border-red-500" : ""}`}
                placeholder="123"
                maxlength="4"
              />
              <Show when={props.errors.cardCvv}>
                <p class="text-red-500 text-sm mt-1">{props.errors.cardCvv}</p>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

// Order Summary Component
function OrderSummary(props: { deliveryType: "pickup" | "delivery" }) {
  const { summary } = useCart();
  const deliveryFee = props.deliveryType === "delivery" ? 2.99 : 0;
  const finalTotal = summary().total + deliveryFee;

  return (
    <div class="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h3 class="text-lg font-semibold text-bakery-brown mb-4">Order Summary</h3>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span>Subtotal ({summary().itemCount} items)</span>
          <span>${summary().subtotal.toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Tax</span>
          <span>${summary().tax.toFixed(2)}</span>
        </div>
        <Show when={props.deliveryType === "delivery"}>
          <div class="flex justify-between">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
        </Show>
        <div class="border-t border-gray-200 pt-2 mt-2">
          <div class="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span class="text-primary-600">${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="mt-4 text-xs text-gray-500">
        <p>• All prices include applicable taxes</p>
        <Show when={props.deliveryType === "pickup"}>
          <p>• Free pickup at our bakery location</p>
        </Show>
        <Show when={props.deliveryType === "delivery"}>
          <p>• Delivery available within 10 miles</p>
        </Show>
      </div>
    </div>
  );
}

// Main Checkout Page Component
export default function CheckoutPage() {
  const { summary, cart } = useCart();
  const navigate = useNavigate();

  // Form state
  const [currentStep, setCurrentStep] = createSignal(1);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [checkoutData, setCheckoutData] = createSignal<CheckoutData>({
    customer: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    delivery: {
      type: "pickup",
      preferredTime: "",
      preferredDate: "",
    },
    payment: {
      method: "card",
    },
  });
  const [errors, setErrors] = createSignal<ValidationErrors>({});

  // Redirect if cart is empty
  createEffect(() => {
    if (!summary().hasItems) {
      navigate("/products");
    }
  });

  // Validation functions for each step
  const validateCustomerInfo = (): boolean => {
    const data = checkoutData().customer;
    const newErrors: ValidationErrors = {};

    if (!validateRequired(data.firstName)) {
      newErrors.firstName = "First name is required";
    }
    if (!validateRequired(data.lastName)) {
      newErrors.lastName = "Last name is required";
    }
    if (!validateRequired(data.email)) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!validateRequired(data.phone)) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(data.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDeliveryInfo = (): boolean => {
    const data = checkoutData().delivery;
    const newErrors: ValidationErrors = {};

    if (!validateRequired(data.preferredDate)) {
      newErrors.preferredDate = "Please select a preferred date";
    }
    if (!validateRequired(data.preferredTime)) {
      newErrors.preferredTime = "Please select a preferred time";
    }

    if (data.type === "delivery" && data.address) {
      if (!validateRequired(data.address.street)) {
        newErrors.street = "Street address is required";
      }
      if (!validateRequired(data.address.city)) {
        newErrors.city = "City is required";
      }
      if (!validateRequired(data.address.zipCode)) {
        newErrors.zipCode = "ZIP code is required";
      } else if (!validateZipCode(data.address.zipCode)) {
        newErrors.zipCode = "Please enter a valid ZIP code";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentInfo = (): boolean => {
    const data = checkoutData().payment;
    const newErrors: ValidationErrors = {};

    if (data.method === "card" && data.cardInfo) {
      if (!validateRequired(data.cardInfo.name)) {
        newErrors.cardName = "Cardholder name is required";
      }
      if (!validateRequired(data.cardInfo.number.replace(/\s/g, ''))) {
        newErrors.cardNumber = "Card number is required";
      } else if (data.cardInfo.number.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = "Please enter a valid card number";
      }
      if (!validateRequired(data.cardInfo.expiry)) {
        newErrors.cardExpiry = "Expiry date is required";
      } else if (!/^\d{2}\/\d{2}$/.test(data.cardInfo.expiry)) {
        newErrors.cardExpiry = "Please enter a valid expiry date (MM/YY)";
      }
      if (!validateRequired(data.cardInfo.cvv)) {
        newErrors.cardCvv = "CVV is required";
      } else if (data.cardInfo.cvv.length < 3) {
        newErrors.cardCvv = "Please enter a valid CVV";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    let isValid = false;

    switch (currentStep()) {
      case 1:
        isValid = validateCustomerInfo();
        break;
      case 2:
        isValid = validateDeliveryInfo();
        break;
      case 3:
        isValid = validatePaymentInfo();
        break;
    }

    if (isValid && currentStep() < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep() > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Form updates
  const updateCustomerInfo = (field: keyof CustomerInfo, value: string) => {
    setCheckoutData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      },
    }));
  };

  const updateDeliveryInfo = (updates: Partial<DeliveryInfo>) => {
    setCheckoutData(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        ...updates,
      },
    }));
  };

  const updatePaymentInfo = (updates: Partial<PaymentInfo>) => {
    setCheckoutData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        ...updates,
      },
    }));
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validatePaymentInfo()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Integrate with actual API
      console.log("Order submitted:", {
        cart: cart().items,
        checkout: checkoutData(),
        summary: summary(),
      });

      // Navigate to confirmation page
      navigate("/checkout/confirmation");
    } catch (error) {
      console.error("Checkout failed:", error);
      // TODO: Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    "Contact Information",
    "Delivery Options",
    "Payment & Review"
  ];

  return (
    <>
      <Title>Checkout - BakeWind Bakery</Title>
      <Meta name="description" content="Complete your order at BakeWind Bakery" />

      <main class="min-h-screen bg-bakery-cream">
        {/* Header */}
        <section class="bg-white border-b border-gray-200">
          <div class="max-w-content container-padding py-6">
            <h1 class="text-3xl font-display font-bold text-bakery-brown mb-4">
              Checkout
            </h1>

            {/* Progress Steps */}
            <div class="flex items-center space-x-4">
              <For each={[1, 2, 3]}>
                {(step) => (
                  <div class="flex items-center">
                    <div class={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${currentStep() >= step
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-600"
                      }
                    `}>
                      {step}
                    </div>
                    <Show when={step < 3}>
                      <div class={`
                        w-12 h-0.5 mx-2
                        ${currentStep() > step ? "bg-primary-600" : "bg-gray-200"}
                      `} />
                    </Show>
                  </div>
                )}
              </For>
            </div>

            <div class="mt-2">
              <span class="text-sm text-gray-600">
                Step {currentStep()} of 3: {stepTitles[currentStep() - 1]}
              </span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section class="section-padding">
          <div class="max-w-content container-padding">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-md p-6">
                  <Show when={currentStep() === 1}>
                    <CustomerInfoStep
                      data={checkoutData().customer}
                      errors={errors()}
                      onUpdate={updateCustomerInfo}
                    />
                  </Show>

                  <Show when={currentStep() === 2}>
                    <DeliveryInfoStep
                      data={checkoutData().delivery}
                      errors={errors()}
                      onUpdate={updateDeliveryInfo}
                    />
                  </Show>

                  <Show when={currentStep() === 3}>
                    <PaymentInfoStep
                      data={checkoutData().payment}
                      errors={errors()}
                      onUpdate={updatePaymentInfo}
                    />
                  </Show>

                  {/* Navigation Buttons */}
                  <div class="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <Show
                      when={currentStep() > 1}
                      fallback={
                        <A href="/cart" class="btn-outline">
                          ← Back to Cart
                        </A>
                      }
                    >
                      <button
                        type="button"
                        onClick={prevStep}
                        class="btn-outline"
                      >
                        ← Previous Step
                      </button>
                    </Show>

                    <Show
                      when={currentStep() < 3}
                      fallback={
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting()}
                          class="btn-primary px-8"
                        >
                          <Show
                            when={!isSubmitting()}
                            fallback="Processing..."
                          >
                            Complete Order
                          </Show>
                        </button>
                      }
                    >
                      <button
                        type="button"
                        onClick={nextStep}
                        class="btn-primary"
                      >
                        Continue →
                      </button>
                    </Show>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div class="lg:col-span-1">
                <OrderSummary deliveryType={checkoutData().delivery.type} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
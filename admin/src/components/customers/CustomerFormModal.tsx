import { Component, createSignal, createEffect, Show } from "solid-js";
import {
  customersApi,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerType,
  PreferredContact,
} from "~/api/customers";

interface CustomerFormModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  customerType: CustomerType;
  companyName: string;
  taxId: string;
  preferredContact: PreferredContact | "";
  marketingOptIn: boolean;
  notes: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  customerType: "business",
  companyName: "",
  taxId: "",
  preferredContact: "",
  marketingOptIn: false,
  notes: "",
};

const CustomerFormModal: Component<CustomerFormModalProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [formData, setFormData] = createSignal<FormData>(initialFormData);

  // Derive mode from whether customer is provided
  const isEditMode = () => props.customer !== null;

  // Reset/populate form when modal opens or customer changes
  createEffect(() => {
    if (props.isOpen) {
      if (isEditMode() && props.customer) {
        setFormData({
          name: props.customer.name,
          email: props.customer.email || "",
          phone: props.customer.phone,
          addressLine1: props.customer.addressLine1 || "",
          addressLine2: props.customer.addressLine2 || "",
          city: props.customer.city || "",
          state: props.customer.state || "",
          zipCode: props.customer.zipCode || "",
          customerType: props.customer.customerType,
          companyName: props.customer.companyName || "",
          taxId: props.customer.taxId || "",
          preferredContact: props.customer.preferredContact || "",
          marketingOptIn: props.customer.marketingOptIn,
          notes: props.customer.notes || "",
        });
      } else {
        setFormData(initialFormData);
      }
      setError(null);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    console.log("[CustomerFormModal] Form submitted, isEditMode:", isEditMode());
    setLoading(true);
    setError(null);

    try {
      const data = formData();
      console.log("[CustomerFormModal] Form data:", data);

      if (!isEditMode()) {
        const createData: CreateCustomerDto = {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          zipCode: data.zipCode || undefined,
          customerType: data.customerType,
          companyName: data.companyName || undefined,
          taxId: data.taxId || undefined,
          preferredContact: data.preferredContact || undefined,
          marketingOptIn: data.marketingOptIn,
          notes: data.notes || undefined,
        };
        console.log("[CustomerFormModal] Creating customer with data:", createData);
        const result = await customersApi.createCustomer(createData);
        console.log("[CustomerFormModal] Customer created:", result);
      } else if (props.customer) {
        const updateData: UpdateCustomerDto = {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          customerType: data.customerType,
          companyName: data.companyName || null,
          taxId: data.taxId || null,
          preferredContact: data.preferredContact || null,
          marketingOptIn: data.marketingOptIn,
          notes: data.notes || null,
        };
        await customersApi.updateCustomer(props.customer.id, updateData);
      }

      console.log("[CustomerFormModal] Calling onSuccess and onClose");
      props.onSuccess();
      props.onClose();
    } catch (err: any) {
      console.error("[CustomerFormModal] Error:", err);
      setError(err?.data?.message || `Failed to ${isEditMode() ? "update" : "create"} customer`);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ "background-color": "rgba(0, 0, 0, 0.5)" }}
        onClick={props.onClose}
      >
        <div
          class="rounded-xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="p-6 border-b" style={{ "border-color": "var(--border-color)" }}>
            <h2 class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {isEditMode() ? "Edit Customer" : "Add Customer"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} class="p-6 space-y-6">
            <Show when={error()}>
              <div
                class="p-4 rounded-lg"
                style={{
                  "background-color": "var(--error-light)",
                  color: "var(--error-color)",
                }}
              >
                {error()}
              </div>
            </Show>

            {/* Customer Type */}
            <div>
              <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Customer Type *
              </label>
              <select
                required
                value={formData().customerType}
                onChange={(e) => updateField("customerType", e.currentTarget.value as CustomerType)}
                class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                style={{
                  "background-color": "var(--bg-primary)",
                  "border-color": "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="business">Business</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            {/* Business Info (conditional) */}
            <Show when={formData().customerType === "business"}>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData().companyName}
                    onInput={(e) => updateField("companyName", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData().taxId}
                    onInput={(e) => updateField("taxId", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="Tax ID for invoicing"
                  />
                </div>
              </div>
            </Show>

            {/* Contact Info */}
            <div class="space-y-4">
              <h3 class="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Contact Information
              </h3>

              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData().name}
                  onInput={(e) => updateField("name", e.currentTarget.value)}
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Full name"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData().email}
                    onInput={(e) => updateField("email", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData().phone}
                    onInput={(e) => updateField("phone", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div class="space-y-4">
              <h3 class="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Address
              </h3>

              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData().addressLine1}
                  onInput={(e) => updateField("addressLine1", e.currentTarget.value)}
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Street address"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData().addressLine2}
                  onInput={(e) => updateField("addressLine2", e.currentTarget.value)}
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Suite, unit, building, etc."
                />
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData().city}
                    onInput={(e) => updateField("city", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={formData().state}
                    onInput={(e) => updateField("state", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData().zipCode}
                    onInput={(e) => updateField("zipCode", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div class="space-y-4">
              <h3 class="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Preferences
              </h3>

              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Preferred Contact Method
                </label>
                <select
                  value={formData().preferredContact}
                  onChange={(e) => updateField("preferredContact", e.currentTarget.value as PreferredContact | "")}
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">No preference</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="marketingOptIn"
                  checked={formData().marketingOptIn}
                  onChange={(e) => updateField("marketingOptIn", e.currentTarget.checked)}
                  class="w-4 h-4 rounded border"
                  style={{ "border-color": "var(--border-color)" }}
                />
                <label for="marketingOptIn" class="text-sm" style={{ color: "var(--text-primary)" }}>
                  Opt in to marketing communications
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Notes
              </label>
              <textarea
                value={formData().notes}
                onInput={(e) => updateField("notes", e.currentTarget.value)}
                rows={3}
                class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 resize-none"
                style={{
                  "background-color": "var(--bg-primary)",
                  "border-color": "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                placeholder="Additional notes about this customer..."
              />
            </div>

            {/* Actions */}
            <div class="flex justify-end gap-3 pt-4 border-t" style={{ "border-color": "var(--border-color)" }}>
              <button
                type="button"
                onClick={props.onClose}
                disabled={loading()}
                class="px-6 py-2.5 rounded-lg border font-medium transition-all"
                style={{
                  "border-color": "var(--border-color)",
                  color: "var(--text-primary)",
                  "background-color": "transparent",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading()}
                class="px-6 py-2.5 rounded-lg font-medium text-white transition-all"
                style={{
                  "background-color": loading() ? "var(--primary-hover)" : "var(--primary-color)",
                  opacity: loading() ? 0.7 : 1,
                }}
              >
                {loading() ? "Saving..." : isEditMode() ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};

export default CustomerFormModal;

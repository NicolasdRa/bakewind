import { Component, Show } from "solid-js";
import { Customer } from "~/api/customers";
import Badge from "~/components/common/Badge";
import Button from "../common/Button";

interface CustomerDetailsModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: () => void;
}

const CustomerDetailsModal: Component<CustomerDetailsModalProps> = (props) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAddress = (customer: Customer) => {
    const parts = [
      customer.addressLine1,
      customer.addressLine2,
      [customer.city, customer.state, customer.zipCode].filter(Boolean).join(", "),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join("\n") : "No address provided";
  };

  const getCustomerTypeLabel = (type: string) => {
    return type === "business" ? "Business" : "Individual";
  };

  const getPreferredContactLabel = (method: string | null) => {
    if (!method) return "No preference";
    const labels: Record<string, string> = {
      email: "Email",
      phone: "Phone",
      text: "Text Message",
    };
    return labels[method] || method;
  };

  return (
    <Show when={props.isOpen && props.customer}>
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
          {/* Header */}
          <div
            class="p-6 border-b flex justify-between items-start"
            style={{ "border-color": "var(--border-color)" }}
          >
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h2 class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {props.customer!.name}
                </h2>
                <Badge
                  variant={props.customer!.status === "active" ? "success" : "neutral"}
                >
                  {props.customer!.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div class="flex items-center gap-2">
                <Badge color={props.customer!.customerType === "business" ? "blue" : "gray"}>
                  {getCustomerTypeLabel(props.customer!.customerType)}
                </Badge>
                <Show when={props.customer!.companyName}>
                  <span class="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {props.customer!.companyName}
                  </span>
                </Show>
              </div>
            </div>
            <Button
              onClick={props.onClose}
              variant="ghost"
              size="sm"
              class="p-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Content */}
          <div class="p-6 space-y-6">
            {/* Order Summary */}
            <div
              class="grid grid-cols-4 gap-4 p-4 rounded-lg"
              style={{ "background-color": "var(--bg-tertiary)" }}
            >
              <div class="text-center">
                <p class="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
                  {props.customer!.totalOrders}
                </p>
                <p class="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Total Orders
                </p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold" style={{ color: "var(--success-color)" }}>
                  {formatCurrency(props.customer!.totalSpent)}
                </p>
                <p class="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Total Spent
                </p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold" style={{ color: "var(--info-color)" }}>
                  {formatCurrency(props.customer!.averageOrderValue)}
                </p>
                <p class="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Avg. Order
                </p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold" style={{ color: "var(--warning-color)" }}>
                  {props.customer!.loyaltyPoints}
                </p>
                <p class="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Loyalty Points
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 class="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Contact Information
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Email
                  </p>
                  <p style={{ color: "var(--text-primary)" }}>
                    {props.customer!.email || "Not provided"}
                  </p>
                </div>
                <div>
                  <p class="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Phone
                  </p>
                  <p style={{ color: "var(--text-primary)" }}>{props.customer!.phone}</p>
                </div>
                <div>
                  <p class="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Preferred Contact
                  </p>
                  <p style={{ color: "var(--text-primary)" }}>
                    {getPreferredContactLabel(props.customer!.preferredContact)}
                  </p>
                </div>
                <div>
                  <p class="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Marketing Opt-in
                  </p>
                  <p style={{ color: "var(--text-primary)" }}>
                    {props.customer!.marketingOptIn ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 class="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Address
              </h3>
              <p class="whitespace-pre-line" style={{ color: "var(--text-primary)" }}>
                {formatAddress(props.customer!)}
              </p>
            </div>

            {/* Business Information */}
            <Show when={props.customer!.customerType === "business" && (props.customer!.companyName || props.customer!.taxId)}>
              <div>
                <h3 class="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  Business Information
                </h3>
                <div class="grid grid-cols-2 gap-4">
                  <Show when={props.customer!.companyName}>
                    <div>
                      <p class="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                        Company Name
                      </p>
                      <p style={{ color: "var(--text-primary)" }}>{props.customer!.companyName}</p>
                    </div>
                  </Show>
                  <Show when={props.customer!.taxId}>
                    <div>
                      <p class="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                        Tax ID
                      </p>
                      <p style={{ color: "var(--text-primary)" }}>{props.customer!.taxId}</p>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Notes */}
            <Show when={props.customer!.notes}>
              <div>
                <h3 class="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  Notes
                </h3>
                <p
                  class="p-3 rounded-lg whitespace-pre-wrap"
                  style={{
                    "background-color": "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {props.customer!.notes}
                </p>
              </div>
            </Show>

            {/* Timestamps */}
            <div class="flex gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>Customer since: {formatDate(props.customer!.createdAt)}</p>
              <Show when={props.customer!.lastOrderAt}>
                <p>Last order: {formatDate(props.customer!.lastOrderAt!)}</p>
              </Show>
            </div>
          </div>

          {/* Actions */}
          <div
            class="p-6 border-t flex justify-end gap-3"
            style={{ "border-color": "var(--border-color)" }}
          >
            <Button
              onClick={props.onClose}
              variant="secondary"
              size="sm"
            >
              Close
            </Button>
            <Button
              onClick={props.onEdit}
              variant="primary"
              size="sm"
            >
              Edit Customer
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default CustomerDetailsModal;

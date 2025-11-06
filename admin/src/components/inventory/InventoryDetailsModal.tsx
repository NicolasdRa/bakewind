import { Component, createSignal, createResource, Show } from "solid-js";
import { inventoryApi, InventoryItem, ConsumptionTracking } from "~/api/inventory";

interface InventoryDetailsModalProps {
  isOpen: boolean;
  itemId: string | null;
  onClose: () => void;
}

const InventoryDetailsModal: Component<InventoryDetailsModalProps> = (props) => {
  // Fetch item details
  const [itemDetails] = createResource(
    () => props.itemId,
    async (id) => {
      if (!id) return null;
      return inventoryApi.getInventoryItem(id);
    }
  );

  // Fetch consumption tracking (may not exist)
  const [consumptionData] = createResource(
    () => props.itemId,
    async (id) => {
      if (!id) return null;
      try {
        return await inventoryApi.getConsumption(id);
      } catch (err) {
        return null; // No tracking data available
      }
    }
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Show when={props.isOpen && props.itemId}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ "background-color": "rgba(0, 0, 0, 0.5)" }}
        onClick={props.onClose}
      >
        <div
          class="rounded-xl border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="p-6 border-b" style={{ "border-color": "var(--border-color)" }}>
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  {itemDetails.loading ? "Loading..." : itemDetails()?.name}
                </h2>
                <Show when={itemDetails()}>
                  <p class="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {itemDetails()!.category.charAt(0).toUpperCase() + itemDetails()!.category.slice(1)}
                  </p>
                </Show>
              </div>
              <button
                onClick={props.onClose}
                class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ color: "var(--text-secondary)" }}
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <Show when={!itemDetails.loading && itemDetails()} fallback={
            <div class="p-12 text-center">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{
                "border-color": "var(--primary-color)"
              }}></div>
            </div>
          }>
            <div class="p-6 space-y-6">
              {/* Stock Information */}
              <div>
                <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Stock Information
                </h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Current Stock</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
                      {itemDetails()!.currentStock.toFixed(2)} {itemDetails()!.unit}
                    </p>
                  </div>
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Minimum Stock</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {itemDetails()!.minimumStock.toFixed(2)} {itemDetails()!.unit}
                    </p>
                  </div>
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Reorder Point</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {itemDetails()!.reorderPoint.toFixed(2)} {itemDetails()!.unit}
                    </p>
                  </div>
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Reorder Quantity</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {itemDetails()!.reorderQuantity.toFixed(2)} {itemDetails()!.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Information */}
              <div>
                <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Cost Information
                </h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Cost Per Unit</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--success-color)" }}>
                      ${itemDetails()!.costPerUnit.toFixed(4)}
                    </p>
                  </div>
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Total Value</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--success-color)" }}>
                      ${(itemDetails()!.currentStock * itemDetails()!.costPerUnit).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consumption Tracking */}
              <Show when={consumptionData()}>
                <div>
                  <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                    Consumption Tracking
                  </h3>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                      <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Avg. Daily Consumption</p>
                      <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                        {consumptionData()!.avg_daily_consumption.toFixed(2)} {itemDetails()!.unit}/day
                      </p>
                    </div>
                    <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                      <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Days Remaining</p>
                      <p class="text-2xl font-bold" style={{ color: "var(--warning-color)" }}>
                        {consumptionData()!.days_of_supply_remaining.toFixed(1)} days
                      </p>
                    </div>
                    <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                      <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Predicted Stockout</p>
                      <p class="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        {formatDate(consumptionData()!.predicted_stockout_date)}
                      </p>
                    </div>
                    <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                      <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Calculation Method</p>
                      <p class="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {consumptionData()!.calculation_method.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p class="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                        Last calculated: {formatDateTime(consumptionData()!.last_calculated_at)}
                      </p>
                    </div>
                  </div>
                  <Show when={consumptionData()!.custom_reorder_threshold !== null}>
                    <div class="mt-4 p-4 rounded-lg" style={{ "background-color": "var(--info-light)", "border": "1px solid var(--info-color)" }}>
                      <p class="text-sm font-medium" style={{ color: "var(--info-color)" }}>
                        Custom threshold active: {consumptionData()!.custom_reorder_threshold} {itemDetails()!.unit}
                      </p>
                    </div>
                  </Show>
                </div>
              </Show>

              {/* Additional Details */}
              <div>
                <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Additional Details
                </h3>
                <div class="space-y-3">
                  <div class="flex justify-between py-2 border-b" style={{ "border-color": "var(--border-light)" }}>
                    <span class="font-medium" style={{ color: "var(--text-secondary)" }}>Supplier</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {itemDetails()!.supplier || "N/A"}
                    </span>
                  </div>
                  <div class="flex justify-between py-2 border-b" style={{ "border-color": "var(--border-light)" }}>
                    <span class="font-medium" style={{ color: "var(--text-secondary)" }}>Location</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {itemDetails()!.location || "N/A"}
                    </span>
                  </div>
                  <div class="flex justify-between py-2 border-b" style={{ "border-color": "var(--border-light)" }}>
                    <span class="font-medium" style={{ color: "var(--text-secondary)" }}>Expiration Date</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {formatDate(itemDetails()!.expirationDate)}
                    </span>
                  </div>
                  <div class="flex justify-between py-2 border-b" style={{ "border-color": "var(--border-light)" }}>
                    <span class="font-medium" style={{ color: "var(--text-secondary)" }}>Last Restocked</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {itemDetails()!.lastRestocked ? formatDateTime(itemDetails()!.lastRestocked) : "N/A"}
                    </span>
                  </div>
                  <Show when={itemDetails()!.notes}>
                    <div class="py-2">
                      <p class="font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Notes</p>
                      <p class="text-sm" style={{ color: "var(--text-primary)" }}>
                        {itemDetails()!.notes}
                      </p>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Timestamps */}
              <div class="pt-4 border-t" style={{ "border-color": "var(--border-color)" }}>
                <div class="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <span>Created: {formatDateTime(itemDetails()!.createdAt)}</span>
                  <span>Updated: {formatDateTime(itemDetails()!.updatedAt)}</span>
                </div>
              </div>
            </div>
          </Show>

          {/* Footer */}
          <div class="p-6 border-t" style={{ "border-color": "var(--border-color)" }}>
            <button
              onClick={props.onClose}
              class="w-full px-5 py-2.5 rounded-lg font-medium transition-all"
              style={{
                "background-color": "var(--bg-secondary)",
                color: "var(--text-primary)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default InventoryDetailsModal;

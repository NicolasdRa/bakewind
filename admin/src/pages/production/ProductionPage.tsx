import { Component, createSignal, For, Show, onMount } from "solid-js";
import { productionApi, ProductionSchedule, ProductionItem, ProductionStatus } from "~/api/production";
import { useInfoModal } from "~/stores/infoModalStore";
import { formatLocalDate, formatTime } from "~/utils/dateUtils";
import StatsCard from "~/components/common/StatsCard";
import DatePicker from "~/components/common/DatePicker";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";

const ProductionPage: Component = () => {
  const { showSuccess, showError } = useInfoModal();

  const [schedules, setSchedules] = createSignal<ProductionSchedule[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [selectedDate, setSelectedDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = createSignal<ProductionStatus | 'all'>('all');

  // Fetch schedules on mount
  onMount(async () => {
    await fetchSchedules();
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await productionApi.getAllSchedules({
        startDate: selectedDate(),
        endDate: selectedDate(),
      });
      setSchedules(data);
    } catch (err: any) {
      console.error('Error fetching production schedules:', err);
      showError('Error', err.message || 'Failed to load production schedules');
    } finally {
      setLoading(false);
    }
  };

  // Get all production items from schedules for the selected date
  const getAllItems = (): ProductionItem[] => {
    return schedules().flatMap(schedule => schedule.items);
  };

  const filteredItems = () => {
    let items = getAllItems();

    if (selectedStatus() !== 'all') {
      items = items.filter(item => item.status === selectedStatus());
    }

    return items;
  };

  // Handle production actions
  const handleStartProduction = async (item: ProductionItem) => {
    try {
      await productionApi.startProduction(item.schedule_id, item.id);
      showSuccess('Success', 'Production started successfully');
      await fetchSchedules();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to start production');
    }
  };

  const handleCompleteProduction = async (item: ProductionItem) => {
    try {
      await productionApi.completeProduction(item.schedule_id, item.id, {
        qualityCheck: true,
      });
      showSuccess('Success', 'Production completed successfully');
      await fetchSchedules();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to complete production');
    }
  };

  // Handle date change
  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    await fetchSchedules();
  };

  const getStatusVariant = (status: ProductionStatus) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const formatStatus = (status: ProductionStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <div class="p-6 md:p-8">
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Production Batches</h1>
          <p class="text-base" style="color: var(--text-secondary)">View and manage active production schedules</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Scheduled"
          value={getAllItems().filter(item => item.status === 'scheduled').length}
          valueColor="var(--info-color)"
        />
        <StatsCard
          title="In Progress"
          value={getAllItems().filter(item => item.status === 'in_progress').length}
          valueColor="var(--warning-color)"
        />
        <StatsCard
          title="Completed"
          value={getAllItems().filter(item => item.status === 'completed').length}
          valueColor="var(--success-color)"
        />
        <StatsCard
          title="Cancelled"
          value={getAllItems().filter(item => item.status === 'cancelled').length}
          valueColor="var(--error-color)"
        />
      </div>

      {/* Filter Controls */}
      <div class="mb-8 rounded-xl p-5 border" style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-64">
            <DatePicker
              value={selectedDate()}
              onChange={handleDateChange}
              label="Production Date"
            />
          </div>
          <div class="flex-1 min-w-64">
            <FilterSelect
              value={selectedStatus()}
              onChange={setSelectedStatus}
              label="Filter by Status"
              options={[
                { value: 'all', label: 'All Items' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Production Schedule */}
      <div class="rounded-xl border overflow-hidden" style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}>
        <div class="px-6 py-4 border-b" style="border-color: var(--border-color)">
          <h2 class="text-lg font-semibold" style="color: var(--text-primary)">
            Production Schedule - {formatLocalDate(selectedDate())}
          </h2>
        </div>

        <Show
          when={!loading()}
          fallback={
            <div class="p-6 text-center" style="color: var(--text-secondary)">
              Loading production schedules...
            </div>
          }
        >
          <Show
            when={filteredItems().length > 0}
            fallback={
              <div class="p-6 text-center" style="color: var(--text-secondary)">
                No production items scheduled for this date.
              </div>
            }
          >
            <div class="divide-y" style="border-color: var(--border-color)">
              <For each={filteredItems()}>
                {(item) => (
                  <div
                    class="p-6 transition-colors"
                    style={{
                      "background-color": "var(--bg-primary)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                    }}
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 class="text-lg font-medium" style="color: var(--text-primary)">
                            {item.recipe_name}
                          </h3>
                          <Show when={item.internal_order_id}>
                            <Badge color="#4169E1">
                              Internal Order
                            </Badge>
                          </Show>
                          <Show when={item.customer_order_id}>
                            <Badge color="#32CD32">
                              Customer Order
                            </Badge>
                          </Show>
                          <Badge variant={getStatusVariant(item.status)}>
                            {formatStatus(item.status)}
                          </Badge>
                          <Show when={item.quality_check}>
                            <Badge variant="success">
                              Quality Checked
                            </Badge>
                          </Show>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" style="color: var(--text-secondary)">
                          <div>
                            <span class="font-medium">Quantity:</span> {item.quantity}
                          </div>
                          <div>
                            <span class="font-medium">Scheduled:</span> {formatTime(item.scheduled_time)}
                          </div>
                          <Show when={item.start_time}>
                            <div>
                              <span class="font-medium">Started:</span> {formatTime(item.start_time)}
                            </div>
                          </Show>
                          <Show when={item.completed_time}>
                            <div>
                              <span class="font-medium">Completed:</span> {formatTime(item.completed_time)}
                            </div>
                          </Show>
                        </div>

                        <Show when={item.assigned_to}>
                          <div class="mt-2 text-sm" style="color: var(--text-secondary)">
                            <span class="font-medium">Assigned to:</span> {item.assigned_to}
                          </div>
                        </Show>

                        <Show when={item.batch_number}>
                          <div class="mt-2 text-sm" style="color: var(--text-secondary)">
                            <span class="font-medium">Batch #:</span> {item.batch_number}
                          </div>
                        </Show>

                        <Show when={item.notes}>
                          <div class="mt-2 text-sm" style="color: var(--text-secondary)">
                            <span class="font-medium">Notes:</span> {item.notes}
                          </div>
                        </Show>

                        <Show when={item.quality_notes}>
                          <div class="mt-2 text-sm" style="color: var(--text-secondary)">
                            <span class="font-medium">Quality Notes:</span> {item.quality_notes}
                          </div>
                        </Show>
                      </div>

                      <div class="flex gap-2 ml-4">
                        <Show when={item.status === 'scheduled'}>
                          <button
                            onClick={() => handleStartProduction(item)}
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                            style={{
                              "background-color": "var(--success-color)",
                              "color": "white"
                            }}
                          >
                            Start
                          </button>
                        </Show>
                        <Show when={item.status === 'in_progress'}>
                          <button
                            onClick={() => handleCompleteProduction(item)}
                            class="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                            style={{
                              "background-color": "var(--primary-color)",
                              "color": "white"
                            }}
                          >
                            Complete
                          </button>
                        </Show>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default ProductionPage;

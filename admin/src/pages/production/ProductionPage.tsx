import { Component, createSignal, For, Show, onMount } from "solid-js";
import { productionApi, ProductionSchedule, ProductionItem, ProductionStatus } from "~/api/production";
import { useInfoModal } from "~/stores/infoModalStore";
import { formatLocalDate, formatTime, getCurrentDateString } from "~/utils/dateUtils";
import StatsCard from "~/components/common/StatsCard";
import DatePicker from "~/components/common/DatePicker";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import { Heading, Text } from "~/components/common/Typography";
import styles from "./ProductionPage.module.css";

const ProductionPage: Component = () => {
  const { showSuccess, showError } = useInfoModal();

  const [schedules, setSchedules] = createSignal<ProductionSchedule[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [selectedDate, setSelectedDate] = createSignal(getCurrentDateString());
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
    <div class={styles.pageContainer}>
      <div class={styles.pageHeader}>
        <div>
          <Heading level="h1" variant="page">Production Batches</Heading>
          <Text color="secondary">View and manage active production schedules</Text>
        </div>
      </div>

      {/* Stats Cards */}
      <div class={styles.statsGrid}>
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
      <div class={styles.filterCard}>
        <div class={styles.filterRow}>
          <div class={styles.filterItem}>
            <DatePicker
              value={selectedDate()}
              onChange={handleDateChange}
              label="Production Date"
            />
          </div>
          <div class={styles.filterItem}>
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
      <div class={styles.scheduleContainer}>
        <div class={styles.scheduleHeader}>
          <Heading variant="section" class={styles.scheduleTitle}>
            Production Schedule - {formatLocalDate(selectedDate())}
          </Heading>
        </div>

        <Show
          when={!loading()}
          fallback={
            <div class={styles.loadingState}>
              Loading production schedules...
            </div>
          }
        >
          <Show
            when={filteredItems().length > 0}
            fallback={
              <div class={styles.emptyState}>
                No production items scheduled for this date.
              </div>
            }
          >
            <div class={styles.itemList}>
              <For each={filteredItems()}>
                {(item) => (
                  <div class={styles.productionItem}>
                    <div class={styles.itemContent}>
                      <div class={styles.itemMain}>
                        <div class={styles.itemHeader}>
                          <Heading variant="card" class={styles.recipeName}>{item.recipe_name}</Heading>
                          <Show when={item.internal_order_id}>
                            <Badge color="#4169E1">Internal Order</Badge>
                          </Show>
                          <Show when={item.customer_order_id}>
                            <Badge color="#32CD32">Customer Order</Badge>
                          </Show>
                          <Badge variant={getStatusVariant(item.status)}>
                            {formatStatus(item.status)}
                          </Badge>
                          <Show when={item.quality_check}>
                            <Badge variant="success">Quality Checked</Badge>
                          </Show>
                        </div>

                        <div class={styles.detailsGrid}>
                          <div>
                            <Text as="span" variant="label" class={styles.detailLabel}>Quantity:</Text> {item.quantity}
                          </div>
                          <div>
                            <Text as="span" variant="label" class={styles.detailLabel}>Scheduled:</Text> {formatTime(item.scheduled_time)}
                          </div>
                          <Show when={item.start_time}>
                            <div>
                              <Text as="span" variant="label" class={styles.detailLabel}>Started:</Text> {formatTime(item.start_time)}
                            </div>
                          </Show>
                          <Show when={item.completed_time}>
                            <div>
                              <Text as="span" variant="label" class={styles.detailLabel}>Completed:</Text> {formatTime(item.completed_time)}
                            </div>
                          </Show>
                        </div>

                        <Show when={item.assigned_to}>
                          <div class={styles.extraDetail}>
                            <Text as="span" variant="label" class={styles.detailLabel}>Assigned to:</Text> {item.assigned_to}
                          </div>
                        </Show>

                        <Show when={item.batch_number}>
                          <div class={styles.extraDetail}>
                            <Text as="span" variant="label" class={styles.detailLabel}>Batch #:</Text> {item.batch_number}
                          </div>
                        </Show>

                        <Show when={item.notes}>
                          <div class={styles.extraDetail}>
                            <Text as="span" variant="label" class={styles.detailLabel}>Notes:</Text> {item.notes}
                          </div>
                        </Show>

                        <Show when={item.quality_notes}>
                          <div class={styles.extraDetail}>
                            <Text as="span" variant="label" class={styles.detailLabel}>Quality Notes:</Text> {item.quality_notes}
                          </div>
                        </Show>
                      </div>

                      <div class={styles.itemActions}>
                        <Show when={item.status === 'scheduled'}>
                          <Button onClick={() => handleStartProduction(item)} variant="primary" size="sm">
                            Start
                          </Button>
                        </Show>
                        <Show when={item.status === 'in_progress'}>
                          <Button onClick={() => handleCompleteProduction(item)} variant="success" size="sm">
                            Complete
                          </Button>
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

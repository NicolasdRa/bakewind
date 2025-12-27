import { Component, createSignal, createResource, For, Show } from "solid-js";
import { analyticsApi } from "../../api/analytics";
import Button from "~/components/common/Button";
import { Heading, Text } from "~/components/common/Typography";
import styles from "./AnalyticsPage.module.css";

interface DashboardStats {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  orders: {
    today: number;
    thisWeek: number;
    pending: number;
    completed: number;
    avgOrderValue: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention: number;
  };
  products: {
    totalSold: number;
    topProduct: string;
    lowStock: number;
  };
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

const AnalyticsPage: Component = () => {
  const [dashboardStats] = createResource<DashboardStats>(() => analyticsApi.getDashboardStats());
  const [selectedPeriod, setSelectedPeriod] = createSignal('7days');

  // Mock sales data for demonstration
  const [salesData] = createSignal<SalesData[]>([
    { date: '2024-11-25', revenue: 1250, orders: 18 },
    { date: '2024-11-26', revenue: 1890, orders: 24 },
    { date: '2024-11-27', revenue: 2340, orders: 31 },
    { date: '2024-11-28', revenue: 3120, orders: 42 },
    { date: '2024-11-29', revenue: 2850, orders: 38 },
    { date: '2024-11-30', revenue: 2180, orders: 29 },
    { date: '2024-12-01', revenue: 1950, orders: 26 }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div class={styles.pageContainer}>
      <div class={styles.pageHeader}>
        <Heading level="h1" variant="page">Analytics & Reports</Heading>
        <Text color="secondary">Track performance and business insights</Text>
      </div>

      {/* Period Selection */}
      <div class={styles.periodCard}>
        <div class={styles.periodButtons}>
          <Button
            variant={selectedPeriod() === '7days' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedPeriod('7days')}
          >
            Last 7 Days
          </Button>
          <Button
            variant={selectedPeriod() === '30days' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedPeriod('30days')}
          >
            Last 30 Days
          </Button>
          <Button
            variant={selectedPeriod() === '90days' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedPeriod('90days')}
          >
            Last 90 Days
          </Button>
        </div>
      </div>

      <Show
        when={!dashboardStats.loading}
        fallback={
          <div class={styles.loadingContainer}>
            <div class={styles.spinner}></div>
          </div>
        }
      >
        {/* Key Metrics */}
        <div class={styles.metricsGrid}>
          <div class={styles.metricCard}>
            <div class={styles.metricContent}>
              <div class={styles.metricInfo}>
                <Text variant="label" color="secondary" class={styles.metricLabel}>Total Revenue</Text>
                <Text variant="body" class={styles.metricValue}>
                  {formatCurrency(dashboardStats()?.revenue.thisMonth || 0)}
                </Text>
                <Text
                  variant="body-sm"
                  classList={{
                    [styles.metricSubtextPositive]: (dashboardStats()?.revenue.growth || 0) >= 0,
                    [styles.metricSubtextNegative]: (dashboardStats()?.revenue.growth || 0) < 0
                  }}
                >
                  {formatPercent(dashboardStats()?.revenue.growth || 0)} from last month
                </Text>
              </div>
              <div class={`${styles.metricIcon} ${styles.metricIconGreen}`}>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--success-color)">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class={styles.metricCard}>
            <div class={styles.metricContent}>
              <div class={styles.metricInfo}>
                <Text variant="label" color="secondary" class={styles.metricLabel}>Total Orders</Text>
                <Text variant="body" class={styles.metricValue}>
                  {dashboardStats()?.orders.thisWeek || 0}
                </Text>
                <Text variant="body-sm" color="muted" class={styles.metricSubtext}>
                  Avg: {formatCurrency(dashboardStats()?.orders.avgOrderValue || 0)}
                </Text>
              </div>
              <div class={`${styles.metricIcon} ${styles.metricIconBlue}`}>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--info-color)">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class={styles.metricCard}>
            <div class={styles.metricContent}>
              <div class={styles.metricInfo}>
                <Text variant="label" color="secondary" class={styles.metricLabel}>Total Customers</Text>
                <Text variant="body" class={styles.metricValue}>
                  {dashboardStats()?.customers.total || 0}
                </Text>
                <Text variant="body-sm" class={styles.metricSubtextPositive}>
                  +{dashboardStats()?.customers.new || 0} new this month
                </Text>
              </div>
              <div class={`${styles.metricIcon} ${styles.metricIconPurple}`}>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #7e22ce">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class={styles.metricCard}>
            <div class={styles.metricContent}>
              <div class={styles.metricInfo}>
                <Text variant="label" color="secondary" class={styles.metricLabel}>Customer Retention</Text>
                <Text variant="body" class={styles.metricValue}>
                  {(dashboardStats()?.customers.retention || 0).toFixed(1)}%
                </Text>
                <Text variant="body-sm" color="muted" class={styles.metricSubtext}>
                  {dashboardStats()?.customers.returning || 0} returning customers
                </Text>
              </div>
              <div class={`${styles.metricIcon} ${styles.metricIconYellow}`}>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--warning-color)">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class={styles.chartsGrid}>
          {/* Sales Chart */}
          <div class={styles.chartCard}>
            <Heading variant="card" class={styles.chartTitle}>Sales Trend</Heading>
            <div class={styles.chartContainer}>
              <For each={salesData()}>
                {(data) => {
                  const maxRevenue = Math.max(...salesData().map(d => d.revenue));
                  const height = (data.revenue / maxRevenue) * 100;
                  return (
                    <div class={styles.chartBar}>
                      <div
                        class={styles.chartBarFill}
                        style={`height: ${height}%`}
                        title={`${new Date(data.date).toLocaleDateString()}: ${formatCurrency(data.revenue)}`}
                      ></div>
                      <span class={styles.chartBarLabel}>
                        {new Date(data.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Order Status */}
          <div class={styles.chartCard}>
            <Heading variant="card" class={styles.chartTitle}>Order Status</Heading>
            <div class={styles.statusList}>
              <div class={styles.statusItem}>
                <div class={styles.statusIndicator}>
                  <div class={`${styles.statusDot} ${styles.statusDotYellow}`}></div>
                  <Text as="span" class={styles.statusLabel}>Pending</Text>
                </div>
                <Text as="span" class={styles.statusValue}>{dashboardStats()?.orders.pending || 0}</Text>
              </div>
              <div class={styles.statusItem}>
                <div class={styles.statusIndicator}>
                  <div class={`${styles.statusDot} ${styles.statusDotBlue}`}></div>
                  <Text as="span" class={styles.statusLabel}>In Progress</Text>
                </div>
                <Text as="span" class={styles.statusValue}>12</Text>
              </div>
              <div class={styles.statusItem}>
                <div class={styles.statusIndicator}>
                  <div class={`${styles.statusDot} ${styles.statusDotGreen}`}></div>
                  <Text as="span" class={styles.statusLabel}>Completed</Text>
                </div>
                <Text as="span" class={styles.statusValue}>{dashboardStats()?.orders.completed || 0}</Text>
              </div>
              <div class={styles.statusItem}>
                <div class={styles.statusIndicator}>
                  <div class={`${styles.statusDot} ${styles.statusDotRed}`}></div>
                  <Text as="span" class={styles.statusLabel}>Cancelled</Text>
                </div>
                <Text as="span" class={styles.statusValue}>2</Text>
              </div>
            </div>
          </div>
        </div>

        <div class={styles.bottomGrid}>
          {/* Top Products */}
          <div class={styles.chartCard}>
            <Heading variant="card" class={styles.chartTitle}>Top Selling Products</Heading>
            <div class={styles.productList}>
              <div class={styles.productItem}>
                <div class={styles.productInfo}>
                  <Text class={styles.productName}>Chocolate Croissants</Text>
                  <Text variant="body-sm" color="muted" class={styles.productSales}>89 sold this week</Text>
                </div>
                <Text class={styles.productRevenue}>$1,780</Text>
              </div>
              <div class={styles.productItem}>
                <div class={styles.productInfo}>
                  <Text class={styles.productName}>Sourdough Bread</Text>
                  <Text variant="body-sm" color="muted" class={styles.productSales}>67 sold this week</Text>
                </div>
                <Text class={styles.productRevenue}>$536</Text>
              </div>
              <div class={styles.productItem}>
                <div class={styles.productInfo}>
                  <Text class={styles.productName}>Vanilla Cupcakes</Text>
                  <Text variant="body-sm" color="muted" class={styles.productSales}>54 sold this week</Text>
                </div>
                <Text class={styles.productRevenue}>$162</Text>
              </div>
              <div class={styles.productItem}>
                <div class={styles.productInfo}>
                  <Text class={styles.productName}>Blueberry Muffins</Text>
                  <Text variant="body-sm" color="muted" class={styles.productSales}>43 sold this week</Text>
                </div>
                <Text class={styles.productRevenue}>$129</Text>
              </div>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div class={styles.chartCard}>
            <Heading variant="card" class={styles.chartTitle}>Inventory Alerts</Heading>
            <div class={styles.alertList}>
              <div class={`${styles.alertItem} ${styles.alertItemUrgent}`}>
                <div class={styles.alertInfo}>
                  <Text class={`${styles.alertName} ${styles.alertNameUrgent}`}>All-Purpose Flour</Text>
                  <Text variant="body-sm" class={`${styles.alertStatus} ${styles.alertStatusUrgent}`}>Out of stock</Text>
                </div>
                <Text as="span" class={`${styles.alertBadge} ${styles.alertBadgeUrgent}`}>Urgent</Text>
              </div>
              <div class={`${styles.alertItem} ${styles.alertItemWarning}`}>
                <div class={styles.alertInfo}>
                  <Text class={`${styles.alertName} ${styles.alertNameWarning}`}>Chocolate Chips</Text>
                  <Text variant="body-sm" class={`${styles.alertStatus} ${styles.alertStatusWarning}`}>2.5 lbs remaining</Text>
                </div>
                <Text as="span" class={`${styles.alertBadge} ${styles.alertBadgeWarning}`}>Low</Text>
              </div>
              <div class={`${styles.alertItem} ${styles.alertItemWarning}`}>
                <div class={styles.alertInfo}>
                  <Text class={`${styles.alertName} ${styles.alertNameWarning}`}>Vanilla Extract</Text>
                  <Text variant="body-sm" class={`${styles.alertStatus} ${styles.alertStatusWarning}`}>150ml remaining</Text>
                </div>
                <Text as="span" class={`${styles.alertBadge} ${styles.alertBadgeWarning}`}>Low</Text>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
            >
              View Full Inventory
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default AnalyticsPage;
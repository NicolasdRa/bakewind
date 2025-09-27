import { Show, For } from 'solid-js'
import BaseWidget from '../../BaseWidget/BaseWidget'
import styles from './BakeryMetricsWidget.module.css'
import { useBakeryStore } from '~/stores/bakeryStore'

interface BakeryMetricsWidgetProps {
  widgetId: string
  title: string
  size: 'small' | 'medium' | 'large'
  onClose: () => void
}

export default function BakeryMetricsWidget(props: BakeryMetricsWidgetProps) {
  const { state } = useBakeryStore()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTrend = (trend: number) => {
    const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→'
    const color = trend > 0 ? styles.trendPositive : trend < 0 ? styles.trendNegative : styles.trendNeutral
    return { arrow, color, value: Math.abs(trend) }
  }

  return (
    <BaseWidget {...props}>
      <div class={styles.container}>
        <Show when={state.metrics} fallback={<div class={styles.loading}>Loading metrics...</div>}>
          <div class={styles.metricsGrid}>
            {/* Today's Revenue */}
            <div class={styles.metricCard}>
              <div class={styles.metricHeader}>
                <span class={styles.metricIcon}>💰</span>
                <span class={styles.metricLabel}>Today's Revenue</span>
              </div>
              <div class={styles.metricValue}>
                {formatCurrency(state.metrics?.revenue.today || 0)}
              </div>
              <div class={`${styles.metricTrend} ${formatTrend(state.metrics?.revenue.trend || 0).color}`}>
                <span>{formatTrend(state.metrics?.revenue.trend || 0).arrow}</span>
                <span>{formatTrend(state.metrics?.revenue.trend || 0).value}%</span>
                <span class={styles.trendLabel}>vs yesterday</span>
              </div>
            </div>

            {/* Orders Today */}
            <div class={styles.metricCard}>
              <div class={styles.metricHeader}>
                <span class={styles.metricIcon}>📦</span>
                <span class={styles.metricLabel}>Orders Today</span>
              </div>
              <div class={styles.metricValue}>
                {state.metrics?.todayOrders.total || 0}
              </div>
              <div class={styles.orderBreakdown}>
                <span class={styles.orderStatus}>
                  <span class={styles.statusDot} style={{ background: '#fbbf24' }}></span>
                  {state.metrics?.todayOrders.pending || 0} pending
                </span>
                <span class={styles.orderStatus}>
                  <span class={styles.statusDot} style={{ background: '#10b981' }}></span>
                  {state.metrics?.todayOrders.ready || 0} ready
                </span>
              </div>
            </div>

            {/* Production Efficiency */}
            <div class={styles.metricCard}>
              <div class={styles.metricHeader}>
                <span class={styles.metricIcon}>⚡</span>
                <span class={styles.metricLabel}>Production Efficiency</span>
              </div>
              <div class={styles.metricValue}>
                {state.metrics?.production.efficiency || 0}%
              </div>
              <div class={styles.efficiencyBar}>
                <div 
                  class={styles.efficiencyFill}
                  style={{ 
                    width: `${state.metrics?.production.efficiency || 0}%`,
                    background: (state.metrics?.production.efficiency || 0) >= 70 ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>
            </div>

            {/* Low Stock Alert */}
            <Show when={props.size !== 'small'}>
              <div class={styles.metricCard}>
                <div class={styles.metricHeader}>
                  <span class={styles.metricIcon}>⚠️</span>
                  <span class={styles.metricLabel}>Inventory Alerts</span>
                </div>
                <div class={styles.alertContent}>
                  <div class={styles.alertItem}>
                    <span class={styles.alertCount}>{state.metrics?.inventory.lowStock.length || 0}</span>
                    <span class={styles.alertLabel}>Low stock items</span>
                  </div>
                  <div class={styles.alertItem}>
                    <span class={styles.alertCount}>{state.metrics?.inventory.expiringSoon.length || 0}</span>
                    <span class={styles.alertLabel}>Expiring soon</span>
                  </div>
                </div>
              </div>
            </Show>

            {/* Weekly Revenue - Only show in large size */}
            <Show when={props.size === 'large'}>
              <div class={styles.metricCard}>
                <div class={styles.metricHeader}>
                  <span class={styles.metricIcon}>📈</span>
                  <span class={styles.metricLabel}>Week Revenue</span>
                </div>
                <div class={styles.metricValue}>
                  {formatCurrency(state.metrics?.revenue.week || 0)}
                </div>
                <div class={styles.weekProgress}>
                  <span class={styles.weekLabel}>Target: $10,000</span>
                  <div class={styles.progressBar}>
                    <div 
                      class={styles.progressFill}
                      style={{ width: `${Math.min(((state.metrics?.revenue.week || 0) / 10000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Top Products - Only show in large size */}
              <div class={styles.metricCard}>
                <div class={styles.metricHeader}>
                  <span class={styles.metricIcon}>🏆</span>
                  <span class={styles.metricLabel}>Top Products</span>
                </div>
                <div class={styles.topProducts}>
                  <For each={state.metrics?.topProducts.slice(0, 3) || []}>
                    {(product, index) => (
                      <div class={styles.productItem}>
                        <span class={styles.productRank}>{index() + 1}</span>
                        <span class={styles.productName}>{product.name}</span>
                        <span class={styles.productQty}>{product.quantity}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </BaseWidget>
  )
}
import { createSignal, onMount, onCleanup, For } from 'solid-js'
import styles from './DashboardPreview.module.css'

interface DashboardView {
  id: string
  title: string
  icon: string
  content: any
}

export default function DashboardPreview() {
  const [currentIndex, setCurrentIndex] = createSignal(0)
  const [isPaused, setIsPaused] = createSignal(false)

  // Different dashboard views to cycle through
  const dashboardViews: DashboardView[] = [
    {
      id: 'overview',
      title: 'Dashboard Overview',
      icon: '📊',
      content: (
        <div class={styles.overviewContent}>
          <div class={styles.metricsRow}>
            <div class={styles.metric}>
              <div class={styles.metricIcon}>📋</div>
              <div class={styles.metricData}>
                <span class={styles.metricValue}>24</span>
                <span class={styles.metricLabel}>Active Orders</span>
              </div>
            </div>
            <div class={styles.metric}>
              <div class={styles.metricIcon}>💰</div>
              <div class={styles.metricData}>
                <span class={styles.metricValue}>$3,240</span>
                <span class={styles.metricLabel}>Today's Revenue</span>
              </div>
            </div>
          </div>

          <div class={styles.chartPlaceholder}>
            <div class={styles.chartTitle}>Production Overview</div>
            <div class={styles.chartBars}>
              <div class={styles.chartBar} style={{"height": "60%"}}></div>
              <div class={styles.chartBar} style={{"height": "80%"}}></div>
              <div class={styles.chartBar} style={{"height": "45%"}}></div>
              <div class={styles.chartBar} style={{"height": "90%"}}></div>
              <div class={styles.chartBar} style={{"height": "70%"}}></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'orders',
      title: 'Order Management',
      icon: '📋',
      content: (
        <div class={styles.ordersContent}>
          <div class={styles.ordersList}>
            <div class={styles.orderItem}>
              <div class={styles.orderInfo}>
                <span class={styles.orderNumber}>#2047</span>
                <span class={styles.orderCustomer}>Sarah Johnson</span>
              </div>
              <div class={styles.orderStatus}>
                <span class={styles.statusBadge + ' ' + styles.statusPending}>Baking</span>
                <span class={styles.orderAmount}>$45.60</span>
              </div>
            </div>

            <div class={styles.orderItem}>
              <div class={styles.orderInfo}>
                <span class={styles.orderNumber}>#2048</span>
                <span class={styles.orderCustomer}>Mike Chen</span>
              </div>
              <div class={styles.orderStatus}>
                <span class={styles.statusBadge + ' ' + styles.statusReady}>Ready</span>
                <span class={styles.orderAmount}>$28.40</span>
              </div>
            </div>

            <div class={styles.orderItem}>
              <div class={styles.orderInfo}>
                <span class={styles.orderNumber}>#2049</span>
                <span class={styles.orderCustomer}>Emma Davis</span>
              </div>
              <div class={styles.orderStatus}>
                <span class={styles.statusBadge + ' ' + styles.statusNew}>New</span>
                <span class={styles.orderAmount}>$67.20</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'inventory',
      title: 'Inventory Status',
      icon: '📦',
      content: (
        <div class={styles.inventoryContent}>
          <div class={styles.inventoryGrid}>
            <div class={styles.inventoryItem}>
              <div class={styles.inventoryIcon}>🌾</div>
              <div class={styles.inventoryDetails}>
                <span class={styles.inventoryName}>Flour</span>
                <div class={styles.inventoryStock}>
                  <span class={styles.stockAmount}>45 lbs</span>
                  <div class={styles.stockBar}>
                    <div class={styles.stockLevel} style={{"width": "75%"}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div class={styles.inventoryItem}>
              <div class={styles.inventoryIcon}>🥚</div>
              <div class={styles.inventoryDetails}>
                <span class={styles.inventoryName}>Eggs</span>
                <div class={styles.inventoryStock}>
                  <span class={styles.stockAmount}>3 dozen</span>
                  <div class={styles.stockBar}>
                    <div class={styles.stockLevel + ' ' + styles.stockLow} style={{"width": "20%"}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div class={styles.inventoryItem}>
              <div class={styles.inventoryIcon}>🧈</div>
              <div class={styles.inventoryDetails}>
                <span class={styles.inventoryName}>Butter</span>
                <div class={styles.inventoryStock}>
                  <span class={styles.stockAmount}>8 lbs</span>
                  <div class={styles.stockBar}>
                    <div class={styles.stockLevel} style={{"width": "90%"}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Sales Analytics',
      icon: '📈',
      content: (
        <div class={styles.analyticsContent}>
          <div class={styles.salesChart}>
            <div class={styles.chartTitle}>Weekly Sales</div>
            <div class={styles.lineChart}>
              <div class={styles.chartLine}>
                <div class={styles.chartPoint} style={{"left": "10%", "bottom": "20%"}}></div>
                <div class={styles.chartPoint} style={{"left": "25%", "bottom": "35%"}}></div>
                <div class={styles.chartPoint} style={{"left": "40%", "bottom": "25%"}}></div>
                <div class={styles.chartPoint} style={{"left": "55%", "bottom": "60%"}}></div>
                <div class={styles.chartPoint} style={{"left": "70%", "bottom": "80%"}}></div>
                <div class={styles.chartPoint} style={{"left": "85%", "bottom": "75%"}}></div>
              </div>
            </div>
          </div>

          <div class={styles.topProducts}>
            <div class={styles.productItem}>
              <span class={styles.productName}>🥐 Croissants</span>
              <span class={styles.productSales}>156 sold</span>
            </div>
            <div class={styles.productItem}>
              <span class={styles.productName}>🍞 Sourdough</span>
              <span class={styles.productSales}>89 sold</span>
            </div>
            <div class={styles.productItem}>
              <span class={styles.productName}>🧁 Cupcakes</span>
              <span class={styles.productSales}>67 sold</span>
            </div>
          </div>
        </div>
      )
    }
  ]

  let intervalId: number

  onMount(() => {
    // Auto-cycle through views every 3 seconds
    intervalId = setInterval(() => {
      if (!isPaused()) {
        setCurrentIndex((prev) => (prev + 1) % dashboardViews.length)
      }
    }, 3000)
  })

  onCleanup(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  const handleMouseEnter = () => setIsPaused(true)
  const handleMouseLeave = () => setIsPaused(false)

  const handleCardClick = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div
      class={styles.previewContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div class={styles.cardsStack}>
        <For each={dashboardViews}>
          {(view, index) => (
            <div
              class={styles.previewCard}
              classList={{
                [styles.cardActive]: index() === currentIndex(),
                [styles.cardBehind1]: index() === (currentIndex() + 1) % dashboardViews.length,
                [styles.cardBehind2]: index() === (currentIndex() + 2) % dashboardViews.length,
                [styles.cardBehind3]: index() === (currentIndex() + 3) % dashboardViews.length
              }}
              onClick={() => handleCardClick(index())}
              style={{
                'z-index': dashboardViews.length - Math.abs(index() - currentIndex()),
                'transform': `
                  translateY(${index() === currentIndex() ? 0 : (index() - currentIndex()) * 8}px)
                  translateX(${index() === currentIndex() ? 0 : (index() - currentIndex()) * 4}px)
                  scale(${index() === currentIndex() ? 1 : 0.95 - Math.abs(index() - currentIndex()) * 0.02})
                `
              }}
          >
            <div class={styles.cardHeader}>
              <div class={styles.cardTitleSection}>
                <div class={styles.cardIcon}>{view.icon}</div>
                <h3 class={styles.cardTitle}>{view.title}</h3>
              </div>
              <div class={styles.cardControls}>
                <div class={styles.windowControl + ' ' + styles.controlClose}></div>
                <div class={styles.windowControl + ' ' + styles.controlMinimize}></div>
                <div class={styles.windowControl + ' ' + styles.controlMaximize}></div>
              </div>
            </div>

            <div class={styles.cardContent}>
              {view.content}
            </div>
            </div>
          )}
        </For>
      </div>

      {/* Card indicators */}
      <div class={styles.indicators}>
        <For each={dashboardViews}>
          {(_, index) => (
            <button
              class={styles.indicator}
              classList={{ [styles.indicatorActive]: index() === currentIndex() }}
              onClick={() => handleCardClick(index())}
            />
          )}
        </For>
      </div>
    </div>
  )
}
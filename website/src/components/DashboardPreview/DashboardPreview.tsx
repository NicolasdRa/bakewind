import { Component } from 'solid-js'
import styles from './DashboardPreview.module.css'

const DashboardPreview: Component = () => {
  return (
    <div class={styles.preview}>
      <div class={styles.previewWindow}>
        {/* Header */}
        <div class={styles.header}>
          <div class={styles.headerLeft}>
            <div class={styles.logo}>
              <div class={styles.logoIcon}></div>
              <span class={styles.logoText}>BakeWind</span>
            </div>
          </div>
          <div class={styles.headerRight}>
            <div class={styles.userProfile}>
              <div class={styles.avatar}></div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div class={styles.sidebar}>
          <div class={styles.navItem}>
            <div class={styles.navIcon}></div>
            <span class={styles.navText}>Dashboard</span>
          </div>
          <div class={`${styles.navItem} ${styles.active}`}>
            <div class={styles.navIcon}></div>
            <span class={styles.navText}>Orders</span>
          </div>
          <div class={styles.navItem}>
            <div class={styles.navIcon}></div>
            <span class={styles.navText}>Inventory</span>
          </div>
          <div class={styles.navItem}>
            <div class={styles.navIcon}></div>
            <span class={styles.navText}>Production</span>
          </div>
          <div class={styles.navItem}>
            <div class={styles.navIcon}></div>
            <span class={styles.navText}>Analytics</span>
          </div>
        </div>

        {/* Main Content */}
        <div class={styles.mainContent}>
          <div class={styles.contentHeader}>
            <h2 class={styles.contentTitle}>Today's Orders</h2>
            <div class={styles.searchBar}>
              <div class={styles.searchIcon}></div>
            </div>
          </div>

          {/* Stats Cards */}
          <div class={styles.statsGrid}>
            <div class={styles.statCard}>
              <div class={styles.statIcon}></div>
              <div class={styles.statContent}>
                <div class={styles.statValue}>24</div>
                <div class={styles.statLabel}>Active Orders</div>
              </div>
            </div>
            <div class={styles.statCard}>
              <div class={styles.statIcon}></div>
              <div class={styles.statContent}>
                <div class={styles.statValue}>$1,245</div>
                <div class={styles.statLabel}>Today's Revenue</div>
              </div>
            </div>
            <div class={styles.statCard}>
              <div class={styles.statIcon}></div>
              <div class={styles.statContent}>
                <div class={styles.statValue}>8</div>
                <div class={styles.statLabel}>In Production</div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div class={styles.ordersSection}>
            <div class={styles.orderItem}>
              <div class={styles.orderDetails}>
                <div class={styles.orderNumber}>#OR-001</div>
                <div class={styles.customerName}>Sweet Dreams Bakery</div>
              </div>
              <div class={styles.orderStatus}>
                <div class={styles.statusBadge}>In Progress</div>
              </div>
            </div>
            <div class={styles.orderItem}>
              <div class={styles.orderDetails}>
                <div class={styles.orderNumber}>#OR-002</div>
                <div class={styles.customerName}>Corner Café</div>
              </div>
              <div class={styles.orderStatus}>
                <div class={styles.statusBadge}>Ready</div>
              </div>
            </div>
            <div class={styles.orderItem}>
              <div class={styles.orderDetails}>
                <div class={styles.orderNumber}>#OR-003</div>
                <div class={styles.customerName}>Downtown Deli</div>
              </div>
              <div class={styles.orderStatus}>
                <div class={styles.statusBadge}>Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPreview
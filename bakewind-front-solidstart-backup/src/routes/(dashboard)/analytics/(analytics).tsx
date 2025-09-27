import SEO from '~/components/SEO/SEO'
import styles from './analytics.module.css'

export default function Analytics() {
  return (
    <>
      <SEO 
        title="Analytics Dashboard"
        description="View comprehensive data insights, metrics, and analytics to track your dashboard performance and user engagement."
        path="/analytics"
      />

      <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>Analytics Dashboard</h1>
            <p class={styles.subtitle}>View comprehensive data insights, metrics, and analytics to track performance</p>
          </div>
        </div>

        <div class={styles.analyticsGrid}>
          <div class={styles.analyticsCard}>
            <h3 class={styles.cardTitle}>Page Views</h3>
            <div class={styles.cardValue}>125,430</div>
            <p class={`${styles.cardChange} ${styles.cardChangePositive}`}>+12.5% from last month</p>
          </div>

          <div class={styles.analyticsCard}>
            <h3 class={styles.cardTitle}>Users</h3>
            <div class={styles.cardValue}>24,532</div>
            <p class={`${styles.cardChange} ${styles.cardChangePositive}`}>+8.2% from last month</p>
          </div>

          <div class={styles.analyticsCard}>
            <h3 class={styles.cardTitle}>Conversion Rate</h3>
            <div class={styles.cardValue}>3.24%</div>
            <p class={`${styles.cardChange} ${styles.cardChangeNegative}`}>-2.1% from last month</p>
          </div>
        </div>
      </div>
    </>
  )
}
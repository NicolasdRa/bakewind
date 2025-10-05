import { onMount } from 'solid-js'
import DashboardErrorBoundary from '~/components/ErrorBoundary/DashboardErrorBoundary'
import DashboardContent from "~/components/DashboardContent/DashboardContent"
import ViewToggle from '~/components/ViewToggle/ViewToggle'
import ActionButton from '~/components/ActionButton/ActionButton'
import { useAppStore } from '~/stores/appStore'
import { bakeryActions } from '~/stores/bakeryStore'
import styles from './OverviewPage.module.css'

export default function OverviewPage() {
  const { state, actions } = useAppStore()

  // Note: Permission checking is handled by the layout's ProtectedRoute

  const layoutOptions = [
    {
      value: 'grid',
      label: 'Grid',
      mobileIcon: '⊞',
      desktopLabel: 'Grid',
      title: 'Grid Layout'
    },
    {
      value: 'list',
      label: 'List',
      mobileIcon: '☰',
      desktopLabel: 'List',
      title: 'List Layout'
    },
    {
      value: 'masonry',
      label: 'Masonry',
      mobileIcon: '⊡',
      desktopLabel: 'Masonry',
      title: 'Masonry Layout'
    }
  ]

  onMount(() => {
    // Load mock bakery data on mount
    bakeryActions.loadMockData()
    console.log('BakeWind Bakery Dashboard initialized')
  })

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div class={styles.headerContent}>
          <h1 class={styles.title}>BakeWind Bakery Dashboard</h1>
          <p class={styles.subtitle}>Welcome to your comprehensive bakery management workspace</p>
        </div>

        <div class={styles.headerActions}>
          {/* Layout Controls */}
          <ViewToggle
            options={layoutOptions}
            currentValue={state.dashboardLayout}
            onChange={(layout) => actions.setDashboardLayout(layout as 'grid' | 'list' | 'masonry')}
          />

          {/* Action Buttons */}
          <div class={styles.actionButtons}>
            <ActionButton
              onClick={() => actions.setShowWidgetModal(true)}
              icon="+"
              hideTextOnMobile={true}
            >
              Add Widget
            </ActionButton>

            <div class={styles.dropdownContainer}>
              <button class={styles.dropdownTrigger}>
                <span class={styles.dropdownIcon}>⋮</span>
              </button>

              <div class={styles.dropdownMenu}>
                <button
                  onClick={() => {
                    if (confirm('Reset dashboard to default layout?')) {
                      actions.resetLayout()
                    }
                  }}
                  class={`${styles.dropdownItem} ${styles.dropdownItemDefault}`}
                >
                  Reset Layout
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all widgets? This cannot be undone.')) {
                      actions.clearLayout()
                    }
                  }}
                  class={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                >
                  Clear All Widgets
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DashboardErrorBoundary
        fallbackIcon="🥐"
        fallbackTitle="Dashboard Error"
        fallbackMessage="The bakery dashboard encountered an error and couldn't load properly."
      >
        <DashboardContent
          layout={state.dashboardLayout}
        />
      </DashboardErrorBoundary>
    </div>
  )
}

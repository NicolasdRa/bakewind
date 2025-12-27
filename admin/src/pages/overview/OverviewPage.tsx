import { onMount } from 'solid-js'
import DashboardPageLayout from '~/layouts/DashboardPageLayout'
import DashboardErrorBoundary from '~/components/ErrorBoundary/DashboardErrorBoundary'
import DashboardContent from "~/components/DashboardContent/DashboardContent"
import ViewToggle from '~/components/ViewToggle/ViewToggle'
import ActionButton from '~/components/ActionButton/ActionButton'
import Button from '~/components/common/Button'
import { Text } from '~/components/common/Typography'
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
    <DashboardPageLayout
      title="BakeWind Bakery Dashboard"
      subtitle="Welcome to your comprehensive bakery management workspace"
      actions={
        <>
          <ViewToggle
            options={layoutOptions}
            currentValue={state.dashboardLayout}
            onChange={(layout) => actions.setDashboardLayout(layout as 'grid' | 'list' | 'masonry')}
          />

          <div class={styles.actionButtons}>
            <ActionButton
              onClick={() => actions.setShowWidgetModal(true)}
              icon="+"
              hideTextOnMobile={true}
            >
              Add Widget
            </ActionButton>

            <div class={styles.dropdownContainer}>
              <Button variant="ghost" class={styles.dropdownTrigger}>
                <Text as="span" class={styles.dropdownIcon}>⋮</Text>
              </Button>

              <div class={styles.dropdownMenu}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Reset dashboard to default layout?')) {
                      actions.resetLayout()
                    }
                  }}
                  class={`${styles.dropdownItem} ${styles.dropdownItemDefault}`}
                >
                  Reset Layout
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Clear all widgets? This cannot be undone.')) {
                      actions.clearLayout()
                    }
                  }}
                  class={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                >
                  Clear All Widgets
                </Button>
              </div>
            </div>
          </div>
        </>
      }
    >
      <DashboardErrorBoundary
        fallbackIcon="🥐"
        fallbackTitle="Dashboard Error"
        fallbackMessage="The bakery dashboard encountered an error and couldn't load properly."
      >
        <DashboardContent
          layout={state.dashboardLayout}
        />
      </DashboardErrorBoundary>
    </DashboardPageLayout>
  )
}

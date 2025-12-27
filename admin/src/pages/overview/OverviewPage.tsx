import { onMount } from 'solid-js'
import DashboardPageLayout from '~/layouts/DashboardPageLayout'
import DashboardErrorBoundary from '~/components/ErrorBoundary/DashboardErrorBoundary'
import DashboardContent from '~/components/DashboardContent/DashboardContent'
import DashboardActions from '~/components/DashboardActions/DashboardActions'
import { useAppStore } from '~/stores/appStore'
import { bakeryActions } from '~/stores/bakeryStore'
import { logger } from '~/utils/logger'

export default function OverviewPage() {
  const { state } = useAppStore()

  onMount(() => {
    bakeryActions.loadMockData()
    logger.info('BakeWind Bakery Dashboard initialized')
  })

  return (
    <DashboardPageLayout
      title="BakeWind Bakery Dashboard"
      subtitle="Welcome to your comprehensive bakery management workspace"
      actions={<DashboardActions />}
    >
      <DashboardErrorBoundary
        fallbackIcon="🥐"
        fallbackTitle="Dashboard Error"
        fallbackMessage="The bakery dashboard encountered an error and couldn't load properly."
      >
        <DashboardContent layout={state.dashboardLayout} />
      </DashboardErrorBoundary>
    </DashboardPageLayout>
  )
}

import { createSignal, onMount } from 'solid-js'
import { RouteSectionProps } from '@solidjs/router'
import Sidebar from '~/components/Sidebar/Sidebar'
import { useAppStore } from '~/stores/appStore'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout(props: RouteSectionProps) {
  const { state, actions } = useAppStore()
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  return (
    <div
      class={styles.container}
      classList={{
        [styles.containerCollapsed]: mounted() && state.sidebarCollapsed,
        [styles.containerExpanded]: !mounted() || !state.sidebarCollapsed
      }}
    >
      {/* Sidebar Component */}
      <Sidebar
        collapsed={mounted() ? state.sidebarCollapsed : false}
        onToggle={actions.setSidebarCollapsed}
        mobileOpen={mounted() ? state.sidebarOpen : false}
        onMobileToggle={actions.setSidebarOpen}
      />

      <div class={styles.contentArea}>
        {/* Scrollable Page Content */}
        <div class={styles.innerContent}>
          {props.children}
        </div>
      </div>
    </div>
  )
}

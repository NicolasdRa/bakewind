import { JSX, createSignal, onMount } from 'solid-js'
import { isServer } from 'solid-js/web'
import { useLocation } from '@solidjs/router'
import Sidebar from '~/components/Sidebar/Sidebar'
import Header from '~/components/Header/Header'
import { useAppStore } from '~/stores/appStore'
import styles from './DashboardLayout.module.css'

interface DashboardLayoutProps {
  children: JSX.Element
}

export default function DashboardLayout(props: DashboardLayoutProps) {
  const { state, actions } = useAppStore()
  const location = useLocation()
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  // Routes that should NOT show the generic dashboard header
  // These routes have their own specific headers built into their components
  const routesWithoutGenericHeader = [
    '/',
    '/orders',
    '/internal-orders', 
    '/inventory',
    '/recipes',
    '/production',
    '/customers',
    '/analytics',
    '/settings'
  ]

  const shouldShowGenericHeader = () => {
    const currentPath = location.pathname
    return !routesWithoutGenericHeader.includes(currentPath)
  }

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
        {/* Conditionally show the generic Dashboard Header */}
        {/* {shouldShowGenericHeader() && (
          <div class={styles.headerSection}>
            <Header />
          </div>
        )} */}

        {/* Scrollable Page Content */}
        <div class={styles.innerContent}>
          {props.children}
        </div>
      </div>
    </div>
  )
}
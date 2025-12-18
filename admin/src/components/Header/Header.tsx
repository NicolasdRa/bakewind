import { useAppStore } from '~/stores/appStore'
import { Show, createMemo } from 'solid-js'
import { useLocation } from '@solidjs/router'
import Button from '../common/Button'
import styles from './Header.module.css'

// Route configuration for header content
type RouteConfig = {
  title: string
  subtitle: string
  showControls: boolean
}

const routeConfig: Record<string, RouteConfig> = {
  '/': {
    title: 'BakeWind Bakery Dashboard',
    subtitle: 'Welcome to your comprehensive bakery management workspace',
    showControls: true
  },
  '/profile': {
    title: 'Profile Settings',
    subtitle: 'Manage your account and preferences',
    showControls: false
  },
  '/analytics': {
    title: 'Analytics',
    subtitle: 'View your data insights and metrics',
    showControls: false
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Configure your application settings',
    showControls: false
  }
}

export default function DashboardHeader() {
  const { state, actions } = useAppStore()
  const location = useLocation()

  // Get current route config
  const currentRoute = createMemo(() => {
    return routeConfig[location.pathname] || routeConfig['/']
  })

  const handleAddWidget = () => {
    actions.setShowWidgetModal(true)
  }

  const handleLayoutChange = (layout: 'grid' | 'list' | 'masonry') => {
    actions.setDashboardLayout(layout)
  }

  const handleClearLayout = () => {
    if (confirm('Remove all widgets from the dashboard?')) {
      actions.clearLayout()
    }
  }

  const handleResetLayout = () => {
    if (confirm('Reset dashboard to default layout?')) {
      actions.resetLayout()
    }
  }

  return (
    <div class={styles.container}>
      {/* Header */}
      <div class={styles.header}>
        <div class={styles.headerContent}>
          {/* Mobile hamburger menu */}
          <Button
            onClick={() => actions.setSidebarOpen(true)}
            variant="ghost"
            class={styles.mobileMenuButton}
            title="Open sidebar"
          >
            <svg class={styles.mobileMenuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          
          <div class={styles.titleSection}>
            <h1 class={styles.title}>{currentRoute().title}</h1>
            <p class={styles.subtitle}>{currentRoute().subtitle}</p>
          </div>
        </div>
        
        <Show when={currentRoute().showControls}>
          <div class={styles.controls}>
            {/* Layout Controls */}
            <div class={styles.layoutControls}>
              <Button
                onClick={() => handleLayoutChange('grid')}
                variant={state.dashboardLayout === 'grid' ? 'secondary' : 'ghost'}
                class={`${styles.layoutButton} ${
                  state.dashboardLayout === 'grid'
                    ? styles.layoutButtonActive
                    : styles.layoutButtonInactive
                }`}
                title="Grid Layout"
              >
                <span class={styles.layoutButtonText}>⊞</span>
                <span class={styles.layoutButtonTextDesktop}>Grid</span>
              </Button>
              <Button
                onClick={() => handleLayoutChange('list')}
                variant={state.dashboardLayout === 'list' ? 'secondary' : 'ghost'}
                class={`${styles.layoutButton} ${
                  state.dashboardLayout === 'list'
                    ? styles.layoutButtonActive
                    : styles.layoutButtonInactive
                }`}
                title="List Layout"
              >
                <span class={styles.layoutButtonText}>☰</span>
                <span class={styles.layoutButtonTextDesktop}>List</span>
              </Button>
              <Button
                onClick={() => handleLayoutChange('masonry')}
                variant={state.dashboardLayout === 'masonry' ? 'secondary' : 'ghost'}
                class={`${styles.layoutButton} ${
                  state.dashboardLayout === 'masonry'
                    ? styles.layoutButtonActive
                    : styles.layoutButtonInactive
                }`}
                title="Masonry Layout"
              >
                <span class={styles.layoutButtonText}>⊡</span>
                <span class={styles.layoutButtonTextDesktop}>Masonry</span>
              </Button>
            </div>

            {/* Action Buttons */}
            <div class={styles.actionButtons}>
              <Button
                onClick={handleAddWidget}
                variant="primary"
                class={styles.addButton}
              >
                <span class={styles.addButtonIcon}>+</span>
                <span class={styles.addButtonText}>Add Widget</span>
              </Button>

              <div class={styles.dropdownContainer}>
                <Button
                  variant="ghost"
                  class={styles.dropdownTrigger}
                >
                  <span class={styles.dropdownIcon}>⋮</span>
                </Button>

                {/* Dropdown Menu - No Portal needed */}
                <div class={styles.dropdownMenu}>
                  <Button
                    onClick={handleResetLayout}
                    variant="text"
                    class={`${styles.dropdownItem} ${styles.dropdownItemDefault}`}
                  >
                    Reset Layout
                  </Button>
                  <Button
                    onClick={handleClearLayout}
                    variant="text"
                    class={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  >
                    Clear All Widgets
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
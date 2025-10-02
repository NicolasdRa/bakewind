import { createStore } from 'solid-js/store'
import { createEffect } from 'solid-js'

// Define the app state interface
interface AppState {
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  showWidgetModal: boolean
  dashboardLayout: 'grid' | 'list' | 'masonry'
}

// Initialize the global store (SPA - no SSR concerns)
const [appState, setAppState] = createStore<AppState>({
  sidebarCollapsed: false,
  sidebarOpen: false,
  theme: 'light',
  showWidgetModal: false,
  dashboardLayout: 'grid'
})

// Dashboard action callbacks for widget management
const dashboardCallbacks = {
  clearLayout: null as (() => void) | null,
  resetLayout: null as (() => void) | null
}

// Store actions
export const appActions = {
  // Sidebar actions
  setSidebarCollapsed: (collapsed: boolean) => {
    setAppState('sidebarCollapsed', collapsed)
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  },

  setSidebarOpen: (open: boolean) => {
    setAppState('sidebarOpen', open)
  },

  // Theme actions
  setTheme: (theme: 'light' | 'dark') => {
    setAppState('theme', theme)
    localStorage.setItem('dashboardTheme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  },

  // Modal actions
  setShowWidgetModal: (show: boolean) => {
    setAppState('showWidgetModal', show)
  },

  // Dashboard layout actions
  setDashboardLayout: (layout: 'grid' | 'list' | 'masonry') => {
    setAppState('dashboardLayout', layout)
    localStorage.setItem('dashboardLayout', layout)
  },

  // Dashboard actions
  clearLayout: () => {
    if (dashboardCallbacks.clearLayout) {
      dashboardCallbacks.clearLayout()
    }
  },

  resetLayout: () => {
    if (dashboardCallbacks.resetLayout) {
      dashboardCallbacks.resetLayout()
    }
  },

  // Callback registration for dashboard actions
  onClearLayout: (callback: () => void) => {
    dashboardCallbacks.clearLayout = callback
  },

  onResetLayout: (callback: () => void) => {
    dashboardCallbacks.resetLayout = callback
  },

  // Initialize client state
  initializeClientState: () => {
    // Load saved states from localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed')
    const savedTheme = localStorage.getItem('dashboardTheme') || 'light'
    const savedLayout = localStorage.getItem('dashboardLayout') || 'grid'

    setAppState({
      sidebarCollapsed: savedSidebarState === 'true',
      theme: savedTheme as 'light' | 'dark',
      dashboardLayout: savedLayout as 'grid' | 'list' | 'masonry'
    })

    document.documentElement.setAttribute('data-theme', savedTheme)
  }
}

// Export the store state (read-only)
export { appState }

// Set up theme reactive effect (SPA only, no SSR check needed)
createEffect(() => {
  document.documentElement.setAttribute('data-theme', appState.theme)
})

// Export a composable for easy component integration
export const useAppStore = () => ({
  state: appState,
  actions: appActions
})

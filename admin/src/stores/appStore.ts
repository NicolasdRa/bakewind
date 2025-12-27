import { createStore } from 'solid-js/store'

// Define the app state interface
interface AppState {
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  bottomSheetExpanded: boolean
  theme: 'light' | 'dark'
  showWidgetModal: boolean
  dashboardLayout: 'grid' | 'list' | 'masonry'
}

// Initialize the global store (SPA - no SSR concerns)
const [appState, setAppState] = createStore<AppState>({
  sidebarCollapsed: false,
  sidebarOpen: false,
  bottomSheetExpanded: false,
  theme: 'dark',
  showWidgetModal: false,
  dashboardLayout: 'grid'
})

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

  // Bottom sheet actions
  setBottomSheetExpanded: (expanded: boolean) => {
    setAppState('bottomSheetExpanded', expanded)
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

  // Initialize client state
  initializeClientState: () => {
    // Load saved states from localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed')
    const savedTheme = localStorage.getItem('dashboardTheme') || 'dark'
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

// Export a composable for easy component integration
export const useAppStore = () => ({
  state: appState,
  actions: appActions
})

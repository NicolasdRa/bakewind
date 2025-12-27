import { createStore } from 'solid-js/store'
import type { TenantListItem } from '~/api/tenants'

const STORAGE_KEY = 'admin_selected_tenant'

// Define the admin state interface
interface AdminState {
  selectedTenantId: string | null
  selectedTenant: TenantListItem | null
  tenants: TenantListItem[]
  isLoadingTenants: boolean
  tenantsError: string | null
}

// Initialize the store
const [adminState, setAdminState] = createStore<AdminState>({
  selectedTenantId: null,
  selectedTenant: null,
  tenants: [],
  isLoadingTenants: false,
  tenantsError: null,
})

// Store actions
export const adminActions = {
  /**
   * Set the list of tenants (dedupes by ID to prevent duplicates)
   */
  setTenants: (tenants: TenantListItem[]) => {
    // Dedupe by ID to prevent duplicates from HMR or multiple loads
    const seen = new Set<string>()
    const uniqueTenants = tenants.filter((t) => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      return true
    })
    setAdminState('tenants', uniqueTenants)

    // If we have a selected tenant ID, find and update the selected tenant object
    const selectedId = adminState.selectedTenantId
    if (selectedId) {
      const tenant = uniqueTenants.find((t) => t.id === selectedId)
      if (tenant) {
        setAdminState('selectedTenant', tenant)
      } else {
        // Selected tenant no longer exists, clear selection
        adminActions.clearSelectedTenant()
      }
    }
  },

  /**
   * Set the selected tenant
   */
  setSelectedTenant: (tenantId: string) => {
    const tenant = adminState.tenants.find((t) => t.id === tenantId)
    if (tenant) {
      setAdminState('selectedTenantId', tenantId)
      setAdminState('selectedTenant', tenant)
      localStorage.setItem(STORAGE_KEY, tenantId)
    }
  },

  /**
   * Clear the selected tenant
   */
  clearSelectedTenant: () => {
    setAdminState('selectedTenantId', null)
    setAdminState('selectedTenant', null)
    localStorage.removeItem(STORAGE_KEY)
  },

  /**
   * Set loading state
   */
  setLoadingTenants: (loading: boolean) => {
    setAdminState('isLoadingTenants', loading)
  },

  /**
   * Set error state
   */
  setTenantsError: (error: string | null) => {
    setAdminState('tenantsError', error)
  },

  /**
   * Initialize from localStorage
   * Call this on app startup for ADMIN users
   */
  initializeFromStorage: () => {
    const savedTenantId = localStorage.getItem(STORAGE_KEY)
    if (savedTenantId) {
      setAdminState('selectedTenantId', savedTenantId)
      // The selectedTenant object will be set when tenants are loaded
    }
  },

  /**
   * Get the selected tenant ID for API requests
   * Returns null if no tenant is selected
   */
  getSelectedTenantId: (): string | null => {
    return adminState.selectedTenantId
  },
}

// Export the store state (read-only)
export { adminState }

// Export a composable for easy component integration
export const useAdminStore = () => {
  return {
    state: adminState,
    actions: adminActions,
  }
}

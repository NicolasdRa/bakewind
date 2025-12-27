import { createEffect } from 'solid-js'
import { useAdminStore } from '~/stores/adminStore'

/**
 * Triggers a refetch callback when the ADMIN's selected tenant changes.
 * Skips the initial run (onMount handles initial data fetch).
 *
 * @param refetch - Called when tenant changes to a new value
 * @param onClear - Optional callback when tenant is deselected (cleared to null)
 */
export function useTenantRefetch(refetch: () => void, onClear?: () => void) {
  const { state: adminState } = useAdminStore()

  // Use closure variables to track state without triggering reactivity
  let isFirstRun = true
  let lastTenantId: string | null = adminState.selectedTenantId

  createEffect(() => {
    // Access the reactive property to track it
    const currentTenantId = adminState.selectedTenantId

    // Skip the first run (initial mount)
    if (isFirstRun) {
      isFirstRun = false
      lastTenantId = currentTenantId
      return
    }

    // Only react if tenant actually changed
    if (currentTenantId !== lastTenantId) {
      lastTenantId = currentTenantId

      if (currentTenantId === null) {
        // Tenant was cleared
        if (onClear) {
          onClear()
        }
      } else {
        // Tenant was changed to a new value - refetch data
        refetch()
      }
    }
  })
}

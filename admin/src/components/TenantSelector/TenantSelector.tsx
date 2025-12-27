import { Component, createSignal, createEffect, onMount, Show, For } from 'solid-js'
import { useAdminStore } from '~/stores/adminStore'
import { getAllTenants, type TenantListItem } from '~/api/tenants'
import styles from './TenantSelector.module.css'

interface TenantSelectorProps {
  collapsed?: boolean
}

const TenantSelector: Component<TenantSelectorProps> = (props) => {
  const { state, actions } = useAdminStore()
  const [isOpen, setIsOpen] = createSignal(false)
  const [searchQuery, setSearchQuery] = createSignal('')

  // Load tenants on mount
  onMount(async () => {
    // Initialize from localStorage first
    actions.initializeFromStorage()

    // Always load fresh tenants from API
    await loadTenants()
  })

  const loadTenants = async () => {
    try {
      actions.setLoadingTenants(true)
      actions.setTenantsError(null)
      const response = await getAllTenants()
      actions.setTenants(response.tenants)
    } catch (error: any) {
      actions.setTenantsError(error?.data?.message || 'Failed to load tenants')
    } finally {
      actions.setLoadingTenants(false)
    }
  }

  const filteredTenants = () => {
    const query = searchQuery().toLowerCase()
    if (!query) return state.tenants
    return state.tenants.filter(
      (t) =>
        t.businessName.toLowerCase().includes(query) ||
        t.businessPhone?.toLowerCase().includes(query)
    )
  }

  const handleSelect = (tenant: TenantListItem) => {
    actions.setSelectedTenant(tenant.id)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: Event) => {
    e.stopPropagation()
    actions.clearSelectedTenant()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return styles.statusActive
      case 'trial':
        return styles.statusTrial
      case 'past_due':
        return styles.statusPastDue
      case 'canceled':
        return styles.statusCanceled
      default:
        return ''
    }
  }

  // Close dropdown when clicking outside
  createEffect(() => {
    if (isOpen()) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest(`.${styles.container}`)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  })

  return (
    <div class={styles.container} classList={{ [styles.collapsed]: props.collapsed }}>
      <button
        class={styles.trigger}
        onClick={() => setIsOpen(!isOpen())}
        title={props.collapsed ? state.selectedTenant?.businessName || 'Choose tenant' : undefined}
      >
        <div class={styles.triggerIcon}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <Show when={!props.collapsed}>
          <div class={styles.triggerContent}>
            <span class={styles.triggerLabel}>Viewing as:</span>
            <span class={styles.triggerValue}>
              {state.selectedTenant?.businessName || 'Choose tenant'}
            </span>
          </div>
          <Show when={state.selectedTenant}>
            <button class={styles.clearButton} onClick={handleClear} title="Clear selection">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Show>
          <svg
            class={styles.chevron}
            classList={{ [styles.chevronOpen]: isOpen() }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </Show>
      </button>

      <Show when={isOpen()}>
        <div class={styles.dropdown}>
          <div class={styles.searchContainer}>
            <svg class={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              class={styles.searchInput}
              placeholder="Search tenants..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              autofocus
            />
          </div>

          <div class={styles.tenantList}>
            <Show when={state.isLoadingTenants}>
              <div class={styles.loading}>Loading tenants...</div>
            </Show>

            <Show when={state.tenantsError}>
              <div class={styles.error}>{state.tenantsError}</div>
            </Show>

            <Show when={!state.isLoadingTenants && !state.tenantsError}>
              <Show when={filteredTenants().length === 0}>
                <div class={styles.empty}>No tenants found</div>
              </Show>

              <For each={filteredTenants()}>
                {(tenant) => (
                  <button
                    class={styles.tenantItem}
                    classList={{ [styles.tenantItemSelected]: tenant.id === state.selectedTenantId }}
                    onClick={() => handleSelect(tenant)}
                  >
                    <div class={styles.tenantInfo}>
                      <span class={styles.tenantName}>{tenant.businessName}</span>
                      <span class={styles.tenantPhone}>{tenant.businessPhone || 'No phone'}</span>
                    </div>
                    <span class={`${styles.statusBadge} ${getStatusBadgeClass(tenant.subscriptionStatus)}`}>
                      {tenant.subscriptionStatus}
                    </span>
                  </button>
                )}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default TenantSelector

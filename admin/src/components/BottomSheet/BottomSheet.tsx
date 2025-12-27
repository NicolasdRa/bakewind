import { Show, For, createMemo, JSX } from 'solid-js'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { useAppStore } from '~/stores/appStore'
import { useAuth } from '~/context/AuthContext'
import {
  navIcons,
  NavIconId,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from '~/components/icons'
import styles from './BottomSheet.module.css'

interface NavItem {
  id: NavIconId
  label: string
  path: string
}

export default function BottomSheet() {
  const { state, actions } = useAppStore()
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isExpanded = () => state.bottomSheetExpanded

  const toggleExpanded = () => {
    actions.setBottomSheetExpanded(!isExpanded())
  }

  const closeSheet = () => {
    actions.setBottomSheetExpanded(false)
  }

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    actions.setTheme(newTheme)
  }

  const handleLogout = async () => {
    try {
      closeSheet()
      await auth.logout(navigate)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Render icon by id
  const renderIcon = (id: NavIconId, className: string): JSX.Element => {
    const IconComponent = navIcons[id]
    return <IconComponent class={className} />
  }

  // Mini-bar items (5 primary nav items)
  const miniBarItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', path: '/dashboard/overview' },
    { id: 'customer-orders', label: 'Orders', path: '/dashboard/orders/customer' },
    { id: 'inventory', label: 'Inventory', path: '/dashboard/inventory' },
    { id: 'products', label: 'Products', path: '/dashboard/products' },
  ]

  // Full menu items based on user role
  const fullMenuItems = createMemo(() => {
    const items: NavItem[] = [
      { id: 'dashboard', label: 'Overview', path: '/dashboard/overview' },
      { id: 'customer-orders', label: 'Customer Orders', path: '/dashboard/orders/customer' },
      { id: 'internal-orders', label: 'Internal Orders', path: '/dashboard/orders/internal' },
      { id: 'inventory', label: 'Inventory', path: '/dashboard/inventory' },
      { id: 'recipes', label: 'Recipes', path: '/dashboard/recipes' },
      { id: 'products', label: 'Products', path: '/dashboard/products' },
      { id: 'production', label: 'Production', path: '/dashboard/production' },
      { id: 'customers', label: 'Customers', path: '/dashboard/customers' },
      { id: 'analytics', label: 'Analytics', path: '/dashboard/analytics' },
    ]

    if (auth.user?.role === 'OWNER') {
      items.push({ id: 'team', label: 'Team', path: '/dashboard/team' })
    }

    items.push({ id: 'profile', label: 'Profile', path: '/dashboard/profile' })

    if (auth.user?.role === 'OWNER') {
      items.push({ id: 'business-settings', label: 'Business', path: '/dashboard/settings/business' })
    }

    items.push({ id: 'settings', label: 'Settings', path: '/dashboard/settings' })

    return items
  })

  const isActive = (path: string) => {
    if (path === '/dashboard/overview') {
      return location.pathname === path || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const handleNavClick = () => {
    closeSheet()
  }

  return (
    <>
      {/* Backdrop */}
      <Show when={isExpanded()}>
        <div class={styles.backdrop} onClick={closeSheet} />
      </Show>

      {/* Bottom Sheet */}
      <div
        class={styles.bottomSheet}
        classList={{ [styles.expanded]: isExpanded() }}
      >
        {/* Drag Handle */}
        <div class={styles.dragHandle} onClick={toggleExpanded}>
          <div class={styles.dragIndicator} />
        </div>

        {/* Mini Bar (visible when collapsed) */}
        <Show when={!isExpanded()}>
          <div class={styles.miniBar}>
          <For each={miniBarItems}>
            {(item) => (
              <A
                href={item.path}
                class={styles.miniBarItem}
                classList={{ [styles.miniBarItemActive]: isActive(item.path) }}
                onClick={handleNavClick}
              >
                {renderIcon(item.id, styles.navIcon)}
                <span class={styles.miniBarLabel}>{item.label}</span>
              </A>
            )}
          </For>

          {/* More button to expand */}
          <button
            class={styles.miniBarItem}
            classList={{ [styles.miniBarItemActive]: isExpanded() }}
            onClick={toggleExpanded}
          >
            <MenuIcon class={styles.navIcon} />
            <span class={styles.miniBarLabel}>More</span>
          </button>
        </div>
        </Show>

        {/* Full Menu (visible when expanded) */}
        <Show when={isExpanded()}>
          <div class={styles.fullMenu}>
            {/* Header with close button */}
            <div class={styles.menuHeader}>
              <span class={styles.menuTitle}>Menu</span>
              <button class={styles.closeButton} onClick={closeSheet}>
                <CloseIcon class={styles.closeIcon} />
              </button>
            </div>

            {/* Navigation Grid */}
            <div class={styles.navGrid}>
              <For each={fullMenuItems()}>
                {(item) => (
                  <A
                    href={item.path}
                    class={styles.navItem}
                    classList={{ [styles.navItemActive]: isActive(item.path) }}
                    onClick={handleNavClick}
                  >
                    {renderIcon(item.id, styles.navIcon)}
                    <span class={styles.navLabel}>{item.label}</span>
                  </A>
                )}
              </For>
            </div>

            {/* Divider */}
            <div class={styles.divider} />

            {/* User Section */}
            <div class={styles.userSection}>
              {/* Theme Toggle */}
              <button class={styles.actionButton} onClick={toggleTheme}>
                <Show
                  when={state.theme === 'dark'}
                  fallback={<MoonIcon class={styles.actionIcon} />}
                >
                  <SunIcon class={styles.actionIcon} />
                </Show>
                <span>{state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>

              {/* User Info */}
              <Show when={auth.user}>
                <div class={styles.userInfo}>
                  <div class={styles.userAvatar}>
                    {(() => {
                      const u = auth.user
                      if (!u) return ''
                      const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
                      return displayName.substring(0, 2).toUpperCase()
                    })()}
                  </div>
                  <div class={styles.userDetails}>
                    <span class={styles.userName}>
                      {(() => {
                        const u = auth.user
                        if (!u) return 'User'
                        return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User'
                      })()}
                    </span>
                    <span class={styles.userEmail}>{auth.user?.email}</span>
                  </div>
                </div>

                {/* Sign Out */}
                <button class={styles.signOutButton} onClick={handleLogout}>
                  <LogoutIcon class={styles.actionIcon} />
                  <span>Sign Out</span>
                </button>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}

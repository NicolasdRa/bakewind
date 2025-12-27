import { Show, For, createSignal, createMemo, onMount, onCleanup, JSX } from 'solid-js'
import { Portal } from 'solid-js/web'
import { A, useNavigate } from '@solidjs/router'
import { useAppStore } from '~/stores/appStore'
import { useAuth } from '~/context/AuthContext'
import Logo from '~/components/Logo/Logo'
import Button from '~/components/common/Button'
import TenantSelector from '~/components/TenantSelector/TenantSelector'
import {
  navIcons,
  NavIconId,
  CloseIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
} from '~/components/icons'
import styles from './Sidebar.module.css'

interface SidebarProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
  mobileOpen: boolean
  onMobileToggle: (open: boolean) => void
}

export default function Sidebar(props: SidebarProps) {
  const { state, actions } = useAppStore()
  const auth = useAuth()
  const navigate = useNavigate()
  const [showUserDropdown, setShowUserDropdown] = createSignal(false)
  const [isLoggingOut, setIsLoggingOut] = createSignal(false)

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    actions.setTheme(newTheme)
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setShowUserDropdown(false)
      await auth.logout(navigate) // Calls API logout and navigates via router
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown())
  }

  // Close dropdown when clicking outside or pressing escape
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const userContainer = document.querySelector(`.${styles.userContainer}`)
      if (userContainer && !userContainer.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    })
  })

  // Render icon by id
  const renderIcon = (id: NavIconId, className: string): JSX.Element => {
    const IconComponent = navIcons[id]
    return <IconComponent class={className} />
  }

  // Build menu items based on user role - reactive using createMemo
  const menuItems = createMemo(() => {
    const items: { id: NavIconId; label: string; path: string }[] = [
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

    // Add Team menu for OWNER role
    if (auth.user?.role === 'OWNER') {
      items.push({ id: 'team', label: 'Team', path: '/dashboard/team' })
    }

    // Common items for all roles
    items.push(
      { id: 'profile', label: 'Profile', path: '/dashboard/profile' },
    )

    // Add Business Settings for OWNER role
    if (auth.user?.role === 'OWNER') {
      items.push({ id: 'business-settings', label: 'Business', path: '/dashboard/settings/business' })
    }

    items.push({ id: 'settings', label: 'Settings', path: '/dashboard/settings' })

    return items
  })

  // Defensive class calculation to prevent style loss during navigation
  const getSidebarClasses = () => {
    const classes = [styles.sidebar]

    if (props.mobileOpen) {
      classes.push(styles.sidebarMobileOpen)
    } else if (props.collapsed) {
      classes.push(styles.sidebarCollapsed)
    } else {
      classes.push(styles.sidebarExpanded)
    }

    return classes.join(' ')
  }

  return (
    <div
      class={getSidebarClasses()}
      data-sidebar-state={props.mobileOpen ? 'mobile-open' : props.collapsed ? 'collapsed' : 'expanded'}
    >
      {/* Sidebar Header */}
      <div class={styles.header}>
        {props.mobileOpen ? (
          // Mobile view - full header with close button
          <div class={styles.headerMobile}>
            <div class={styles.headerBranding}>
              <Logo size="small" />
              <Show when={auth.tenant}>
                <span class={styles.businessName}>{auth.tenant?.businessName}</span>
              </Show>
            </div>

            <Button
              variant="ghost"
              onClick={() => props.onMobileToggle(false)}
              class={styles.toggleButton}
              title="Close sidebar"
            >
              <CloseIcon class={styles.icon} />
            </Button>
          </div>
        ) : props.collapsed ? (
          // Desktop collapsed view - only expand button, no logo
          <div class={styles.headerCollapsed}>
            <Button
              variant="ghost"
              onClick={() => props.onToggle(!props.collapsed)}
              class={styles.toggleButtonCentered}
              title="Expand sidebar"
            >
              <ChevronRightIcon class={styles.iconSmall} />
            </Button>
          </div>
        ) : (
          // Desktop expanded view - horizontal layout
          <div class={styles.headerExpanded}>
            <div class={styles.headerBranding}>
              <Logo size="small" />
              <Show when={auth.tenant}>
                <span class={styles.businessName}>{auth.tenant?.businessName}</span>
              </Show>
            </div>

            <Button
              variant="ghost"
              onClick={() => props.onToggle(!props.collapsed)}
              class={styles.toggleButton}
              title="Collapse sidebar"
            >
              <ChevronLeftIcon class={styles.icon} />
            </Button>
          </div>
        )}
      </div>

      {/* Tenant Selector for ADMIN users */}
      <Show when={auth.user?.role === 'ADMIN'}>
        <TenantSelector collapsed={props.collapsed && !props.mobileOpen} />
      </Show>

      {/* Navigation Menu */}
      <nav class={styles.nav}>
        <ul class={styles.navList}>
          <For each={menuItems()}>
            {(item) => (
              <li>
                <A
                  href={item.path}
                  onClick={() => {
                    if (props.mobileOpen) {
                      // Close mobile sidebar after navigation
                      props.onMobileToggle(false)
                    }
                  }}
                  class={styles.navButton}
                  classList={{
                    [styles.navButtonMobile]: props.mobileOpen,
                    [styles.navButtonCollapsed]: !props.mobileOpen && props.collapsed,
                    [styles.navButtonExpanded]: !props.mobileOpen && !props.collapsed
                  }}
                  activeClass={styles.navButtonActive}
                  inactiveClass={styles.navButtonInactive}
                  end={item.path === '/dashboard/overview'}
                >
                  <span class={styles.navIconWrapper}>{renderIcon(item.id, styles.navIconSvg)}</span>
                  <Show when={props.mobileOpen || !props.collapsed}>
                    <span class={styles.navLabel}>{item.label}</span>
                  </Show>

                  {/* Tooltip for collapsed desktop state only */}
                  <Show when={props.collapsed && !props.mobileOpen}>
                    <Portal>
                      <div class={styles.tooltip}>
                        {item.label}
                      </div>
                    </Portal>
                  </Show>
                </A>
              </li>
            )}
          </For>
        </ul>
      </nav>

      {/* User Section */}
      <div class={styles.userSection}>
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          class={styles.themeButton}
          classList={{
            [styles.themeButtonMobile]: props.mobileOpen,
            [styles.themeButtonCollapsed]: !props.mobileOpen && props.collapsed,
            [styles.themeButtonExpanded]: !props.mobileOpen && !props.collapsed
          }}
          title={state.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <Show
            when={state.theme === 'dark'}
            fallback={<MoonIcon class={styles.themeIconSvg} />}
          >
            <SunIcon class={styles.themeIconSvg} />
          </Show>
          <Show when={props.mobileOpen || !props.collapsed}>
            <span class={styles.themeLabel}>{state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </Show>

          {/* Tooltip for collapsed desktop state only */}
          <Show when={props.collapsed && !props.mobileOpen}>
            <Portal>
              <div class={styles.tooltip}>
                {state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </div>
            </Portal>
          </Show>
        </Button>

        {/* User Profile with Dropdown */}
        <Show when={auth.user}>
          <div class={styles.userContainer}>
            <Button
              variant="ghost"
              onClick={toggleUserDropdown}
              class={styles.userProfile}
              classList={{
                [styles.userProfileMobile]: props.mobileOpen,
                [styles.userProfileCollapsed]: !props.mobileOpen && props.collapsed,
                [styles.userProfileExpanded]: !props.mobileOpen && !props.collapsed,
                [styles.userProfileActive]: showUserDropdown()
              }}
              title={props.collapsed && !props.mobileOpen ? (() => {
                const u = auth.user;
                if (!u) return undefined;
                return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
              })() : undefined}
            >
              <div
                class={styles.userAvatar}
                classList={{
                  [styles.userAvatarSmall]: props.collapsed && !props.mobileOpen,
                  [styles.userAvatarLarge]: !props.collapsed || props.mobileOpen
                }}
              >
                {(() => {
                  const u = auth.user;
                  if (!u) return '';
                  const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                  return displayName.substring(0, 2).toUpperCase();
                })()}
              </div>
              <Show when={props.mobileOpen || !props.collapsed}>
                <div class={styles.userInfo}>
                  <p class={styles.userName}>{(() => {
                    const u = auth.user;
                    if (!u) return 'No name';
                    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No name';
                  })()}</p>
                  <p class={styles.userEmail}>{auth.user?.email || 'No email provided'}</p>
                </div>
                <div class={styles.userChevron}>
                  <ChevronDownIcon
                    class={`${styles.chevronIcon} ${showUserDropdown() ? styles.chevronIconRotated : ''}`}
                  />
                </div>
              </Show>
            </Button>

            {/* User Dropdown Menu */}
            <Show when={showUserDropdown()}>
              <div
                class={styles.userDropdown}
                classList={{
                  [styles.userDropdownMobile]: props.mobileOpen,
                  [styles.userDropdownCollapsed]: !props.mobileOpen && props.collapsed,
                  [styles.userDropdownExpanded]: !props.mobileOpen && !props.collapsed
                }}
              >
                <div class={styles.dropdownContent}>
                  <div class={styles.dropdownHeader}>
                    <div class={styles.dropdownUserInfo}>
                      <p class={styles.dropdownUserName}>{(() => {
                        const u = auth.user;
                        if (!u) return 'No name';
                        return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No name';
                      })()}</p>
                      <p class={styles.dropdownUserId}>{auth.user?.email || 'No email provided'}</p>
                      <p class={styles.dropdownUserRole}>{auth.user?.role || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Tenant/Subscription Info */}
                  <Show when={auth.tenant}>
                    <div class={styles.dropdownDivider}></div>
                    <div class={styles.dropdownTenantInfo}>
                      <p class={styles.dropdownTenantName}>{auth.tenant?.businessName}</p>
                      {/* Only show subscription status to OWNER and ADMIN, not STAFF */}
                      <Show when={auth.user?.role !== 'STAFF'}>
                        <Show when={auth.isTrialActive}>
                          <div class={styles.trialBadge}>
                            <span class={styles.trialBadgeIcon}>⏱</span>
                            <span>{auth.trialDaysRemaining} days left in trial</span>
                          </div>
                        </Show>
                        <Show when={!auth.isTrialActive && auth.tenant?.subscriptionStatus === 'active'}>
                          <div class={styles.activeBadge}>
                            <span class={styles.activeBadgeIcon}>✓</span>
                            <span>Active subscription</span>
                          </div>
                        </Show>
                        <Show when={auth.tenant?.subscriptionStatus === 'past_due'}>
                          <div class={styles.warningBadge}>
                            <span class={styles.warningBadgeIcon}>⚠</span>
                            <span>Payment past due</span>
                          </div>
                        </Show>
                      </Show>
                    </div>
                  </Show>

                  <div class={styles.dropdownDivider}></div>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    class={styles.dropdownLogoutButton}
                    disabled={isLoggingOut()}
                  >
                    <Show
                      when={!isLoggingOut()}
                      fallback={
                        <>
                          <div class={styles.logoutSpinner}></div>
                          <span class={styles.dropdownLogoutText}>Signing out...</span>
                        </>
                      }
                    >
                      <LogoutIcon class={styles.dropdownLogoutIcon} />
                      <span class={styles.dropdownLogoutText}>Sign Out</span>
                    </Show>
                  </Button>
                </div>
              </div>
            </Show>

            {/* Tooltip for collapsed desktop state only */}
            <Show when={props.collapsed && !props.mobileOpen && !showUserDropdown()}>
              <Portal>
                <div class={styles.tooltip}>
                  {(() => {
                    const u = auth.user;
                    if (!u) return '';
                    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                  })()}
                </div>
              </Portal>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  )
}

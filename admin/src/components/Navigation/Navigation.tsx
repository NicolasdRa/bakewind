import { Component, createSignal, Show, For } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import styles from './Navigation.module.css';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  badge?: number | string;
  subItems?: NavigationItem[];
}

const Navigation: Component = () => {
  const auth = useAuth();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = createSignal<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const navigationItems: NavigationItem[] = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '📊',
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: '📦',
      badge: 5, // Example: pending orders count
    },
    {
      path: '/inventory',
      label: 'Inventory',
      icon: '📋',
      subItems: [
        { path: '/inventory/stock', label: 'Stock Levels', icon: '📈' },
        { path: '/inventory/movements', label: 'Movements', icon: '↔️' },
        { path: '/inventory/alerts', label: 'Low Stock Alerts', icon: '⚠️', badge: 3 },
      ],
    },
    {
      path: '/production',
      label: 'Production',
      icon: '🏭',
      subItems: [
        { path: '/production/schedule', label: 'Schedule', icon: '📅' },
        { path: '/production/batches', label: 'Batches', icon: '🥖' },
        { path: '/production/planning', label: 'Planning', icon: '📝' },
      ],
    },
    {
      path: '/recipes',
      label: 'Recipes',
      icon: '📖',
    },
    {
      path: '/customers',
      label: 'Customers',
      icon: '👥',
      badge: '127', // Example: total active customers
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: '📈',
      subItems: [
        { path: '/analytics/sales', label: 'Sales Report', icon: '💰' },
        { path: '/analytics/products', label: 'Product Performance', icon: '🍞' },
        { path: '/analytics/customers', label: 'Customer Insights', icon: '🎯' },
        { path: '/analytics/trends', label: 'Trends', icon: '📊' },
      ],
    },
  ];

  const toggleSection = (path: string) => {
    const expanded = new Set(expandedSections());
    if (expanded.has(path)) {
      expanded.delete(path);
    } else {
      expanded.add(path);
    }
    setExpandedSections(expanded);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => isActive(subItem.path));
    }
    return false;
  };

  const navClasses = () => {
    const classes = [styles.navigation];
    if (isCollapsed()) classes.push(styles.collapsed);
    return classes.join(' ');
  };

  const navLinkClasses = (active: boolean) => {
    const classes = [styles.navLink];
    if (active) classes.push(styles.navLinkActive);
    return classes.join(' ');
  };

  const subNavLinkClasses = (active: boolean) => {
    const classes = [styles.subNavLink];
    if (active) classes.push(styles.subNavLinkActive);
    return classes.join(' ');
  };

  return (
    <nav class={navClasses()}>
      <div class={styles.header}>
        <Show when={!isCollapsed()}>
          <div class={styles.brand}>
            <span class={styles.brandIcon}>🥐</span>
            <span class={styles.brandName}>BakeWind</span>
          </div>
        </Show>
        <Button
          variant="ghost"
          class={styles.collapseToggle}
          onClick={() => setIsCollapsed(!isCollapsed())}
          type="button"
          aria-label="Toggle navigation"
        >
          <span>{isCollapsed() ? '→' : '←'}</span>
        </Button>
      </div>

      <div class={styles.content}>
        <ul class={styles.navList}>
          <For each={navigationItems}>
            {(item) => (
              <li class={styles.navItem}>
                <Show
                  when={!item.subItems}
                  fallback={
                    <>
                      <button
                        class={navLinkClasses(isParentActive(item))}
                        onClick={() => toggleSection(item.path)}
                        type="button"
                      >
                        <span class={styles.navIcon}>{item.icon}</span>
                        <Show when={!isCollapsed()}>
                          <span class={styles.navLabel}>{item.label}</span>
                          <Show when={item.badge}>
                            <span class={styles.navBadge}>{item.badge}</span>
                          </Show>
                          <span class={styles.expandIcon}>
                            {expandedSections().has(item.path) ? '▼' : '▶'}
                          </span>
                        </Show>
                      </button>
                      <Show when={expandedSections().has(item.path) && !isCollapsed()}>
                        <ul class={styles.subNavList}>
                          <For each={item.subItems}>
                            {(subItem) => (
                              <li class={styles.subNavItem}>
                                <A
                                  href={subItem.path}
                                  class={subNavLinkClasses(isActive(subItem.path))}
                                >
                                  <span class={styles.subNavIcon}>{subItem.icon}</span>
                                  <span class={styles.subNavLabel}>{subItem.label}</span>
                                  <Show when={subItem.badge}>
                                    <span class={`${styles.navBadge} ${styles.navBadgeSmall}`}>{subItem.badge}</span>
                                  </Show>
                                </A>
                              </li>
                            )}
                          </For>
                        </ul>
                      </Show>
                    </>
                  }
                >
                  <A
                    href={item.path}
                    class={navLinkClasses(isActive(item.path))}
                    end={item.path === '/'}
                  >
                    <span class={styles.navIcon}>{item.icon}</span>
                    <Show when={!isCollapsed()}>
                      <span class={styles.navLabel}>{item.label}</span>
                      <Show when={item.badge}>
                        <span class={styles.navBadge}>{item.badge}</span>
                      </Show>
                    </Show>
                  </A>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </div>

      <div class={styles.footer}>
        <Show when={auth.user && !isCollapsed()}>
          <div class={styles.userSection}>
            <div class={styles.userAvatar}>
              {auth.user?.firstName?.[0]}{auth.user?.lastName?.[0]}
            </div>
            <div class={styles.userDetails}>
              <p class={styles.userName}>
                {auth.user?.firstName} {auth.user?.lastName}
              </p>
              <p class={styles.userRole}>{auth.user?.role}</p>
            </div>
          </div>
        </Show>
        <Show when={auth.user?.subscriptionStatus === 'trial' && !isCollapsed()}>
          <div class={styles.trialNotice}>
            <p class={styles.trialText}>Trial Account</p>
            <Show when={auth.user?.trialEndsAt}>
              <p class={styles.trialCountdown}>
                {auth.user?.trialEndsAt && Math.ceil((new Date(auth.user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
              </p>
            </Show>
            <A href="/upgrade" class={styles.upgradeButton}>
              Upgrade Now
            </A>
          </div>
        </Show>
      </div>
    </nav>
  );
};

export default Navigation;

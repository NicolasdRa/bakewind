import { Component, createSignal, Show, For } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';

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

  return (
    <nav class={`navigation ${isCollapsed() ? 'collapsed' : ''}`}>
      <div class="navigation-header">
        <Show when={!isCollapsed()}>
          <div class="brand">
            <span class="brand-icon">🥐</span>
            <span class="brand-name">BakeWind</span>
          </div>
        </Show>
        <button
          class="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed())}
          type="button"
          aria-label="Toggle navigation"
        >
          <span>{isCollapsed() ? '→' : '←'}</span>
        </button>
      </div>

      <div class="navigation-content">
        <ul class="nav-list">
          <For each={navigationItems}>
            {(item) => (
              <li class={`nav-item ${isParentActive(item) ? 'active' : ''}`}>
                <Show
                  when={!item.subItems}
                  fallback={
                    <>
                      <button
                        class={`nav-link expandable ${isParentActive(item) ? 'active' : ''}`}
                        onClick={() => toggleSection(item.path)}
                        type="button"
                      >
                        <span class="nav-icon">{item.icon}</span>
                        <Show when={!isCollapsed()}>
                          <span class="nav-label">{item.label}</span>
                          <Show when={item.badge}>
                            <span class="nav-badge">{item.badge}</span>
                          </Show>
                          <span class="expand-icon">
                            {expandedSections().has(item.path) ? '▼' : '▶'}
                          </span>
                        </Show>
                      </button>
                      <Show when={expandedSections().has(item.path) && !isCollapsed()}>
                        <ul class="sub-nav-list">
                          <For each={item.subItems}>
                            {(subItem) => (
                              <li class="sub-nav-item">
                                <A
                                  href={subItem.path}
                                  class={`sub-nav-link ${isActive(subItem.path) ? 'active' : ''}`}
                                >
                                  <span class="sub-nav-icon">{subItem.icon}</span>
                                  <span class="sub-nav-label">{subItem.label}</span>
                                  <Show when={subItem.badge}>
                                    <span class="nav-badge small">{subItem.badge}</span>
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
                    class={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    end={item.path === '/'}
                  >
                    <span class="nav-icon">{item.icon}</span>
                    <Show when={!isCollapsed()}>
                      <span class="nav-label">{item.label}</span>
                      <Show when={item.badge}>
                        <span class="nav-badge">{item.badge}</span>
                      </Show>
                    </Show>
                  </A>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </div>

      <div class="navigation-footer">
        <Show when={auth.user && !isCollapsed()}>
          <div class="user-section">
            <div class="user-avatar">
              {auth.user?.firstName?.[0]}{auth.user?.lastName?.[0]}
            </div>
            <div class="user-details">
              <p class="user-name">
                {auth.user?.firstName} {auth.user?.lastName}
              </p>
              <p class="user-role">{auth.user?.role}</p>
            </div>
          </div>
        </Show>
        <Show when={auth.user?.subscriptionStatus === 'trial' && !isCollapsed()}>
          <div class="trial-notice">
            <p class="trial-text">Trial Account</p>
            <Show when={auth.user?.trialEndsAt}>
              <p class="trial-countdown">
                {auth.user?.trialEndsAt && Math.ceil((new Date(auth.user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
              </p>
            </Show>
            <A href="/upgrade" class="upgrade-button">
              Upgrade Now
            </A>
          </div>
        </Show>
      </div>

      <style>{`
        .navigation {
          display: flex;
          flex-direction: column;
          width: 280px;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transition: width 0.3s ease;
          position: relative;
        }

        .navigation.collapsed {
          width: 80px;
        }

        .navigation-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          font-size: 1.5rem;
        }

        .brand-name {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .collapse-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .collapse-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .navigation-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
        }

        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          margin-bottom: 0.25rem;
        }

        .nav-link,
        .nav-link.expandable {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .nav-link:hover,
        .nav-link.expandable:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-link.active,
        .nav-link.expandable.active {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: white;
        }

        .nav-icon {
          font-size: 1.25rem;
          min-width: 28px;
          text-align: center;
        }

        .nav-label {
          flex: 1;
          font-weight: 500;
        }

        .nav-badge {
          background: transparent;
          color: white;
          border: 1.5px solid white;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .nav-badge.small {
          font-size: 0.625rem;
          padding: 0.0625rem 0.375rem;
        }

        .expand-icon {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .sub-nav-list {
          list-style: none;
          padding: 0;
          margin: 0.25rem 0 0 0;
          background: rgba(0, 0, 0, 0.1);
        }

        .sub-nav-item {
          margin: 0;
        }

        .sub-nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem 0.5rem 3rem;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .sub-nav-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }

        .sub-nav-link.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .sub-nav-icon {
          font-size: 1rem;
          min-width: 20px;
        }

        .sub-nav-label {
          flex: 1;
        }

        .navigation-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          margin: 0 0 0.125rem 0;
        }

        .user-role {
          font-size: 0.75rem;
          opacity: 0.8;
          margin: 0;
        }

        .trial-notice {
          background: rgba(251, 191, 36, 0.2);
          border: 1px solid rgba(251, 191, 36, 0.4);
          border-radius: 8px;
          padding: 0.75rem;
          text-align: center;
        }

        .trial-text {
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .trial-countdown {
          font-size: 0.875rem;
          opacity: 0.9;
          margin: 0 0 0.75rem 0;
        }

        .upgrade-button {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .upgrade-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .navigation.collapsed .nav-label,
        .navigation.collapsed .nav-badge,
        .navigation.collapsed .expand-icon,
        .navigation.collapsed .sub-nav-list,
        .navigation.collapsed .user-details,
        .navigation.collapsed .trial-notice {
          display: none;
        }

        .navigation.collapsed .user-section {
          justify-content: center;
        }

        .navigation.collapsed .navigation-header {
          justify-content: center;
        }

        @media (max-width: 768px) {
          .navigation {
            position: fixed;
            left: -280px;
            z-index: 1000;
            transition: left 0.3s ease;
          }

          .navigation.open {
            left: 0;
          }

          .navigation.collapsed {
            width: 280px;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;
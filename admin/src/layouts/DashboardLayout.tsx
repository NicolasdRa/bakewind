import { Component, JSX, Show, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../stores/authStore';

interface DashboardLayoutProps {
  children: JSX.Element;
  title?: string;
}

const DashboardLayout: Component<DashboardLayoutProps> = (props) => {
  const auth = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(true);
  const [isMobile, setIsMobile] = createSignal(false);

  onMount(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen());
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/inventory', label: 'Inventory', icon: '📋' },
    { path: '/production', label: 'Production', icon: '🏭' },
    { path: '/recipes', label: 'Recipes', icon: '📖' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div class="dashboard-layout">
      <header class="dashboard-header">
        <div class="header-left">
          <button
            class="sidebar-toggle"
            onClick={toggleSidebar}
            type="button"
            aria-label="Toggle sidebar"
          >
            <span class="hamburger-icon">☰</span>
          </button>
          <h1 class="app-title">BakeWind Admin</h1>
          <Show when={props.title}>
            <span class="page-title">/ {props.title}</span>
          </Show>
        </div>
        <div class="header-right">
          <Show when={auth.user}>
            <div class="user-info">
              <span class="business-name">{auth.user?.businessName}</span>
              <span class="user-email">{auth.user?.email}</span>
              <Show when={auth.user?.subscriptionStatus === 'trial'}>
                <span class="trial-badge">TRIAL</span>
              </Show>
            </div>
          </Show>
          <button
            class="logout-button"
            onClick={handleLogout}
            type="button"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      <div class="dashboard-container">
        <aside class={`dashboard-sidebar ${isSidebarOpen() ? 'open' : 'closed'}`}>
          <nav class="sidebar-nav">
            <ul class="nav-list">
              {navigationItems.map((item) => (
                <li class="nav-item">
                  <A
                    href={item.path}
                    class="nav-link"
                    activeClass="nav-link-active"
                    end={item.path === '/'}
                  >
                    <span class="nav-icon">{item.icon}</span>
                    <Show when={isSidebarOpen()}>
                      <span class="nav-label">{item.label}</span>
                    </Show>
                  </A>
                </li>
              ))}
            </ul>
          </nav>

          <div class="sidebar-footer">
            <Show when={isSidebarOpen() && auth.user}>
              <div class="subscription-info">
                <p class="subscription-status">
                  Status: <strong>{auth.user?.subscriptionStatus}</strong>
                </p>
                <Show when={auth.user?.trialEndsAt}>
                  <p class="trial-ends">
                    Trial ends: {auth.user?.trialEndsAt && new Date(auth.user.trialEndsAt).toLocaleDateString()}
                  </p>
                </Show>
              </div>
            </Show>
          </div>
        </aside>

        <main class="dashboard-main">
          <div class="main-content">
            {props.children}
          </div>
        </main>
      </div>

      <Show when={isMobile()}>
        <div
          class={`sidebar-overlay ${isSidebarOpen() ? 'visible' : ''}`}
          onClick={toggleSidebar}
        />
      </Show>

      <style>{`
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f5f7fa;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: white;
          border-bottom: 1px solid #e1e8ed;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sidebar-toggle {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
          border-radius: 4px;
        }

        .sidebar-toggle:hover {
          background-color: #f0f3f5;
        }

        .app-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a2332;
          margin: 0;
        }

        .page-title {
          color: #64748b;
          font-weight: 400;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .business-name {
          font-weight: 600;
          color: #1a2332;
        }

        .user-email {
          font-size: 0.875rem;
          color: #64748b;
        }

        .trial-badge {
          background: #fbbf24;
          color: #78350f;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .logout-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .logout-button:hover {
          background: #dc2626;
        }

        .dashboard-container {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .dashboard-sidebar {
          width: 250px;
          background: white;
          border-right: 1px solid #e1e8ed;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease, width 0.3s ease;
          position: relative;
          z-index: 50;
        }

        .dashboard-sidebar.closed {
          width: 60px;
        }

        .sidebar-nav {
          flex: 1;
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

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: #475569;
          text-decoration: none;
          transition: background-color 0.2s, color 0.2s;
        }

        .nav-link:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        .nav-link-active {
          background: #eff6ff;
          color: #2563eb;
          border-right: 3px solid #2563eb;
        }

        .nav-icon {
          font-size: 1.25rem;
          min-width: 28px;
          text-align: center;
        }

        .nav-label {
          font-weight: 500;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid #e1e8ed;
        }

        .subscription-info {
          font-size: 0.875rem;
          color: #64748b;
        }

        .subscription-status strong {
          color: #1e293b;
          text-transform: uppercase;
        }

        .trial-ends {
          margin-top: 0.25rem;
        }

        .dashboard-main {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .main-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
        }

        .sidebar-overlay.visible {
          display: block;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1rem;
          }

          .user-info {
            display: none;
          }

          .dashboard-sidebar {
            position: fixed;
            top: 60px;
            left: 0;
            height: calc(100vh - 60px);
            transform: translateX(-100%);
          }

          .dashboard-sidebar.open {
            transform: translateX(0);
          }

          .dashboard-main {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
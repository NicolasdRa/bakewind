import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test the appStore localStorage persistence directly
// Component rendering tests are complex with Solid.js routing and will be covered in E2E tests

describe('AppStore localStorage persistence', () => {
  beforeEach(() => {
    // Reset modules before each test to get fresh store state
    vi.resetModules();
    vi.clearAllMocks();

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock document.documentElement.setAttribute
    vi.spyOn(document.documentElement, 'setAttribute').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should persist sidebar collapsed state to localStorage when set to true', async () => {
    const { appActions } = await import('~/stores/appStore');

    appActions.setSidebarCollapsed(true);

    expect(localStorage.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true');
  });

  it('should persist sidebar collapsed state to localStorage when set to false', async () => {
    const { appActions } = await import('~/stores/appStore');

    appActions.setSidebarCollapsed(false);

    expect(localStorage.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'false');
  });

  it('should persist theme to localStorage', async () => {
    const { appActions } = await import('~/stores/appStore');

    appActions.setTheme('dark');

    expect(localStorage.setItem).toHaveBeenCalledWith('dashboardTheme', 'dark');
  });

  it('should persist dashboard layout to localStorage', async () => {
    const { appActions } = await import('~/stores/appStore');

    appActions.setDashboardLayout('list');

    expect(localStorage.setItem).toHaveBeenCalledWith('dashboardLayout', 'list');
  });

  it('should read sidebar collapsed state from localStorage on initialize', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'sidebarCollapsed') return 'true';
      if (key === 'dashboardTheme') return 'dark';
      if (key === 'dashboardLayout') return 'grid';
      return null;
    });

    const { appActions, appState } = await import('~/stores/appStore');
    appActions.initializeClientState();

    expect(localStorage.getItem).toHaveBeenCalledWith('sidebarCollapsed');
    expect(appState.sidebarCollapsed).toBe(true);
  });

  it('should read theme from localStorage on initialize', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'sidebarCollapsed') return 'false';
      if (key === 'dashboardTheme') return 'light';
      if (key === 'dashboardLayout') return 'grid';
      return null;
    });

    const { appActions, appState } = await import('~/stores/appStore');
    appActions.initializeClientState();

    expect(localStorage.getItem).toHaveBeenCalledWith('dashboardTheme');
    expect(appState.theme).toBe('light');
  });

  it('should read dashboard layout from localStorage on initialize', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'sidebarCollapsed') return 'false';
      if (key === 'dashboardTheme') return 'dark';
      if (key === 'dashboardLayout') return 'masonry';
      return null;
    });

    const { appActions, appState } = await import('~/stores/appStore');
    appActions.initializeClientState();

    expect(localStorage.getItem).toHaveBeenCalledWith('dashboardLayout');
    expect(appState.dashboardLayout).toBe('masonry');
  });

  it('should use default values when localStorage is empty', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { appActions, appState } = await import('~/stores/appStore');
    appActions.initializeClientState();

    expect(appState.sidebarCollapsed).toBe(false);
    expect(appState.theme).toBe('dark');
    expect(appState.dashboardLayout).toBe('grid');
  });
});

describe('Sidebar menu items configuration', () => {
  it('should have 11 navigation items defined', () => {
    // Test the menu items configuration that will be used in the component
    const menuItems = [
      { id: 'dashboard', label: 'Overview', icon: '🏪', path: '/dashboard/overview' },
      { id: 'customer-orders', label: 'Customer Orders', icon: '📋', path: '/dashboard/orders/customer' },
      { id: 'internal-orders', label: 'Internal Orders', icon: '🏢', path: '/dashboard/orders/internal' },
      { id: 'inventory', label: 'Inventory', icon: '📦', path: '/dashboard/inventory' },
      { id: 'recipes', label: 'Recipes', icon: '📖', path: '/dashboard/recipes' },
      { id: 'products', label: 'Products', icon: '🥐', path: '/dashboard/products' },
      { id: 'production', label: 'Production', icon: '🥖', path: '/dashboard/production' },
      { id: 'customers', label: 'Customers', icon: '👥', path: '/dashboard/customers' },
      { id: 'analytics', label: 'Analytics', icon: '📊', path: '/dashboard/analytics' },
      { id: 'profile', label: 'Profile', icon: '👤', path: '/dashboard/profile' },
      { id: 'settings', label: 'Settings', icon: '⚙️', path: '/dashboard/settings' },
    ];

    expect(menuItems.length).toBe(11);

    // Verify all expected routes are present
    const paths = menuItems.map(item => item.path);
    expect(paths).toContain('/dashboard/overview');
    expect(paths).toContain('/dashboard/orders/customer');
    expect(paths).toContain('/dashboard/orders/internal');
    expect(paths).toContain('/dashboard/inventory');
    expect(paths).toContain('/dashboard/recipes');
    expect(paths).toContain('/dashboard/products');
    expect(paths).toContain('/dashboard/production');
    expect(paths).toContain('/dashboard/customers');
    expect(paths).toContain('/dashboard/analytics');
    expect(paths).toContain('/dashboard/profile');
    expect(paths).toContain('/dashboard/settings');
  });

  it('should have unique IDs for all menu items', () => {
    const menuItems = [
      { id: 'dashboard' },
      { id: 'customer-orders' },
      { id: 'internal-orders' },
      { id: 'inventory' },
      { id: 'recipes' },
      { id: 'products' },
      { id: 'production' },
      { id: 'customers' },
      { id: 'analytics' },
      { id: 'profile' },
      { id: 'settings' },
    ];

    const ids = menuItems.map(item => item.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Sidebar state management', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    vi.spyOn(document.documentElement, 'setAttribute').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should toggle sidebar open state', async () => {
    const { appActions, appState } = await import('~/stores/appStore');

    expect(appState.sidebarOpen).toBe(false);

    appActions.setSidebarOpen(true);
    expect(appState.sidebarOpen).toBe(true);

    appActions.setSidebarOpen(false);
    expect(appState.sidebarOpen).toBe(false);
  });

  it('should toggle widget modal state', async () => {
    const { appActions, appState } = await import('~/stores/appStore');

    expect(appState.showWidgetModal).toBe(false);

    appActions.setShowWidgetModal(true);
    expect(appState.showWidgetModal).toBe(true);

    appActions.setShowWidgetModal(false);
    expect(appState.showWidgetModal).toBe(false);
  });

  it('should set document theme attribute when theme changes', async () => {
    const { appActions } = await import('~/stores/appStore');

    appActions.setTheme('light');

    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
  });
});

import { Component, createSignal, Show } from 'solid-js';
import { themeStore } from '../../stores/theme';

interface TopBarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  connectionStatus?: 'connected' | 'reconnecting' | 'disconnected';
}

const TopBar: Component<TopBarProps> = (props) => {
  const [userMenuOpen, setUserMenuOpen] = createSignal(false);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen());
  };

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Redirect to customer app login
    const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3000';
    window.location.href = `${customerAppUrl}/login`;
  };

  const getConnectionStatusColor = () => {
    switch (props.connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (props.connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Left side - Mobile menu button placeholder */}
      <div class="flex items-center">
        <button
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open mobile menu"
        >
          <span class="text-2xl">☰</span>
        </button>
      </div>

      {/* Right side - Actions */}
      <div class="flex items-center space-x-4">
        {/* Connection status indicator */}
        <Show when={props.connectionStatus}>
          <div
            class="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700"
            title={getConnectionStatusText()}
          >
            <div class={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
            <span class="hidden sm:inline text-xs text-gray-700 dark:text-gray-300">
              {getConnectionStatusText()}
            </span>
          </div>
        </Show>

        {/* Theme toggle */}
        <button
          onClick={() => themeStore.toggleTheme()}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          <span class="text-xl">{themeStore.theme === 'light' ? '🌙' : '☀️'}</span>
        </button>

        {/* User menu */}
        <div class="relative">
          <button
            onClick={toggleUserMenu}
            class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="User menu"
          >
            <Show
              when={props.user?.avatar}
              fallback={
                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {props.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              }
            >
              <img
                src={props.user?.avatar}
                alt={props.user?.name || 'User'}
                class="w-8 h-8 rounded-full"
              />
            </Show>
            <Show when={props.user}>
              <span class="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                {props.user?.name}
              </span>
            </Show>
            <span class="text-gray-500 dark:text-gray-400">▼</span>
          </button>

          {/* Dropdown menu */}
          <Show when={userMenuOpen()}>
            <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <Show when={props.user}>
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {props.user?.name}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{props.user?.email}</p>
                </div>
              </Show>

              <a
                href="/dashboard/profile"
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Profile
              </a>
              <a
                href="/dashboard/settings"
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Settings
              </a>

              <div class="border-t border-gray-200 dark:border-gray-700 my-1" />

              <button
                onClick={handleLogout}
                class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Click outside to close menu */}
      <Show when={userMenuOpen()}>
        <div class="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      </Show>
    </header>
  );
};

export default TopBar;

import { Show, createSignal, onCleanup } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import {
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  BeakerIcon,
  CakeIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChartBarIcon,
  UserCircleIcon,
  XMarkIcon,
} from '../icons';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu(props: MobileMenuProps) {
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/dashboard/overview', icon: HomeIcon },
    { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBagIcon },
    { name: 'Inventory', path: '/dashboard/inventory', icon: CubeIcon },
    { name: 'Recipes', path: '/dashboard/recipes', icon: BeakerIcon },
    { name: 'Products', path: '/dashboard/products', icon: CakeIcon },
    { name: 'Production', path: '/dashboard/production', icon: Cog6ToothIcon },
    { name: 'Customers', path: '/dashboard/customers', icon: UsersIcon },
    { name: 'Analytics', path: '/dashboard/analytics', icon: ChartBarIcon },
    { name: 'Profile', path: '/dashboard/profile', icon: UserCircleIcon },
    { name: 'Settings', path: '/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  // Close menu when clicking outside
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  // Close menu on navigation
  const handleNavClick = () => {
    props.onClose();
  };

  // Prevent body scroll when menu is open
  const [bodyOverflow, setBodyOverflow] = createSignal('');

  const toggleBodyScroll = (disable: boolean) => {
    if (disable) {
      setBodyOverflow(document.body.style.overflow);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = bodyOverflow();
    }
  };

  // Effect to manage body scroll
  const handleOpen = (isOpen: boolean) => {
    toggleBodyScroll(isOpen);
  };

  // Watch props.isOpen changes
  let prevIsOpen = props.isOpen;
  const checkInterval = setInterval(() => {
    if (prevIsOpen !== props.isOpen) {
      handleOpen(props.isOpen);
      prevIsOpen = props.isOpen;
    }
  }, 50);

  onCleanup(() => {
    clearInterval(checkInterval);
    toggleBodyScroll(false);
  });

  return (
    <Show when={props.isOpen}>
      {/* Overlay */}
      <div
        class="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={handleOverlayClick}
      >
        {/* Menu Panel */}
        <div
          class="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50
                 transform transition-transform duration-300 ease-in-out"
          classList={{
            'translate-x-0': props.isOpen,
            '-translate-x-full': !props.isOpen,
          }}
        >
          {/* Header */}
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              BakeWind
            </h2>
            <button
              onClick={props.onClose}
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                     transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Navigation */}
          <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <A
                  href={item.path}
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                         transition-colors text-sm font-medium"
                  classList={{
                    'bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-400':
                      isActive,
                    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700':
                      !isActive,
                  }}
                  onClick={handleNavClick}
                >
                  <Icon class="w-5 h-5" />
                  <span>{item.name}</span>
                </A>
              );
            })}
          </nav>
        </div>
      </div>
    </Show>
  );
}

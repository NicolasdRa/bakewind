import { createSignal, createEffect } from 'solid-js';

type Theme = 'light' | 'dark';

// Initialize from localStorage or system preference
const getInitialTheme = (): Theme => {
  // Check localStorage first
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Fall back to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

// Reactive state
const [theme, setThemeSignal] = createSignal<Theme>(getInitialTheme());

// Apply theme to document
const applyTheme = (newTheme: Theme) => {
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Initialize theme on load
applyTheme(theme());

// Theme store
export const themeStore = {
  get theme() {
    return theme();
  },

  setTheme(newTheme: Theme) {
    setThemeSignal(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);

    // TODO: Sync to backend API when user preferences endpoint is ready
    // This enables theme persistence across devices
  },

  toggleTheme() {
    const newTheme = theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  },

  // Subscribe to theme changes
  subscribe(callback: (theme: Theme) => void) {
    return createEffect(() => {
      callback(theme());
    });
  },
};

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually set a preference
    if (!localStorage.getItem('theme')) {
      themeStore.setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

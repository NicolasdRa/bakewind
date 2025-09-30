import { createContext, useContext, createSignal, createEffect, JSX, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { api, ApiError } from "../api";

// Auth user interface
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
}

// Auth context interface
interface AuthContextType {
  user: () => AuthUser | null;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

// Registration data interface
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>();

// SSR-compatible storage helpers
const getStorageItem = (key: string): string | null => {
  if (isServer) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  if (isServer) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
};

const removeStorageItem = (key: string): void => {
  if (isServer) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
};

// Storage keys
const USER_STORAGE_KEY = "bakewind_user_data";

// Auth provider component
export function AuthProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<AuthUser | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  // Initialize auth state - only run on client side
  onMount(async () => {
    if (isServer) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to restore user from localStorage
      const userData = getStorageItem(USER_STORAGE_KEY);
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch {
          // Invalid user data, clear it
          removeStorageItem(USER_STORAGE_KEY);
        }
      }

      // Try to get fresh profile from server (uses httpOnly cookies)
      try {
        const profile = await api.auth.getProfile();
        setUser(profile);
        setStorageItem(USER_STORAGE_KEY, JSON.stringify(profile));
      } catch (error) {
        // If profile fetch fails, clear stored user
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          removeStorageItem(USER_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn("Failed to restore auth state:", error);
    } finally {
      setIsLoading(false);
    }
  });

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.auth.login({
        email,
        password,
        sessionContext: {
          userAgent: isServer ? "SSR" : navigator.userAgent,
          deviceType: "web",
          timezone: isServer ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      setUser(response.user);
      setStorageItem(USER_STORAGE_KEY, JSON.stringify(response.user));

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await api.auth.register({
        ...userData,
        sessionContext: {
          userAgent: isServer ? "SSR" : navigator.userAgent,
          deviceType: "web",
          timezone: isServer ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      setUser(response.user);
      setStorageItem(USER_STORAGE_KEY, JSON.stringify(response.user));

      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
      // Continue with local logout even if API call fails
    } finally {
      setUser(null);
      removeStorageItem(USER_STORAGE_KEY);
    }
  };

  // Refresh auth function
  const refreshAuth = async (): Promise<void> => {
    try {
      const tokens = await api.auth.refresh();
      // Tokens are handled via httpOnly cookies
      // Get fresh profile
      const profile = await api.auth.getProfile();
      setUser(profile);
      setStorageItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn("Failed to refresh auth:", error);
      setUser(null);
      removeStorageItem(USER_STORAGE_KEY);
    }
  };

  const authValue: AuthContextType = {
    user,
    isAuthenticated: () => !!user(),
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {props.children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth guard component for protected routes
export function AuthGuard(props: {
  children: JSX.Element;
  fallback?: JSX.Element;
  redirectTo?: string;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  // On server-side, always show loading or fallback
  if (isServer) {
    return (
      <div class="min-h-screen bg-bakery-cream flex items-center justify-center">
        <div class="text-center">
          <div class="spinner w-8 h-8 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking auth
  if (isLoading()) {
    return (
      <div class="min-h-screen bg-bakery-cream flex items-center justify-center">
        <div class="text-center">
          <div class="spinner w-8 h-8 mx-auto mb-4"></div>
          <p class="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show fallback or redirect if not authenticated
  if (!isAuthenticated()) {
    if (props.fallback) {
      return props.fallback;
    }

    // Redirect to login page (in a real app, you'd use the router here)
    if (props.redirectTo) {
      // For now, just show a login prompt
      return (
        <div class="min-h-screen bg-bakery-cream flex items-center justify-center">
          <div class="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold text-bakery-brown mb-4 text-center">
              Login Required
            </h2>
            <p class="text-gray-600 text-center mb-6">
              You need to be logged in to access this page.
            </p>
            <div class="space-y-3">
              <a href="/login" class="btn-primary w-full text-center block">
                Go to Login
              </a>
              <a href="/register" class="btn-outline w-full text-center block">
                Create Account
              </a>
              <a href="/" class="text-primary-600 hover:text-primary-700 text-center block">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  return props.children;
}
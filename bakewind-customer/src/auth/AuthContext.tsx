import { createContext, useContext, createSignal, createEffect, JSX } from "solid-js";

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

// Mock authentication functions
const AUTH_STORAGE_KEY = "bakewind_auth_token";
const USER_STORAGE_KEY = "bakewind_user_data";

// Mock user data for development
const mockUser: AuthUser = {
  id: "user_123",
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  isVerified: true,
};

// Simulate API calls
async function mockLogin(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simple mock validation
  if (email === "john.doe@example.com" && password === "password123") {
    return {
      user: mockUser,
      token: "mock_jwt_token_123",
    };
  }

  return null;
}

async function mockRegister(userData: RegisterData): Promise<{ user: AuthUser; token: string } | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simple mock - always succeed for demo
  const newUser: AuthUser = {
    id: `user_${Date.now()}`,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    isVerified: false,
  };

  return {
    user: newUser,
    token: `mock_jwt_token_${Date.now()}`,
  };
}

async function mockRefreshAuth(token: string): Promise<AuthUser | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simple mock - validate token format
  if (token.startsWith("mock_jwt_token_")) {
    return mockUser;
  }

  return null;
}

// Auth provider component
export function AuthProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<AuthUser | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  // Initialize auth state on mount
  createEffect(async () => {
    if (typeof localStorage === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem(AUTH_STORAGE_KEY);
      const userData = localStorage.getItem(USER_STORAGE_KEY);

      if (token && userData) {
        // Verify token with server (mock)
        const validUser = await mockRefreshAuth(token);
        if (validUser) {
          setUser(validUser);
        } else {
          // Invalid token, clear storage
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
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
      const result = await mockLogin(email, password);
      if (result) {
        setUser(result.user);

        // Store auth data
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(AUTH_STORAGE_KEY, result.token);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const result = await mockRegister(userData);
      if (result) {
        setUser(result.user);

        // Store auth data
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(AUTH_STORAGE_KEY, result.token);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);

    // Clear storage
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  // Refresh auth function
  const refreshAuth = async (): Promise<void> => {
    if (typeof localStorage === "undefined") return;

    try {
      const token = localStorage.getItem(AUTH_STORAGE_KEY);
      if (token) {
        const validUser = await mockRefreshAuth(token);
        if (validUser) {
          setUser(validUser);
        } else {
          logout();
        }
      }
    } catch (error) {
      console.warn("Failed to refresh auth:", error);
      logout();
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

  // Show loading while checking auth
  if (isLoading()) {
    return (
      <div class="min-h-screen bg-bakery-cream flex items-center justify-center">
        <div class="text-center">
          <div class="spinner w-8 h-8 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading...</p>
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
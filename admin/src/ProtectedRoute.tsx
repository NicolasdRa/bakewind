import { ParentComponent, Show } from "solid-js";
import { useAuth } from "./stores/authStore";

// Protected Route component
const ProtectedRoute: ParentComponent = (props) => {
  const auth = useAuth();

  console.log('[ProtectedRoute] Auth state:', {
    isInitialized: auth.isInitialized,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user?.email
  });

  const handleLoginRedirect = () => {
console.log('[ProtectedRoute] Redirecting to login page');

    const customerAppUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:3001';
    window.location.href = `${customerAppUrl}/login`;
  };

  return (
    <Show
      when={auth.isInitialized && !auth.isLoading}
      fallback={
        <div class="loading-screen">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      }
    >
      <Show
        when={auth.isAuthenticated}
        fallback={
          <div class="auth-redirect">
            <h2>Authentication Required</h2>
            <p>You need to log in to access the BakeWind Admin Dashboard.</p>
            <button onClick={handleLoginRedirect} class="login-redirect-btn" type="button">
              Go to Login
            </button>
          </div>
        }
      >
        {props.children}
      </Show>
    </Show>
  );
};

export default ProtectedRoute;
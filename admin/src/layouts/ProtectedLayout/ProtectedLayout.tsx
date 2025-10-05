import { Show } from "solid-js";
import { RouteSectionProps } from "@solidjs/router";
import { useAuth } from "../../stores/authStore";
import DashboardLayout from "../DashboardLayout/DashboardLayout";
import { logger } from "../../utils/logger";
import styles from "./ProtectedLayout.module.css";

/**
 * ProtectedLayout - Wraps routes that require authentication
 * Combines auth guard logic with DashboardLayout
 */
export default function ProtectedLayout(props: RouteSectionProps) {
  const auth = useAuth();

  logger.auth('Auth state check', {
    isInitialized: auth.isInitialized,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user?.email
  });

  const handleLoginRedirect = () => {
    logger.auth('Redirecting to login page');
    window.location.href = '/login';
  };

  return (
    <Show
      when={auth.isInitialized && !auth.isLoading}
      fallback={
        <div class={styles.loadingScreen}>
          <div class={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      }
    >
      <Show
        when={auth.isAuthenticated}
        fallback={
          <div class={styles.authRedirect}>
            <h2>Authentication Required</h2>
            <p>You need to log in to access the BakeWind Admin Dashboard.</p>
            <button onClick={handleLoginRedirect} class={styles.loginRedirectBtn} type="button">
              Go to Login
            </button>
          </div>
        }
      >
        <DashboardLayout {...props} />
      </Show>
    </Show>
  );
}

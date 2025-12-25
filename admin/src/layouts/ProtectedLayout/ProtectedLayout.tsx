import { Show } from "solid-js";
import { RouteSectionProps } from "@solidjs/router";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import { StaffProvider } from "../../context/StaffContext";
import DashboardLayout from "../DashboardLayout/DashboardLayout";
import { logger } from "../../utils/logger";
import Button from "../../components/common/Button";
import styles from "./ProtectedLayout.module.css";

/**
 * ProtectedLayout - Wraps routes that require authentication
 * Provides AuthProvider, StaffProvider and auth guard logic with DashboardLayout
 */
export default function ProtectedLayout(props: RouteSectionProps) {
  return (
    <AuthProvider>
      <StaffProvider>
        <ProtectedContent {...props} />
      </StaffProvider>
    </AuthProvider>
  );
}

function ProtectedContent(props: RouteSectionProps) {
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
            <Button variant="primary" onClick={handleLoginRedirect} class={styles.loginRedirectBtn} type="button">
              Go to Login
            </Button>
          </div>
        }
      >
        <DashboardLayout {...props} />
      </Show>
    </Show>
  );
}


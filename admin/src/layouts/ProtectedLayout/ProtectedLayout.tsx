import { Show, createEffect, createSignal } from "solid-js";
import { RouteSectionProps } from "@solidjs/router";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import { StaffProvider } from "../../context/StaffContext";
import { useAdminStore } from "../../stores/adminStore";
import { getAllTenants } from "../../api/tenants";
import DashboardLayout from "../DashboardLayout/DashboardLayout";
import TenantSelector from "../../components/TenantSelector/TenantSelector";
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
  const { state: adminState, actions: adminActions } = useAdminStore();
  const [isLoadingTenants, setIsLoadingTenants] = createSignal(false);

  logger.auth('Auth state check', {
    isInitialized: auth.isInitialized,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user?.email
  });

  // Load tenants for ADMIN users
  createEffect(() => {
    if (auth.isAuthenticated && auth.user?.role === 'ADMIN' && adminState.tenants.length === 0) {
      loadTenantsForAdmin();
    }
  });

  const loadTenantsForAdmin = async () => {
    try {
      setIsLoadingTenants(true);
      adminActions.initializeFromStorage();
      const response = await getAllTenants();
      adminActions.setTenants(response.tenants);
    } catch (error: any) {
      logger.error('Failed to load tenants for admin', error);
    } finally {
      setIsLoadingTenants(false);
    }
  };

  const handleLoginRedirect = () => {
    logger.auth('Redirecting to login page');
    window.location.href = '/login';
  };

  // Check if ADMIN user needs to select a tenant
  const needsTenantSelection = () => {
    return auth.user?.role === 'ADMIN' && !adminState.selectedTenantId && !isLoadingTenants();
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
        {/* Admin tenant selection gate */}
        <Show
          when={!needsTenantSelection()}
          fallback={
            <div class={styles.tenantSelectionGate}>
              <div class={styles.tenantSelectionCard}>
                <div class={styles.tenantSelectionIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2>Select a Bakery</h2>
                <p>As a system administrator, please select which bakery you want to view and monitor.</p>
                <div class={styles.tenantSelectorWrapper}>
                  <TenantSelector />
                </div>
              </div>
            </div>
          }
        >
          <DashboardLayout {...props} />
        </Show>
      </Show>
    </Show>
  );
}


import { ParentComponent, Show, onMount } from "solid-js";
import { useAuth } from "./stores/authStore";
import { appActions } from "./stores/appStore";
import DashboardLayout from "./layouts/DashboardLayout/DashboardLayout";

// Main layout wrapper - integrates migrated DashboardLayout
const Layout: ParentComponent = (props) => {
  const auth = useAuth();

  // Initialize appStore on mount (theme, sidebar state)
  onMount(() => {
    appActions.initializeClientState();
  });

  return (
    <Show
      when={auth.isAuthenticated}
      fallback={
        // Unauthenticated - just show children (login flow)
        <div class="app-layout">
          <main class="app-main">
            {props.children}
          </main>
        </div>
      }
    >
      {/* Authenticated - use migrated DashboardLayout with Sidebar */}
      <DashboardLayout>
        {props.children}
      </DashboardLayout>
    </Show>
  );
};

export default Layout;
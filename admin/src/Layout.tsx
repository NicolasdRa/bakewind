import { A } from "@solidjs/router";
import { ParentComponent, Show } from "solid-js";
import { useAuth } from "./stores/authStore";

// Main layout wrapper
const Layout: ParentComponent = (props) => {
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div class="app-layout">
      <Show when={auth.isAuthenticated}>
        <nav class="app-nav">
          <div class="nav-brand">
            <h1>BakeWind Admin</h1>
          </div>
          <div class="nav-menu">
            <A href="/" class="nav-link" activeClass="nav-link-active">
              Dashboard
            </A>
            <A href="/orders" class="nav-link" activeClass="nav-link-active">
              Orders
            </A>
            <A href="/inventory" class="nav-link" activeClass="nav-link-active">
              Inventory
            </A>
            <A href="/production" class="nav-link" activeClass="nav-link-active">
              Production
            </A>
            <A href="/recipes" class="nav-link" activeClass="nav-link-active">
              Recipes
            </A>
            <A href="/customers" class="nav-link" activeClass="nav-link-active">
              Customers
            </A>
            <A href="/analytics" class="nav-link" activeClass="nav-link-active">
              Analytics
            </A>
          </div>
          <div class="nav-user">
            <Show when={auth.user}>
              <span class="user-name">{auth.user?.email}</span>
            </Show>
            <button onClick={handleLogout} class="logout-btn" type="button">
              Logout
            </button>
          </div>
        </nav>
      </Show>
      <main class="app-main">
        {props.children}
      </main>
    </div>
  );
};

export default Layout;
import { Component } from "solid-js";
import { AuthProvider, useAuth } from "./stores/authStore";

const SimpleApp: Component = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

const MainContent: Component = () => {
  const auth = useAuth();

  console.log('[MainContent] Auth state:', {
    isInitialized: auth.isInitialized,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading
  });

  if (auth.isLoading || !auth.isInitialized) {
    return (
      <div style={{
        "min-height": "100vh",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "background": "#f5f5f5"
      }}>
        <div style={{ "text-align": "center" }}>
          <h2>Loading...</h2>
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div style={{
        "min-height": "100vh",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "background": "#f5f5f5"
      }}>
        <div style={{
          "background": "white",
          "padding": "2rem",
          "border-radius": "8px",
          "box-shadow": "0 2px 8px rgba(0,0,0,0.1)",
          "text-align": "center"
        }}>
          <h2 style={{ "margin-bottom": "1rem" }}>Authentication Required</h2>
          <p style={{ "margin-bottom": "1.5rem", "color": "#666" }}>
            You need to log in to access the BakeWind Admin Dashboard.
          </p>
          <button
            onClick={() => {
              window.location.href = 'http://localhost:3000/login';
            }}
            style={{
              "background": "#3b82f6",
              "color": "white",
              "border": "none",
              "padding": "0.75rem 1.5rem",
              "font-size": "1rem",
              "border-radius": "6px",
              "cursor": "pointer"
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      "min-height": "100vh",
      "background": "#f5f5f5",
      "padding": "2rem"
    }}>
      <div style={{
        "max-width": "1200px",
        "margin": "0 auto",
        "background": "white",
        "padding": "2rem",
        "border-radius": "8px",
        "box-shadow": "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ "margin-bottom": "1rem" }}>
          Welcome, {auth.user?.firstName || 'User'}!
        </h1>
        <p style={{ "color": "#666", "margin-bottom": "1rem" }}>
          Email: {auth.user?.email}
        </p>
        <p style={{ "color": "#666", "margin-bottom": "1.5rem" }}>
          Role: {auth.user?.role}
        </p>
        <button
          onClick={() => auth.logout()}
          style={{
            "background": "#ef4444",
            "color": "white",
            "border": "none",
            "padding": "0.5rem 1rem",
            "border-radius": "6px",
            "cursor": "pointer"
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default SimpleApp;
import { RouteSectionProps } from "@solidjs/router";
import { Component, onMount } from "solid-js";
import { AuthProvider } from "../stores/authStore";
import { appActions } from "../stores/appStore";
import { logger } from "../utils/logger";

/**
 * RootLayout - Top-level layout wrapper for the entire app
 * Provides global context (AuthProvider) and initializes app state
 */
const RootLayout: Component<RouteSectionProps> = (props) => {
  logger.ui('Rendering RootLayout');

  // Initialize appStore on mount (theme, sidebar state)
  onMount(() => {
    appActions.initializeClientState();
  });

  return (
    <AuthProvider>
      {props.children}
    </AuthProvider>
  );
};

export default RootLayout;
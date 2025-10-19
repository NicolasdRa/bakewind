import { RouteSectionProps } from "@solidjs/router";
import { Component, onMount } from "solid-js";
import { appActions } from "../stores/appStore";
import { logger } from "../utils/logger";

/**
 * RootLayout - Top-level layout wrapper for the entire app
 * Initializes app-wide state (theme, etc.)
 * Note: AuthProvider is only in ProtectedLayout, not here
 */
const RootLayout: Component<RouteSectionProps> = (props) => {
  logger.ui('Rendering RootLayout');

  // Initialize appStore on mount (theme, sidebar state)
  onMount(() => {
    appActions.initializeClientState();
  });

  return <>{props.children}</>;
};

export default RootLayout;
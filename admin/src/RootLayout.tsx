import { RouteSectionProps } from "@solidjs/router";
import { Component, ParentComponent } from "solid-js";
import { AuthProvider } from "./stores/authStore";
import Layout from "./Layout";

// Root layout component for Router - wraps all routes with AuthProvider and Layout
const RootLayout: Component<RouteSectionProps> = (props) => {
  console.log('[RootLayout] Rendering');
  return (
    <AuthProvider>
      <Layout children={props.children} />
    </AuthProvider>
  );
};

export default RootLayout;
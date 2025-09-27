import type { UserRole } from "../types/auth";

export type Permission = 
  | "DASHBOARD_SCREEN"
  | "ANALYTICS_SCREEN"
  | "PROFILE_SCREEN"
  | "SETTINGS_SCREEN"
  | "TEAM_MANAGEMENT_SCREEN"
  | "INVENTORY_SCREEN"
  | "ORDERS_SCREEN"
  | "CUSTOMERS_SCREEN";

export const Permissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "DASHBOARD_SCREEN",
    "ANALYTICS_SCREEN",
    "PROFILE_SCREEN",
    "SETTINGS_SCREEN",
    "TEAM_MANAGEMENT_SCREEN",
    "INVENTORY_SCREEN",
    "ORDERS_SCREEN",
    "CUSTOMERS_SCREEN"
  ],
  MANAGER: [
    "DASHBOARD_SCREEN",
    "ANALYTICS_SCREEN",
    "PROFILE_SCREEN",
    "SETTINGS_SCREEN",
    "INVENTORY_SCREEN",
    "ORDERS_SCREEN",
    "CUSTOMERS_SCREEN"
  ],
  HEAD_BAKER: [
    "DASHBOARD_SCREEN",
    "PROFILE_SCREEN",
    "INVENTORY_SCREEN",
    "ORDERS_SCREEN"
  ],
  BAKER: [
    "DASHBOARD_SCREEN",
    "PROFILE_SCREEN",
    "ORDERS_SCREEN"
  ],
  HEAD_PASTRY_CHEF: [
    "DASHBOARD_SCREEN",
    "PROFILE_SCREEN",
    "INVENTORY_SCREEN",
    "ORDERS_SCREEN"
  ],
  PASTRY_CHEF: [
    "DASHBOARD_SCREEN",
    "PROFILE_SCREEN",
    "ORDERS_SCREEN"
  ],
  CASHIER: [
    "DASHBOARD_SCREEN",
    "PROFILE_SCREEN",
    "ORDERS_SCREEN",
    "CUSTOMERS_SCREEN"
  ],
  CUSTOMER: [
    "PROFILE_SCREEN"
  ],
  GUEST: [
    "PROFILE_SCREEN"
  ],
  VIEWER: [
    "DASHBOARD_SCREEN",
    "PROFILE_SCREEN"
  ]
};

export const getRedirectUrlBasedOnPermission = (role: UserRole): string => {
  const permissions = Permissions[role];

  // Redirect to the first available screen based on permissions
  if (permissions.includes("DASHBOARD_SCREEN")) {
    return "/overview";
  } else if (permissions.includes("ANALYTICS_SCREEN")) {
    return "/analytics";
  } else if (permissions.includes("PROFILE_SCREEN")) {
    return "/profile";
  } else {
    return "/dashboard";
  }
};
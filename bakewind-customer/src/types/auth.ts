export type UserRole = 'ADMIN' | 'MANAGER' | 'HEAD_BAKER' | 'BAKER' | 'HEAD_PASTRY_CHEF' | 'PASTRY_CHEF' | 'CASHIER' | 'CUSTOMER' | 'GUEST' | 'VIEWER';

export type Location = {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardUserData = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  locationId: string[];
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  country?: string | null;
  city?: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type AuthContextType = {
  user?: DashboardUserData;
  loading: boolean;
  error: any;
  authenticateUser: (user: DashboardUserData) => void;
  login: (email: string, password: string) => Promise<DashboardUserData>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<DashboardUserData>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
  authError: string | null;
  clearError: () => void;
  locationId: string | null;
  setLocationId: (id: string | null) => void;
  refetchUser: () => Promise<void>;
};
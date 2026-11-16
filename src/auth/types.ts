// Mirrors the login user in national-acts-users; permissions are retained for future use.
export interface User {
  userId: number;
  username: string;
  isAdmin: boolean;
  isActive: boolean;
  isAuthenticated?: boolean;
  token?: string;
  firstName?: string;
  lastName?: string;
  requireResetPassword?: boolean;
  sellers?: { sellerId: number; sellerName?: string; roleId?: number; permissions?: number[]; routes?: string[]; hideSellerRate?: boolean; sellerType?: number }[];
  mobile?: string;
  notes?: string;
  createdAt?: string;
  category?: string;
  sendEmailReset?: boolean;
  sendTextReset?: boolean;
  disableCheckIn?: boolean;
  lastUpdate?: string;
}
export interface UserLoginResponse {
  statusCode?: number;
  success?: boolean;
  user?: User;
  error?: string;
}

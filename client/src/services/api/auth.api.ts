import { apiClient, type ApiResponse } from './client';

export interface Store {
  id: string;
  storeName: string;
  businessType: string;
  gstNumber?: string | null;
  ownerId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier';
  createdAt: string;
  stores: Store[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    apiClient.post<never, ApiResponse<AuthResponse>>('/auth/signup', payload),
  login: (payload: { email: string; password: string }) =>
    apiClient.post<never, ApiResponse<AuthResponse>>('/auth/login', payload),
  me: () => apiClient.get<never, ApiResponse<{ user: User }>>('/auth/me'),
};

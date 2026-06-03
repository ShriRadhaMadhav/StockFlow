import { apiClient, type ApiResponse } from './client';
import type { Store } from './auth.api';

export const storeApi = {
  create: (payload: {
    storeName: string;
    businessType: string;
    gstNumber?: string;
  }) => apiClient.post<never, ApiResponse<{ message: string; store: Store }>>('/business', payload),
  myStore: () => apiClient.get<never, ApiResponse<{ store: Store | null; stores: Store[] }>>('/business/my-business'),
};

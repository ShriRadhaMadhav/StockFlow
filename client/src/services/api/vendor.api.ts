import { apiClient } from './client';
import type { ApiResponse } from './client';
import type { LedgerItem } from './customer.api';

export interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorsResponse {
  vendors: Vendor[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateVendorDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export interface VendorDetailResponse {
  vendor: Vendor;
  stats: {
    totalPurchased: number;
    totalPaid: number;
    outstandingBalance: number;
    batchesCount: number;
    paymentsCount: number;
  };
}

export interface RecordVendorPaymentDto {
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  paymentDate?: string;
}

export const vendorApi = {
  getVendors: (params?: { page?: number; limit?: number; search?: string }) => {
    return apiClient.get<never, ApiResponse<VendorsResponse>>('/vendors', { params });
  },

  createVendor: (data: CreateVendorDto) => {
    return apiClient.post<never, ApiResponse<Vendor>>('/vendors', data);
  },

  getVendor: (id: string) => {
    return apiClient.get<never, ApiResponse<VendorDetailResponse>>(`/vendors/${id}`);
  },

  getVendorLedger: (id: string) => {
    return apiClient.get<never, ApiResponse<LedgerItem[]>>(`/vendors/${id}/ledger`);
  },

  recordPayment: (id: string, data: RecordVendorPaymentDto) => {
    return apiClient.post<never, ApiResponse<any>>(`/vendors/${id}/payments`, data);
  }
};

import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface Customer {
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

export interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export interface CustomerDetailResponse {
  customer: Customer;
  stats: {
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
    invoicesCount: number;
    paymentsCount: number;
  };
}

export interface LedgerItem {
  _id: string;
  type: 'invoice' | 'payment' | 'purchase';
  amount: number;
  date: string;
  description: string;
  reference: string;
  runningBalance: number;
}

export const customerApi = {
  getCustomers: (params?: { page?: number; limit?: number; search?: string }) => {
    return apiClient.get<never, ApiResponse<CustomersResponse>>('/customers', { params });
  },

  createCustomer: (data: CreateCustomerDto) => {
    return apiClient.post<never, ApiResponse<Customer>>('/customers', data);
  },

  getCustomer: (id: string) => {
    return apiClient.get<never, ApiResponse<CustomerDetailResponse>>(`/customers/${id}`);
  },

  getCustomerLedger: (id: string) => {
    return apiClient.get<never, ApiResponse<LedgerItem[]>>(`/customers/${id}/ledger`);
  }
};

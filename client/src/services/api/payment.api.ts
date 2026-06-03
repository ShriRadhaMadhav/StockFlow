import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface PaymentDTO {
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  paymentDate?: string;
}

export interface PaymentRecord {
  _id: string;
  invoiceId: {
    _id: string;
    invoiceNumber: string;
    total: number;
  } | string;
  customerId: {
    _id: string;
    name: string;
    email?: string;
  } | string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  paymentDate: string;
  recordedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  } | string;
  createdAt: string;
}

export interface PaymentsResponse {
  payments: PaymentRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export const paymentApi = {
  recordPayment: async (data: PaymentDTO): Promise<ApiResponse<PaymentRecord>> => {
    return apiClient.post('/payments', data);
  },
  
  getPayments: async (params?: { page?: number; limit?: number; customerId?: string; paymentMethod?: string }): Promise<ApiResponse<PaymentsResponse>> => {
    return apiClient.get('/payments', { params });
  }
};

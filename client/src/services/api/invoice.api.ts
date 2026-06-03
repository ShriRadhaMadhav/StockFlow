import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface InvoiceItemDto {
  productId: string;
  quantity: number;
  sellingPrice: number;
  subtotal: number;
}

export interface CreateInvoiceDto {
  customerId: string;
  items: InvoiceItemDto[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentTerms?: string;
  dueDate: string;
  notes?: string;
  workflowState: 'draft' | 'finalized';
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: any; // Could be populated or string
  items: InvoiceItemDto[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  workflowState: 'draft' | 'finalized' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

export const invoiceApi = {
  createInvoice: (data: CreateInvoiceDto) => {
    return apiClient.post<never, ApiResponse<Invoice>>('/invoices', data);
  },

  getInvoices: (params?: { page?: number; limit?: number; status?: string; workflowState?: string; customerId?: string; search?: string }) => {
    return apiClient.get<never, ApiResponse<InvoicesResponse>>('/invoices', { params });
  },

  getInvoiceById: (id: string) => {
    return apiClient.get<never, ApiResponse<Invoice>>(`/invoices/${id}`);
  }
};

import { apiClient } from './client';
import type { ApiResponse } from './client';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: number;
  lowStockThreshold: number;
  totalStock: number;
  reservedStock: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: number;
  lowStockThreshold: number;
  totalStock?: number;
}

export const inventoryApi = {
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; status?: string }) => {
    return apiClient.get<never, ApiResponse<ProductsResponse>>('/products', { params });
  },

  createProduct: (data: CreateProductDto) => {
    return apiClient.post<never, ApiResponse<Product>>('/products', data);
  },

  updateProduct: (id: string, data: Partial<CreateProductDto>) => {
    return apiClient.put<never, ApiResponse<Product>>(`/products/${id}`, data);
  },

  createBatch: (data: { productId: string; quantity: number; purchasePrice: number; vendorId?: string; invoiceNumber?: string }) => {
    return apiClient.post<never, ApiResponse<any>>('/inventory/batches', data);
  },

  getBatches: (params?: { startDate?: string; endDate?: string; productId?: string; vendorId?: string; minCost?: number; maxCost?: number }) => {
    return apiClient.get<never, ApiResponse<any[]>>('/inventory/batches', { params });
  },

  getStockMovements: (params?: { startDate?: string; endDate?: string; productId?: string; type?: string; source?: string }) => {
    return apiClient.get<never, ApiResponse<any[]>>('/stock-movements', { params });
  }
};

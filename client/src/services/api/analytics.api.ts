import { apiClient as api } from './client';
import type { ApiResponse } from './client';

export interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
}

export interface InventoryTurnover {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  soldLast30Days: number;
  turnoverRatio: number;
}

export interface CashFlowData {
  ar: {
    '0-30 Days': number;
    '31-60 Days': number;
    '60+ Days': number;
    total: number;
  };
  ap: {
    total: number;
  };
  netCashPosition: number;
}

export const analyticsApi = {
  getSalesTrends: async (): Promise<SalesTrend[]> => {
    const response = await api.get<never, ApiResponse<SalesTrend[]>>('/analytics/sales-trends');
    return response.data;
  },

  getInventoryTurnover: async (): Promise<InventoryTurnover[]> => {
    const response = await api.get<never, ApiResponse<InventoryTurnover[]>>('/analytics/inventory-turnover');
    return response.data;
  },

  getCashFlow: async (): Promise<CashFlowData> => {
    const response = await api.get<never, ApiResponse<CashFlowData>>('/analytics/cash-flow');
    return response.data;
  }
};

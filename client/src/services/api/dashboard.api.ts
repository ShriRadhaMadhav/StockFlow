import { apiClient as api } from './client';

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  invoiceCount: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  accountsReceivable: number;
  accountsPayable: number;
  revenueTrend: RevenueTrendPoint[];
  recentActivity: any[];
  lowStockItems: any[];
  totalProducts: number;
  totalInvoices: number;
  totalCustomers: number;
  period: string;
}

export const dashboardApi = {
  getStats: async (period: string = '7d'): Promise<DashboardStats> => {
    const response = await api.get<never, import('./client').ApiResponse<DashboardStats>>('/dashboard/stats', { params: { period } });
    return response.data;
  }
};

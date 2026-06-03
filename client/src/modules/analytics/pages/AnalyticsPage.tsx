import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../services/api/analytics.api';
import { PageContainer } from '../../../layouts/PageContainer';
import { Skeleton } from '../../../components/ui/loading/Skeleton';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, Package, IndianRupee, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { format } from 'date-fns';

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'cashflow'>('sales');

  const { data: salesTrends, isLoading: isLoadingSales } = useQuery({
    queryKey: ['analytics', 'sales-trends'],
    queryFn: () => analyticsApi.getSalesTrends(),
  });

  const { data: inventoryTurnover, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['analytics', 'inventory-turnover'],
    queryFn: () => analyticsApi.getInventoryTurnover(),
  });

  const { data: cashFlow, isLoading: isLoadingCashFlow } = useQuery({
    queryKey: ['analytics', 'cash-flow'],
    queryFn: () => analyticsApi.getCashFlow(),
  });

  const isLoading = isLoadingSales || isLoadingInventory || isLoadingCashFlow;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-5">
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg mb-5" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </PageContainer>
    );
  }

  const totalSalesRevenue = salesTrends?.reduce((sum, t) => sum + t.revenue, 0) || 0;
  const totalOrders = salesTrends?.reduce((sum, t) => sum + t.orders, 0) || 0;
  const daysWithSales = salesTrends?.filter(t => t.revenue > 0).length || 0;

  const arPieData = cashFlow ? [
    { name: '0-30 Days', value: cashFlow.ar['0-30 Days'], color: '#10B981' },
    { name: '31-60 Days', value: cashFlow.ar['31-60 Days'], color: '#F59E0B' },
    { name: '60+ Days', value: cashFlow.ar['60+ Days'], color: '#EF4444' }
  ].filter(d => d.value > 0) : [];

  const hasARData = arPieData.length > 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-foreground-secondary mt-0.5">
          Deep dive into your business performance and trends
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { key: 'sales', label: 'Sales Trends', icon: TrendingUp },
          { key: 'inventory', label: 'Inventory Turnover', icon: Package },
          { key: 'cashflow', label: 'Cash Flow & AR Aging', icon: IndianRupee },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === key 
                ? 'bg-foreground text-background shadow-md' 
                : 'bg-surface border border-border/60 text-foreground hover:bg-background-secondary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* Sales Trends Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">30-Day Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSalesRevenue)}</p>
              </div>
              <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
              </div>
              <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">Active Days</p>
                <p className="text-2xl font-bold text-foreground">{daysWithSales} <span className="text-sm font-medium text-foreground-secondary">/ 30</span></p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-surface border border-border/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60">
                <h3 className="text-sm font-bold text-foreground">30-Day Revenue Trend</h3>
                <p className="text-xs text-foreground-secondary mt-0.5">Daily finalized invoice totals over the last month</p>
              </div>
              <div className="p-5 h-[380px] w-full">
                {totalSalesRevenue === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-foreground-secondary">
                    <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No sales data yet</p>
                    <p className="text-xs mt-1">Revenue trends will appear once invoices are finalized</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 500 }} 
                        dy={8} 
                        interval={2}
                        tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 500 }} 
                        tickFormatter={(val) => val >= 1000 ? `₹${(val/1000).toFixed(0)}k` : `₹${val}`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px', fontWeight: 500 }}
                        formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                        labelFormatter={(label) => format(new Date(label), 'EEE, MMM d, yyyy')}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Turnover Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-surface border border-border/80 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">Inventory Turnover Ratio</h3>
              <p className="text-xs text-foreground-secondary mt-0.5">Top 10 products by velocity (Units sold last 30 days ÷ Current stock)</p>
            </div>
            <div className="p-5">
              {!inventoryTurnover || inventoryTurnover.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-foreground-secondary">
                  <Package className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No inventory data yet</p>
                  <p className="text-xs mt-1">Add products to see turnover analytics</p>
                </div>
              ) : (
                <>
                  {/* Table view for better readability */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-left py-2.5 px-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Product</th>
                          <th className="text-right py-2.5 px-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Stock</th>
                          <th className="text-right py-2.5 px-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Sold (30d)</th>
                          <th className="text-right py-2.5 px-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Turnover</th>
                          <th className="py-2.5 px-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider w-48">Velocity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {inventoryTurnover.map((item, idx) => {
                          const maxRatio = Math.max(...inventoryTurnover.map(i => i.turnoverRatio), 1);
                          const barWidth = maxRatio > 0 ? (item.turnoverRatio / maxRatio) * 100 : 0;
                          return (
                            <tr key={item.id} className="hover:bg-background-secondary/30 transition-colors">
                              <td className="py-3 px-3">
                                <p className="font-semibold text-foreground">{item.name}</p>
                                <p className="text-[11px] text-foreground-secondary">{item.sku}</p>
                              </td>
                              <td className="py-3 px-3 text-right font-medium text-foreground">
                                {item.currentStock} <span className="text-foreground-secondary">{item.unit}</span>
                              </td>
                              <td className="py-3 px-3 text-right font-medium text-foreground">{item.soldLast30Days}</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`font-bold ${item.turnoverRatio >= 1 ? 'text-emerald-600' : item.turnoverRatio > 0 ? 'text-amber-600' : 'text-foreground-secondary'}`}>
                                  {item.turnoverRatio}x
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="w-full bg-background-secondary rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${idx < 3 ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Cash Flow Tab */}
        {activeTab === 'cashflow' && (
          <div className="space-y-5">
            {/* Net Position Summary */}
            {cashFlow && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">Total Receivable</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(cashFlow.ar.total)}</p>
                  <p className="text-[11px] text-foreground-secondary mt-1">From unpaid invoices</p>
                </div>
                <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">Total Payable</p>
                  <p className="text-2xl font-bold text-rose-600">{formatCurrency(cashFlow.ap.total)}</p>
                  <p className="text-[11px] text-foreground-secondary mt-1">Owed to vendors</p>
                </div>
                <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">Net Position</p>
                  <p className={`text-2xl font-bold ${cashFlow.netCashPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {cashFlow.netCashPosition >= 0 ? '+' : ''}{formatCurrency(cashFlow.netCashPosition)}
                  </p>
                  <p className="text-[11px] text-foreground-secondary mt-1">Receivable minus payable</p>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* AR Aging Pie */}
              <div className="bg-surface border border-border/80 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60">
                  <h3 className="text-sm font-bold text-foreground">Accounts Receivable Aging</h3>
                  <p className="text-xs text-foreground-secondary mt-0.5">Breakdown of unpaid invoices by age</p>
                </div>
                <div className="p-5 h-[320px] flex items-center justify-center">
                  {!hasARData ? (
                    <div className="flex flex-col items-center text-foreground-secondary">
                      <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-sm font-medium">No outstanding receivables</p>
                      <p className="text-xs mt-1">All invoices are paid! 🎉</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={arPieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {arPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: any) => [formatCurrency(value), 'Outstanding']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          iconType="circle" 
                          formatter={(value: string) => <span className="text-xs font-medium text-foreground-secondary">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Cash Position Bars */}
              <div className="bg-surface border border-border/80 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60">
                  <h3 className="text-sm font-bold text-foreground">Cash Position Breakdown</h3>
                  <p className="text-xs text-foreground-secondary mt-0.5">Incoming vs outgoing comparison</p>
                </div>
                <div className="p-5 flex flex-col justify-center h-[320px]">
                  {cashFlow && (
                    <div className="space-y-6">
                      {/* AR Bar */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-semibold text-foreground-secondary">Receivable (AR)</span>
                          <span className="text-xl font-bold text-emerald-600">{formatCurrency(cashFlow.ar.total)}</span>
                        </div>
                        <div className="w-full bg-emerald-50 rounded-full h-3">
                          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: '100%' }} />
                        </div>
                        {cashFlow.ar.total > 0 && (
                          <div className="flex gap-3 mt-2">
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">0-30d: {formatCurrency(cashFlow.ar['0-30 Days'])}</span>
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">31-60d: {formatCurrency(cashFlow.ar['31-60 Days'])}</span>
                            <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">60+d: {formatCurrency(cashFlow.ar['60+ Days'])}</span>
                          </div>
                        )}
                      </div>

                      {/* AP Bar */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-semibold text-foreground-secondary">Payable (AP)</span>
                          <span className="text-xl font-bold text-rose-600">{formatCurrency(cashFlow.ap.total)}</span>
                        </div>
                        <div className="w-full bg-rose-50 rounded-full h-3">
                          <div className="bg-rose-500 h-3 rounded-full transition-all duration-500" style={{ 
                            width: cashFlow.ar.total > 0 ? `${Math.min((cashFlow.ap.total / cashFlow.ar.total) * 100, 100)}%` : (cashFlow.ap.total > 0 ? '100%' : '0%')
                          }} />
                        </div>
                      </div>

                      {/* Net */}
                      <div className="pt-5 border-t border-border/60">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-foreground">Net Position</span>
                          <span className={`text-2xl font-black ${cashFlow.netCashPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {cashFlow.netCashPosition >= 0 ? '+' : ''}{formatCurrency(cashFlow.netCashPosition)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

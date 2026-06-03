import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../services/api/dashboard.api';
import { PageContainer } from '../../../layouts/PageContainer';
import { Skeleton } from '../../../components/ui/loading/Skeleton';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { IndianRupee, ArrowDownLeft, ArrowUpRight, Clock, AlertTriangle, Package, FileText, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-foreground-secondary/70">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  }
  const isPositive = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{value}%
    </span>
  );
}

export function DashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'stats', period],
    queryFn: () => dashboardApi.getStats(period),
  });

  const greeting = useMemo(() => getGreeting(), []);

  const periodLabels: Record<string, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 3 Months',
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">{greeting} 👋</h1>
        </div>
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          Failed to load dashboard statistics. Please try again.
        </div>
      </PageContainer>
    );
  }

  // Format chart data with readable labels
  const chartData = data.revenueTrend.map((point) => {
    const d = new Date(point.date);
    let label: string;
    if (period === '7d') {
      label = format(d, 'EEE'); // Mon, Tue...
    } else if (period === '30d') {
      label = format(d, 'dd MMM'); // 01 Jan...
    } else {
      label = format(d, 'dd MMM'); // 01 Jan...
    }
    return { ...point, label };
  });

  const totalPeriodRevenue = data.revenueTrend.reduce((sum, p) => sum + p.revenue, 0);
  const totalPeriodInvoices = data.revenueTrend.reduce((sum, p) => sum + p.invoiceCount, 0);

  return (
    <PageContainer>
      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="text-sm text-foreground-secondary mt-0.5">
          Here's what's happening with your business today, {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Total Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-foreground">{formatCurrency(data.totalRevenue)}</span>
            <TrendBadge value={data.revenueChange} />
          </div>
          <p className="text-[11px] text-foreground-secondary/70 mt-1.5 font-medium">
            vs previous {period === '7d' ? 'week' : period === '30d' ? 'month' : '3 months'}
          </p>
        </div>

        {/* Accounts Receivable */}
        <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Receivable</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-foreground">{formatCurrency(data.accountsReceivable)}</span>
          <p className="text-[11px] text-foreground-secondary/70 mt-1.5 font-medium">Outstanding from customers</p>
        </div>

        {/* Accounts Payable */}
        <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Payable</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-foreground">{formatCurrency(data.accountsPayable)}</span>
          <p className="text-[11px] text-foreground-secondary/70 mt-1.5 font-medium">Owed to vendors</p>
        </div>

        {/* Quick Overview */}
        <div className="bg-surface border border-border/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Overview</span>
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{data.totalProducts}</p>
              <p className="text-[10px] text-foreground-secondary font-medium">Products</p>
            </div>
            <div className="text-center border-x border-border/60">
              <p className="text-lg font-bold text-foreground">{data.totalInvoices}</p>
              <p className="text-[10px] text-foreground-secondary font-medium">Invoices</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{data.totalCustomers}</p>
              <p className="text-[10px] text-foreground-secondary font-medium">Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-8 bg-surface border border-border/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Revenue Trend</h3>
              <p className="text-[11px] text-foreground-secondary mt-0.5">
                {formatCurrency(totalPeriodRevenue)} from {totalPeriodInvoices} invoice{totalPeriodInvoices !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex bg-background-secondary rounded-lg p-0.5">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    period === p
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {p === '7d' ? '7D' : p === '30d' ? '30D' : '90D'}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 h-[300px] w-full">
            {totalPeriodRevenue === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-foreground-secondary">
                <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">No revenue data for {periodLabels[period]}</p>
                <p className="text-xs mt-1">Revenue will appear here once invoices are finalized</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 500 }}
                    dy={8}
                    interval={period === '90d' ? 6 : period === '30d' ? 2 : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 500 }}
                    tickFormatter={(val) => val >= 1000 ? `₹${(val/1000).toFixed(0)}k` : `₹${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6', radius: 4 }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return format(new Date(payload[0].payload.date), 'EEE, MMM d, yyyy');
                      }
                      return '';
                    }}
                  />
                  <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={period === '7d' ? 45 : 20}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.revenue > 0 ? (index === chartData.length - 1 ? '#111827' : '#10B981') : '#E5E7EB'}
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Side Panels */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Recent Invoices */}
          <div className="bg-surface border border-border/80 rounded-xl shadow-sm flex flex-col" style={{ minHeight: '200px' }}>
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Recent Invoices
              </h3>
              <Link to="/bills" className="text-xs text-accent hover:underline font-semibold">View All</Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {data.recentActivity.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center py-6">
                  <FileText className="w-8 h-8 text-foreground-secondary/30 mb-2" />
                  <p className="text-xs font-medium text-foreground-secondary">No invoices yet</p>
                  <Link to="/bills/create" className="text-xs text-accent hover:underline mt-1">Create your first invoice →</Link>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {data.recentActivity.map((invoice) => (
                    <Link key={invoice._id} to={`/bills`} className="flex items-center justify-between px-4 py-2.5 hover:bg-background-secondary/50 transition-colors">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[13px] font-semibold text-foreground truncate">
                          {invoice.customerId?.name || 'Walk-in Customer'}
                        </span>
                        <span className="text-[11px] text-foreground-secondary">
                          #{invoice.invoiceNumber} • {format(new Date(invoice.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[13px] font-bold text-foreground">
                          {formatCurrency(invoice.total)}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          invoice.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                          invoice.paymentStatus === 'overdue' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {invoice.paymentStatus?.charAt(0).toUpperCase() + invoice.paymentStatus?.slice(1)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-surface border border-border/80 rounded-xl shadow-sm flex flex-col flex-1" style={{ minHeight: '170px' }}>
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Low Stock Alerts
              </h3>
              <Link to="/inventory" className="text-xs text-accent hover:underline font-semibold">Manage</Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {data.lowStockItems.length === 0 ? (
                <div className="flex h-full items-center justify-center py-6">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    All inventory levels healthy
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {data.lowStockItems.map((item) => (
                    <div key={item._id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[13px] font-medium text-foreground truncate pr-3">{item.name}</span>
                      <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                        {item.totalStock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

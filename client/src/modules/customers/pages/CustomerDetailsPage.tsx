import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Mail, Phone, MapPin, Hash, IndianRupee, 
  FileText, CreditCard, History, Calendar, Loader2 
} from 'lucide-react';
import { PageHeader } from '../../../layouts/PageHeader';
import { Button } from '../../../components/ui/button/Button';
import { StatCard } from '../../../components/ui/card/StatCard';
import { RecordPaymentModal } from '../../payments/components/RecordPaymentModal';
import { customerApi } from '../../../services/api/customer.api';
import { invoiceApi } from '../../../services/api/invoice.api';
import { paymentApi } from '../../../services/api/payment.api';

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'ledger'>('ledger');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch Customer details & stats
  const { data: detailData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getCustomer(id!),
    enabled: !!id,
  });

  // Fetch Customer ledger timeline
  const { data: ledgerData, isLoading: isLoadingLedger } = useQuery({
    queryKey: ['customer', 'ledger', id],
    queryFn: () => customerApi.getCustomerLedger(id!),
    enabled: !!id,
  });

  // Fetch Customer invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['customer', 'invoices', id],
    queryFn: () => invoiceApi.getInvoices({ customerId: id!, limit: 50 }),
    enabled: !!id,
  });

  // Fetch Customer payments
  const { data: paymentsData } = useQuery({
    queryKey: ['customer', 'payments', id],
    queryFn: () => paymentApi.getPayments({ customerId: id!, limit: 50 }),
    enabled: !!id,
  });

  if (isLoadingCustomer) {
    return (
      <div className="py-20 flex flex-col justify-center items-center gap-3 text-foreground-secondary">
        <div className="h-8 w-8 animate-spin border-2 border-accent border-t-transparent rounded-full" />
        <span className="text-sm font-medium">Loading customer dossier...</span>
      </div>
    );
  }

  const customerObj = detailData?.data?.customer;
  const stats = detailData?.data?.stats;
  const ledger = ledgerData?.data || [];
  const invoices = invoicesData?.data?.invoices || [];
  const payments = paymentsData?.data?.payments || [];

  if (!customerObj) {
    return (
      <div className="p-8 text-center">
        <p className="text-foreground-secondary">Customer profile not found.</p>
        <Button variant="secondary" onClick={() => navigate('/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link 
          to="/customers" 
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border hover:bg-background-secondary text-foreground-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm text-foreground-secondary">Back to Customers</span>
      </div>

      <PageHeader
        title={customerObj.name}
        subtitle={`Register ID: ${customerObj._id.substring(customerObj._id.length - 8).toUpperCase()}`}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsPaymentModalOpen(true)}
            className="font-semibold shadow-sm flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm"
          >
            <IndianRupee className="h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      {/* Customer profile fields */}
      <div className="p-5 rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary/70">Email Address</span>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Mail className="h-4 w-4 text-foreground-secondary" />
            <span>{customerObj.email || '—'}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary/70">Phone Number</span>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Phone className="h-4 w-4 text-foreground-secondary" />
            <span>{customerObj.phone || '—'}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary/70">GST / Tax ID</span>
          <div className="flex items-center gap-2 text-sm text-foreground font-mono">
            <Hash className="h-4 w-4 text-foreground-secondary" />
            <span>{customerObj.gstNumber || '—'}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary/70">Billing Address</span>
          <div className="flex items-center gap-2 text-sm text-foreground truncate">
            <MapPin className="h-4 w-4 text-foreground-secondary" />
            <span className="truncate">{customerObj.address || '—'}</span>
          </div>
        </div>
      </div>

      {/* Stripe-style clean aggregated statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Total Invoiced amount"
            value={`₹${stats.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={<FileText />}
          />
          <StatCard
            title="Total Payments Settled"
            value={`₹${stats.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={<CreditCard />}
          />
          <StatCard
            title="Current Accounts Outstanding"
            value={`₹${stats.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={<IndianRupee />}
          />
        </div>
      )}

      {/* Clean Tabs layout */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-1 ${
              activeTab === 'ledger' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            }`}
          >
            Ledger Timeline
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-1 ${
              activeTab === 'invoices' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            }`}
          >
            Sales Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-1 ${
              activeTab === 'payments' 
                ? 'border-accent text-accent' 
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            }`}
          >
            Payment Receipts ({payments.length})
          </button>
        </div>
      </div>

      {/* Tab content viewports */}
      <div className="space-y-4">
        {activeTab === 'ledger' && (
          <div className="p-6 border border-border/80 bg-surface rounded-xl shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]">
            <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-foreground-secondary" />
              Outstanding Account Ledger
            </h3>

            {isLoadingLedger ? (
              <div className="py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
              </div>
            ) : ledger.length === 0 ? (
              <div className="py-10 text-center text-foreground-secondary text-sm">
                No ledger records registered for this account yet.
              </div>
            ) : (
              <div className="relative border-l border-border pl-6 ml-3 space-y-8">
                {ledger.map((item) => (
                  <div key={item._id} className="relative group animate-in fade-in slide-in-from-left-2">
                    {/* Circle Node */}
                    <div className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border bg-background flex items-center justify-center transition-all ${
                      item.type === 'invoice' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-emerald-500 bg-emerald-50'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        item.type === 'invoice' ? 'bg-red-500' : 'bg-emerald-500'
                      }`} />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          item.type === 'invoice' 
                            ? 'bg-red-50 text-red-600 border-red-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {item.type === 'invoice' ? 'INVOICE CHARGE' : 'PAYMENT CREDIT'}
                        </span>
                        <h4 className="text-sm font-semibold text-foreground mt-1.5">
                          {item.description}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-foreground-secondary mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(item.date).toLocaleDateString('en-IN', { 
                              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-mono">Ref: {item.reference}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className={`text-base font-bold ${
                          item.type === 'invoice' ? 'text-foreground' : 'text-emerald-500'
                        }`}>
                          {item.type === 'invoice' ? '+' : '-'}₹{item.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-foreground-secondary mt-0.5">
                          Running: <span className="font-semibold">₹{item.runningBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="border border-border/80 bg-surface rounded-xl shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Invoice Ref</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Date Issued</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Due Date</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Workflow State</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Payment Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-foreground-secondary text-sm">
                      No invoices recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{inv.invoiceNumber}</td>
                      <td className="p-4 text-xs text-foreground-secondary">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-xs text-foreground-secondary">
                        {new Date(inv.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-xs capitalize text-foreground">{inv.workflowState}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          inv.paymentStatus === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : inv.paymentStatus === 'partial' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-right text-foreground">₹{inv.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="border border-border/80 bg-surface rounded-xl shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Receipt Ref</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Date Settled</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Method</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Trans Ref No</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-foreground-secondary text-sm">
                      No payments received from this customer yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="p-4 font-mono text-xs uppercase text-foreground">
                        {pay._id.substring(pay._id.length - 8)}
                      </td>
                      <td className="p-4 text-xs text-foreground-secondary">
                        {new Date(pay.paymentDate || pay.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-500 border-blue-500/20 capitalize">
                          {pay.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-foreground-secondary font-mono">
                        {pay.referenceNumber || '—'}
                      </td>
                      <td className="p-4 text-sm font-bold text-right text-emerald-500">₹{pay.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedCustomer={{ id: customerObj._id, ...customerObj }}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['customer', id] });
          queryClient.invalidateQueries({ queryKey: ['customer', 'ledger', id] });
          queryClient.invalidateQueries({ queryKey: ['customer', 'invoices', id] });
          queryClient.invalidateQueries({ queryKey: ['customer', 'payments', id] });
        }}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, CreditCard, IndianRupee, Wallet, Search, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../layouts/PageHeader';
import { Button } from '../../../components/ui/button/Button';
import { StatCard } from '../../../components/ui/card/StatCard';
import { Input } from '../../../components/ui/input/Input';
import { PaymentsTable } from '../components/PaymentsTable';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { paymentApi, type PaymentRecord } from '../../../services/api/payment.api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getPayments();
      if (response.success) {
        setPayments(response.data.payments);
      } else {
        setError(response.message || 'Failed to fetch payments');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(p => {
    const term = searchQuery.toLowerCase();
    const customerName = typeof p.customerId === 'object' ? p.customerId.name.toLowerCase() : '';
    const invoiceRef = typeof p.invoiceId === 'object' ? (p.invoiceId.invoiceNumber || '').toLowerCase() : '';
    const paymentId = p._id.toLowerCase();
    const method = p.paymentMethod.toLowerCase();
    
    // Check if the payment date matches the search term (e.g. "May", "2026", "26")
    const dateStr = new Date(p.paymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();

    return customerName.includes(term) || 
           invoiceRef.includes(term) || 
           paymentId.includes(term) || 
           method.includes(term) ||
           dateStr.includes(term);
  });
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <StatCard
          title="Total Collected"
          value={`₹${totalCollected.toFixed(2)}`}
          icon={<IndianRupee />}
        />
        <StatCard
          title="Total Transactions"
          value={payments.length.toString()}
          icon={<CreditCard />}
        />
        <StatCard
          title="Status"
          value="Live"
          icon={<Wallet />}
          description="Payments engine active"
        />
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="w-full max-w-sm">
            <Input 
              placeholder="Search payments by name, date, invoice ref..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-foreground-secondary" />}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {error}
          </div>
        ) : (
          <PaymentsTable payments={filteredPayments} />
        )}
      </div>

      {isModalOpen && (
        <RecordPaymentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}

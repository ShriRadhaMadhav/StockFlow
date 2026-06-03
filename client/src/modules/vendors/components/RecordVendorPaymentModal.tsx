import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Calendar } from 'lucide-react';
import { Modal } from '../../../components/ui/modal/Modal';
import { Button } from '../../../components/ui/button/Button';
import { Input } from '../../../components/ui/input/Input';
import { Select } from '../../../components/ui/input/Select';
import { vendorApi, type Vendor } from '../../../services/api/vendor.api';

interface RecordVendorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onSuccess: () => void;
}

export function RecordVendorPaymentModal({ isOpen, onClose, vendor, onSuccess }: RecordVendorPaymentModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Auto-set the remaining outstanding balance as the target payment amount
      setAmount(vendor.outstandingBalance > 0 ? vendor.outstandingBalance.toFixed(2) : '');
      setReferenceNumber('');
      setPaymentDate(new Date().toISOString().substring(0, 10));
      setError('');
    }
  }, [isOpen, vendor]);

  const payMutation = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque'; referenceNumber?: string; paymentDate?: string }) => {
      return vendorApi.recordPayment(vendor._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to record vendor payment');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    payMutation.mutate({
      amount: val,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      paymentDate: paymentDate || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Vendor Balance"
      description={`Record an accounts payable payment made to ${vendor.name} to reduce your outstanding debt.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="p-3 border border-border rounded-lg bg-background-secondary/30 mb-4">
          <div className="text-xs text-foreground-secondary uppercase tracking-wider font-semibold">Outstanding Debt Balance</div>
          <div className="text-xl font-bold text-foreground mt-0.5">
            ${vendor.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Payment Amount *</label>
            <Input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              leftIcon={<IndianRupee className="h-4 w-4" />}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Payment Method *</label>
            <Select
              required
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Credit Card</option>
              <option value="cheque">Cheque</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Reference Number (Optional)</label>
            <Input
              placeholder="e.g. Cheque #, Txn hash"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Payment Date</label>
            <Input
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={payMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={payMutation.isPending}
          >
            Record Settlement
          </Button>
        </div>
      </form>
    </Modal>
  );
}

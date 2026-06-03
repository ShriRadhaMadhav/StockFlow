import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/modal/Modal';
import { Button } from '../../../components/ui/button/Button';
import { Input } from '../../../components/ui/input/Input';
import { Select } from '../../../components/ui/input/Select';
import { CustomerSelector } from '../../billing/components/CustomerSelector';
import { paymentApi } from '../../../services/api/payment.api';
import { invoiceApi, type Invoice } from '../../../services/api/invoice.api';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCustomer?: any;
}

export function RecordPaymentModal({ isOpen, onClose, onSuccess, preselectedCustomer }: RecordPaymentModalProps) {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    if (preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
    }
  }, [preselectedCustomer, isOpen]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch customer's finalized invoices
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices', 'customer', selectedCustomer?._id || selectedCustomer?.id],
    queryFn: () => invoiceApi.getInvoices({ 
      // Using generic params since our backend usually supports passing these through
      // @ts-ignore
      customerId: selectedCustomer?._id || selectedCustomer?.id,
      workflowState: 'finalized',
      limit: 100
    }),
    enabled: !!selectedCustomer,
  });

  const unpaidInvoices = (invoicesData?.data?.invoices || []).filter(
    inv => inv.paymentStatus !== 'paid' && inv.workflowState === 'finalized'
  );

  useEffect(() => {
    // Reset selected invoice when customer changes
    setSelectedInvoice(null);
    setAmount('');
  }, [selectedCustomer]);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // Auto-fill amount with the total (simplification for now, ideal would be remaining balance)
    setAmount(invoice.total.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }
    if (!selectedInvoice) {
      setError('Please select an invoice');
      return;
    }
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (paymentAmount > selectedInvoice.total) {
      setError('Payment amount cannot exceed invoice total');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await paymentApi.recordPayment({
        customerId: selectedCustomer._id || selectedCustomer.id,
        invoiceId: selectedInvoice._id,
        amount: paymentAmount,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
      });
      
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        onSuccess();
      } else {
        setError(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description="Record a new payment received from a customer."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {preselectedCustomer ? (
            <div className="p-3 border border-border rounded-lg bg-background-secondary/30">
              <div className="font-semibold text-foreground text-sm">{selectedCustomer?.name}</div>
              <div className="text-xs text-foreground-secondary mt-1">{selectedCustomer?.email || 'No email'}</div>
            </div>
          ) : (
            <CustomerSelector 
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          )}

          {selectedCustomer && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Select Unpaid Invoice</label>
              
              {isLoadingInvoices ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <div className="p-4 border border-dashed border-border rounded-lg text-center text-foreground-secondary text-sm">
                  This customer has no unpaid finalized invoices.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {unpaidInvoices.map((inv) => (
                    <div 
                      key={inv._id}
                      onClick={() => handleSelectInvoice(inv)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedInvoice?._id === inv._id 
                          ? 'border-accent bg-accent/5' 
                          : 'border-border hover:border-accent/50 hover:bg-surface-hover/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`h-5 w-5 ${selectedInvoice?._id === inv._id ? 'text-accent' : 'text-foreground-secondary'}`} />
                        <div>
                          <div className="text-sm font-medium">{inv.invoiceNumber}</div>
                          <div className="text-xs text-foreground-secondary">
                            Status: <span className="capitalize">{inv.paymentStatus}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">${inv.total.toFixed(2)}</div>
                        {selectedInvoice?._id === inv._id && (
                          <CheckCircle2 className="h-4 w-4 text-accent ml-auto mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedInvoice && (
            <div className="space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Amount</label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    max={selectedInvoice.total}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    leftIcon={<IndianRupee className="h-4 w-4" />}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Payment Method</label>
                  <Select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Credit Card</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Reference Number (Optional)</label>
                <Input 
                  placeholder="e.g. Check #, Transaction ID"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedCustomer || !selectedInvoice || isSubmitting}
            isLoading={isSubmitting}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

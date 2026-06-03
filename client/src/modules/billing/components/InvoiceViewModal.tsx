import { Modal } from '../../../components/ui/modal/Modal';
import { Button } from '../../../components/ui/button/Button';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '../../../services/api/invoice.api';
import { Printer, Loader2, FileText } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { Badge } from '../../../components/ui/badge/Badge';

interface InvoiceViewModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceViewModal({ invoiceId, isOpen, onClose }: InvoiceViewModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceId ? invoiceApi.getInvoiceById(invoiceId) : null,
    enabled: !!invoiceId && isOpen,
  });

  const invoice = data?.data;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge variant="neutral">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Invoice Details"
      className="max-w-3xl print:max-w-none print:w-full print:shadow-none print:border-none print:m-0"
    >
      {/* Hide everything except this modal when printing */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-invoice, #printable-invoice * {
              visibility: visible;
            }
            #printable-invoice {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
            /* Overcome Modal overflow/height restrictions */
            .fixed, .absolute, .relative {
              position: static !important;
            }
            .overflow-hidden, .overflow-y-auto {
              overflow: visible !important;
              max-height: none !important;
            }
            /* Ensure modal container takes full height for printing */
            .max-h-\\[90vh\\] {
              max-height: none !important;
            }
          }
        `}
      </style>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-foreground-secondary">Loading invoice...</p>
        </div>
      ) : error ? (
        <div className="py-10 text-center text-red-500">
          Failed to load invoice details.
        </div>
      ) : invoice ? (
        <div className="flex flex-col h-full max-h-[80vh] print:max-h-none overflow-y-auto pr-2" id="printable-invoice">
          
          {/* Header Actions */}
          <div className="flex justify-between items-start mb-8 no-print">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Invoice {invoice.invoiceNumber}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(invoice.paymentStatus)}
                  <span className="text-xs text-foreground-secondary">{invoice.workflowState?.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <Button onClick={handlePrint} variant="secondary" className="gap-2">
              <Printer className="w-4 h-4" /> Print PDF
            </Button>
          </div>

          {/* Printable Area Starts Here */}
          <div className="bg-white p-8 border border-border rounded-xl shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-10 border-b border-border pb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">INVOICE</h1>
                <p className="text-sm font-medium text-foreground-secondary">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">StockFlow Business Inc.</p>
                <p className="text-xs text-foreground-secondary mt-1">123 Business Avenue</p>
                <p className="text-xs text-foreground-secondary">Tech District, CA 94103</p>
                <p className="text-xs text-foreground-secondary">contact@stockflow.com</p>
              </div>
            </div>

            {/* Bill To & Details */}
            <div className="flex justify-between mb-10">
              <div>
                <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-2">Billed To</p>
                <p className="text-sm font-bold text-foreground">{invoice.customerId?.name || 'Walk-in Customer'}</p>
                {invoice.customerId?.email && <p className="text-xs text-foreground-secondary mt-1">{invoice.customerId.email}</p>}
                {invoice.customerId?.phone && <p className="text-xs text-foreground-secondary mt-0.5">{invoice.customerId.phone}</p>}
                {invoice.customerId?.address && <p className="text-xs text-foreground-secondary mt-0.5">{invoice.customerId.address}</p>}
              </div>
              <div className="text-right">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <p className="text-xs font-medium text-foreground-secondary">Issue Date:</p>
                  <p className="text-xs font-semibold text-foreground">{formatDate(invoice.createdAt)}</p>
                  
                  <p className="text-xs font-medium text-foreground-secondary">Due Date:</p>
                  <p className="text-xs font-semibold text-foreground">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-border/60">
                    <th className="py-3 text-xs font-semibold text-foreground-secondary uppercase">Item Description</th>
                    <th className="py-3 text-right text-xs font-semibold text-foreground-secondary uppercase">Qty</th>
                    <th className="py-3 text-right text-xs font-semibold text-foreground-secondary uppercase">Rate</th>
                    <th className="py-3 text-right text-xs font-semibold text-foreground-secondary uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/40">
                      <td className="py-4 text-sm font-medium text-foreground">
                        {item.productId?.name || 'Unknown Product'}
                        {item.productId?.sku && <p className="text-xs text-foreground-secondary font-normal mt-0.5">SKU: {item.productId.sku}</p>}
                      </td>
                      <td className="py-4 text-sm text-right text-foreground-secondary">{item.quantity}</td>
                      <td className="py-4 text-sm text-right text-foreground-secondary">{formatCurrency(item.sellingPrice)}</td>
                      <td className="py-4 text-sm text-right font-medium text-foreground">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Tax ({invoice.taxPercentage}%)</span>
                    <span className="font-medium text-foreground">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Discount</span>
                    <span className="font-medium text-red-500">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t-2 border-border pt-3 mt-3">
                  <span className="text-base font-bold text-foreground">Total Due</span>
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            
            <div className="text-center mt-10 text-xs text-foreground-secondary italic">
              Thank you for your business!
            </div>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center text-foreground-secondary">
          No invoice selected.
        </div>
      )}
    </Modal>
  );
}

import type { PaymentRecord } from '../../../services/api/payment.api';

interface PaymentsTableProps {
  payments: PaymentRecord[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const formatMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'bank_transfer': return 'Bank Transfer';
      case 'cheque': return 'Cheque';
      default: return method;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'card': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'bank_transfer': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'cheque': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (payments.length === 0) {
    return (
      <div className="p-8 text-center text-foreground-secondary">
        No payments recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-hover/50">
            <th className="p-4 text-sm font-medium text-foreground-secondary">Payment ID</th>
            <th className="p-4 text-sm font-medium text-foreground-secondary">Date</th>
            <th className="p-4 text-sm font-medium text-foreground-secondary">Customer</th>
            <th className="p-4 text-sm font-medium text-foreground-secondary">Invoice Ref</th>
            <th className="p-4 text-sm font-medium text-foreground-secondary">Method</th>
            <th className="p-4 text-sm font-medium text-foreground-secondary text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payments.map((payment) => (
            <tr key={payment._id} className="hover:bg-surface-hover/30 transition-colors">
              <td className="p-4 text-sm font-medium">
                {payment._id.substring(payment._id.length - 6).toUpperCase()}
              </td>
              <td className="p-4 text-sm text-foreground-secondary">
                {new Date(payment.paymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="p-4 text-sm font-medium">
                {typeof payment.customerId === 'object' ? payment.customerId.name : 'Unknown'}
              </td>
              <td className="p-4 text-sm text-foreground-secondary">
                {typeof payment.invoiceId === 'object' ? payment.invoiceId.invoiceNumber : 'Unknown'}
              </td>
              <td className="p-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMethodColor(payment.paymentMethod)}`}>
                  {formatMethod(payment.paymentMethod)}
                </span>
                {payment.referenceNumber && (
                  <div className="text-xs text-foreground-secondary mt-1">
                    Ref: {payment.referenceNumber}
                  </div>
                )}
              </td>
              <td className="p-4 text-sm font-bold text-right text-emerald-400">
                ${payment.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

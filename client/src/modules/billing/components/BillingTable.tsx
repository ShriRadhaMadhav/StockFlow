import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table/Table';
import { Badge } from '../../../components/ui/badge/Badge';
import { Pagination } from '../../../components/ui/pagination/Pagination';
import type { Invoice } from '../../../services/api/invoice.api';

interface BillingTableProps {
  data: Invoice[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onView?: (id: string) => void;
}

export function BillingTable({ 
  data, 
  isLoading, 
  currentPage, 
  totalPages, 
  totalItems, 
  onPageChange,
  onView
}: BillingTableProps) {

  const getStatusBadgeVariant = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'partial': return 'warning';
      case 'overdue': return 'danger';
      default: return 'neutral';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-foreground-secondary">Loading invoices...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-foreground-secondary">No invoices found.</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right whitespace-nowrap">Items</TableHead>
            <TableHead className="text-right whitespace-nowrap">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Workflow State</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((invoice) => (
            <TableRow key={invoice._id} className="group cursor-pointer hover:bg-surface-hover/50 transition-colors" onClick={() => onView?.(invoice._id)}>
              <TableCell className="font-medium whitespace-nowrap text-accent hover:underline">{invoice.invoiceNumber || '-'}</TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                {typeof invoice.customerId === 'object' && invoice.customerId?.name ? invoice.customerId.name : invoice.customerId || 'Unknown'}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">{invoice.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</TableCell>
              <TableCell className="text-right tabular-nums whitespace-nowrap font-medium">{formatCurrency(invoice.total)}</TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(invoice.paymentStatus || 'pending')}>
                  {(invoice.paymentStatus || 'Pending').charAt(0).toUpperCase() + (invoice.paymentStatus || 'Pending').slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-foreground-secondary uppercase tracking-wide font-semibold">
                {invoice.workflowState}
              </TableCell>
              <TableCell className="text-foreground-secondary whitespace-nowrap">{formatDate(invoice.dueDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {totalItems > 0 && (
        <div className="flex items-center justify-between px-2 text-sm text-foreground-secondary">
          <div>
            Showing {data.length} entries of {totalItems} total
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MapPin } from 'lucide-react';
import type { Customer } from '../../../services/api/customer.api';

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div className="p-8 text-center text-foreground-secondary">
        No customers matching your search criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-hover/50">
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Customer Name</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Contact Info</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">GST / Tax ID</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Billing Address</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary text-right">Outstanding Balance</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-foreground-secondary text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {customers.map((customer) => (
            <tr key={customer._id} className="hover:bg-surface-hover/30 transition-all group">
              <td className="p-4">
                <Link 
                  to={`/customers/${customer._id}`}
                  className="font-medium text-foreground group-hover:text-accent transition-colors hover:underline"
                >
                  {customer.name}
                </Link>
              </td>
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground-secondary mt-0.5">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {!customer.email && !customer.phone && (
                    <span className="text-xs text-foreground-secondary/60">No contact info</span>
                  )}
                </div>
              </td>
              <td className="p-4 text-xs text-foreground-secondary font-mono">
                {customer.gstNumber || <span className="text-foreground-secondary/40">—</span>}
              </td>
              <td className="p-4">
                <div className="flex items-start gap-1.5 text-xs text-foreground-secondary max-w-xs truncate">
                  {customer.address ? (
                    <>
                      <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{customer.address}</span>
                    </>
                  ) : (
                    <span className="text-foreground-secondary/40">—</span>
                  )}
                </div>
              </td>
              <td className="p-4 text-sm font-bold text-right text-foreground">
                ₹{customer.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="p-4 text-right">
                <Link
                  to={`/customers/${customer._id}`}
                  className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:gap-1.5 transition-all"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

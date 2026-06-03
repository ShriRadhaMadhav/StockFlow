import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, Search, Loader2, IndianRupee } from 'lucide-react';
import { PageHeader } from '../../../layouts/PageHeader';
import { Button } from '../../../components/ui/button/Button';
import { StatCard } from '../../../components/ui/card/StatCard';
import { Input } from '../../../components/ui/input/Input';
import { CustomersTable } from '../components/CustomersTable';
import { CustomerDrawer } from '../components/CustomerDrawer';
import { customerApi } from '../../../services/api/customer.api';
import { useDebounce } from '../../../hooks/useDebounce';

export default function CustomersPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, debouncedSearch],
    queryFn: () => customerApi.getCustomers({ page, limit: 10, search: debouncedSearch }),
  });

  const responseData = data?.data;
  const customers = responseData?.customers || [];

  // Calculate aggregates for current list
  const totalReceivables = customers.reduce((sum, cust) => sum + cust.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage customer directories, track outstanding accounts receivable, and view ledger ledgers."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Customers' }
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsDrawerOpen(true)}
            className="font-semibold shadow-sm flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {/* Modern, Notion-style aggregate widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <StatCard
          title="Total Registered Customers"
          value={responseData?.total !== undefined ? responseData.total.toString() : '—'}
          icon={<Users />}
        />
        <StatCard
          title="Page Outstanding Receivables"
          value={`₹${totalReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<IndianRupee />}
        />
      </div>

      <div className="flex flex-col space-y-4">
        {/* Sleek search input */}
        <div className="relative max-w-md w-full">
          <Input
            placeholder="Search customers by name, email or phone..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* List table */}
        <div className="border border-border/80 bg-surface rounded-xl shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col justify-center items-center gap-3 text-foreground-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="text-sm font-medium">Loading customer accounts...</span>
            </div>
          ) : (
            <CustomersTable customers={customers} />
          )}
        </div>

        {/* Pagination controls */}
        {responseData && responseData.totalPages > 1 && (
          <div className="flex items-center justify-between py-4">
            <span className="text-xs text-foreground-secondary">
              Showing Page {responseData.page} of {responseData.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === responseData.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Creation Drawer */}
      <CustomerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

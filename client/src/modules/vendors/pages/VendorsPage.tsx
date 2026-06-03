import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, Search, Loader2, IndianRupee } from 'lucide-react';
import { PageHeader } from '../../../layouts/PageHeader';
import { Button } from '../../../components/ui/button/Button';
import { StatCard } from '../../../components/ui/card/StatCard';
import { Input } from '../../../components/ui/input/Input';
import { VendorsTable } from '../components/VendorsTable';
import { VendorDrawer } from '../components/VendorDrawer';
import { vendorApi } from '../../../services/api/vendor.api';
import { useDebounce } from '../../../hooks/useDebounce';

export default function VendorsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, debouncedSearch],
    queryFn: () => vendorApi.getVendors({ page, limit: 10, search: debouncedSearch }),
  });

  const responseData = data?.data;
  const vendors = responseData?.vendors || [];

  // Calculate aggregates for current list
  const totalPayables = vendors.reduce((sum, vend) => sum + vend.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        subtitle="Manage supplier profiles, inventory purchase invoices, and log accounts payable."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Vendors' }
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsDrawerOpen(true)}
            className="font-semibold shadow-sm flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        }
      />

      {/* Notion-style micro-widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <StatCard
          title="Total Registered Vendors"
          value={responseData?.total !== undefined ? responseData.total.toString() : '—'}
          icon={<Users />}
        />
        <StatCard
          title="Page Outstanding Payables"
          value={`₹${totalPayables.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<IndianRupee />}
        />
      </div>

      <div className="flex flex-col space-y-4">
        {/* Sleek search input */}
        <div className="relative max-w-md w-full">
          <Input
            placeholder="Search vendors by name, email or phone..."
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
              <span className="text-sm font-medium">Loading vendor catalog...</span>
            </div>
          ) : (
            <VendorsTable vendors={vendors} />
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

      {/* Vendor Drawer overlay */}
      <VendorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

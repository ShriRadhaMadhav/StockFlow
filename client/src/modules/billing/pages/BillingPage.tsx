import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../layouts/PageContainer';
import { PageHeader } from '../../../layouts/PageHeader';
import { QuickActions } from '../../../components/ui/button/QuickActions';
import { BillingFilters } from '../components/BillingFilters';
import { BillingTable } from '../components/BillingTable';
import { InvoiceViewModal } from '../components/InvoiceViewModal';
import { invoiceApi } from '../../../services/api/invoice.api';
import { useDebounce } from '../../../hooks/useDebounce';

export default function BillingPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, debouncedSearch, status],
    queryFn: () => invoiceApi.getInvoices({ 
      page, 
      limit: 10,
      search: debouncedSearch,
      status: status !== 'all' ? status : undefined
    }),
  });

  const invoicesData = data?.data;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Bills & Invoices"
        subtitle="Manage customer invoices, track payments, and export billing data."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Bills' }
        ]}
        actions={
          <QuickActions
            primaryActionLabel="Create Invoice"
            onPrimaryAction={() => navigate('/bills/create')}
          />
        }
      />

      <div className="flex flex-col space-y-4">
        <BillingFilters 
          search={search}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={handleStatusChange}
        />
        <BillingTable 
          data={invoicesData?.invoices || []} 
          isLoading={isLoading}
          currentPage={invoicesData?.page || 1}
          totalPages={invoicesData?.totalPages || 1}
          totalItems={invoicesData?.total || 0}
          onPageChange={setPage}
          onView={(id) => setSelectedInvoiceId(id)}
        />
      </div>

      <InvoiceViewModal 
        invoiceId={selectedInvoiceId}
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </PageContainer>
  );
}

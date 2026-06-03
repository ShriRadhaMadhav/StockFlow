import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../../services/api/inventory.api';
import { vendorApi } from '../../../services/api/vendor.api';
import { PageContainer } from '../../../layouts/PageContainer';
import { PageHeader } from '../../../layouts/PageHeader';
import { Skeleton } from '../../../components/ui/loading/Skeleton';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { Button } from '../../../components/ui/button/Button';
import { formatCurrency } from '../../../utils/format';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { PurchaseFilters } from '../components/PurchaseFilters';
import { useDebounce } from '../../../hooks/useDebounce';

export function PurchasesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productId, setProductId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');

  const debouncedMinCost = useDebounce(minCost, 400);
  const debouncedMaxCost = useDebounce(maxCost, 400);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchases', startDate, endDate, productId, vendorId, debouncedMinCost, debouncedMaxCost],
    queryFn: () => inventoryApi.getBatches({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      productId: productId || undefined,
      vendorId: vendorId || undefined,
      minCost: debouncedMinCost ? parseFloat(debouncedMinCost) : undefined,
      maxCost: debouncedMaxCost ? parseFloat(debouncedMaxCost) : undefined,
    }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-for-filters'],
    queryFn: () => inventoryApi.getProducts({ limit: 100 }),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-for-filters'],
    queryFn: () => vendorApi.getVendors({ limit: 100 }),
  });

  const products = productsData?.data?.products || [];
  const vendors = vendorsData?.data?.vendors || [];

  const filters = {
    startDate,
    endDate,
    productId,
    vendorId,
    minCost,
    maxCost,
  };

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'startDate':
        setStartDate(value);
        break;
      case 'endDate':
        setEndDate(value);
        break;
      case 'productId':
        setProductId(value);
        break;
      case 'vendorId':
        setVendorId(value);
        break;
      case 'minCost':
        setMinCost(value);
        break;
      case 'maxCost':
        setMaxCost(value);
        break;
      default:
        break;
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setProductId('');
    setVendorId('');
    setMinCost('');
    setMaxCost('');
  };

  const hasActiveFilters = Object.values(filters).some((val) => val !== '');
  const batches = data?.data || [];

  return (
    <PageContainer>
      <PageHeader 
        title="Purchases" 
        actions={
          <Link 
            to="/ocr-imports" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-lg shadow-sm hover:bg-foreground/90 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
            Upload Bill (AI OCR)
          </Link>
        }
      />

      <div className="mt-6 space-y-6">
        <PurchaseFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          products={products}
          vendors={vendors}
        />

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : isError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            Failed to load purchases.
          </div>
        ) : batches.length === 0 ? (
          <EmptyState 
            icon={Package}
            title={hasActiveFilters ? "No Matching Purchases" : "No Purchases Found"}
            description={
              hasActiveFilters 
                ? "Try adjusting your filters or cost boundaries to find the purchases you are looking for."
                : "You haven't recorded any incoming inventory batches yet. Go to Inventory to add stock."
            }
            action={
              hasActiveFilters ? (
                <Button onClick={handleClearFilters} variant="secondary" className="mt-2">
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="border border-border/80 bg-surface rounded-xl overflow-hidden shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground-secondary">
                <thead className="bg-surface-hover/50 border-b border-border/80 text-xs uppercase text-foreground-secondary/70 font-medium tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4 text-right">Quantity</th>
                    <th className="px-6 py-4 text-right">Cost</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-surface">
                  {batches.map((batch: any) => (
                    <tr key={batch._id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(batch.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {batch.productId?.name || 'Unknown Product'}
                      </td>
                      <td className="px-6 py-4">
                        {batch.vendorId ? (
                          <Link to={`/vendors/${batch.vendorId._id}`} className="text-primary hover:underline">
                            {batch.vendorId.name}
                          </Link>
                        ) : (
                          <span className="text-foreground-secondary/50">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {batch.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {batch.quantity} {batch.productId?.unit || ''}
                      </td>
                      <td className="px-6 py-4 text-right text-foreground">
                        {formatCurrency(batch.purchasePrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        {formatCurrency(batch.quantity * batch.purchasePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../../services/api/inventory.api';
import { PageContainer } from '../../../layouts/PageContainer';
import { PageHeader } from '../../../layouts/PageHeader';
import { Skeleton } from '../../../components/ui/loading/Skeleton';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { Button } from '../../../components/ui/button/Button';
import { format } from 'date-fns';
import { Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { StockMovementFilters } from '../components/StockMovementFilters';

export function StockMovementsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('');
  const [source, setSource] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['stock-movements', startDate, endDate, productId, type, source],
    queryFn: () => inventoryApi.getStockMovements({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      productId: productId || undefined,
      type: type || undefined,
      source: source || undefined,
    }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-for-filters'],
    queryFn: () => inventoryApi.getProducts({ limit: 100 }),
  });

  const products = productsData?.data?.products || [];

  const filters = {
    startDate,
    endDate,
    productId,
    type,
    source,
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
      case 'type':
        setType(value);
        break;
      case 'source':
        setSource(value);
        break;
      default:
        break;
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setProductId('');
    setType('');
    setSource('');
  };

  const hasActiveFilters = Object.values(filters).some((val) => val !== '');
  const movements = data?.data || [];

  return (
    <PageContainer>
      <PageHeader 
        title="Stock Movements" 
      />

      <div className="mt-6 space-y-6">
        <StockMovementFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          products={products}
        />

        {isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : isError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            Failed to load stock movements.
          </div>
        ) : movements.length === 0 ? (
          <EmptyState 
            icon={Activity}
            title={hasActiveFilters ? "No Matching Movements" : "No Movements Found"}
            description={
              hasActiveFilters 
                ? "Try adjusting your filters to find the stock movements you are looking for."
                : "Your inventory ledger is empty."
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
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4 text-right">Quantity Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-surface">
                  {movements.map((movement: any) => {
                    const isPositive = movement.quantity > 0;
                    return (
                      <tr key={movement._id} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium">{format(new Date(movement.timestamp), 'MMM d, yyyy')}</span>
                            <span className="text-xs">{format(new Date(movement.timestamp), 'h:mm a')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {movement.productId?.name || 'Unknown Product'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            movement.type === 'purchase' ? 'bg-emerald-500/10 text-emerald-600' :
                            movement.type === 'sale' ? 'bg-rose-500/10 text-rose-600' :
                            'bg-amber-500/10 text-amber-600'
                          }`}>
                            {movement.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {movement.source}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex items-center gap-1 font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? '+' : ''}{movement.quantity} {movement.productId?.unit || ''}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

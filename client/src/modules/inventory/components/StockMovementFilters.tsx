import { SlidersHorizontal, X, Calendar, Package, ArrowRightLeft, Search } from 'lucide-react';
import { Input } from '../../../components/ui/input/Input';
import { Select } from '../../../components/ui/input/Select';
import { Button } from '../../../components/ui/button/Button';
import type { Product } from '../../../services/api/inventory.api';

interface StockMovementFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    productId: string;
    type: string;
    source: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  products: Product[];
}

export function StockMovementFilters({
  filters,
  onFilterChange,
  onClearFilters,
  products,
}: StockMovementFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((val) => val !== '');

  return (
    <div className="bg-surface/50 border border-border/80 rounded-xl p-5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Filter Stock Movements</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 flex items-center gap-1.5 px-2.5 rounded-lg"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range Filters */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-secondary/80 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Date Range
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="bg-surface border-border/80 text-xs h-9 cursor-pointer"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
            />
            <span className="text-xs text-foreground-secondary/50">to</span>
            <Input
              type="date"
              className="bg-surface border-border/80 text-xs h-9 cursor-pointer"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Product Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-secondary/80 flex items-center gap-1">
            <Package className="h-3 w-3" />
            Product
          </label>
          <Select
            className="bg-surface border-border/80 text-xs h-9"
            value={filters.productId}
            onChange={(e) => onFilterChange('productId', e.target.value)}
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Type Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-secondary/80 flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" />
            Movement Type
          </label>
          <Select
            className="bg-surface border-border/80 text-xs h-9"
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase (Incoming)</option>
            <option value="sale">Sale (Outgoing)</option>
            <option value="adjustment">Adjustment</option>
            <option value="return">Return</option>
            <option value="correction">Correction</option>
          </Select>
        </div>

        {/* Source Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground-secondary/80 flex items-center gap-1">
            <Search className="h-3 w-3" />
            Source
          </label>
          <Select
            className="bg-surface border-border/80 text-xs h-9"
            value={filters.source}
            onChange={(e) => onFilterChange('source', e.target.value)}
          >
            <option value="">All Sources</option>
            <option value="Invoice Generation">Invoice Generation</option>
            <option value="Inventory Batch Received">Inventory Batch Received</option>
            <option value="OCR Import">OCR Import</option>
            <option value="Manual Adjustment">Manual Adjustment</option>
          </Select>
        </div>
      </div>
    </div>
  );
}

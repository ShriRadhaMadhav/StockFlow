import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, PackageOpen, Loader2 } from 'lucide-react';
import { Input } from '../../../components/ui/input/Input';
import { inventoryApi } from '../../../services/api/inventory.api';
import { useDebounce } from '../../../hooks/useDebounce';
import { cn } from '../../../utils/cn';

interface ProductSelectorProps {
  onSelectProduct: (product: any) => void;
}

export function ProductSelector({ onSelectProduct }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'search', debouncedSearch],
    queryFn: () => inventoryApi.getProducts({ search: debouncedSearch, limit: 5 }),
    enabled: isDropdownOpen, // Only fetch when dropdown is open to save requests
  });

  const filteredProducts = data?.data?.products || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add Products</h3>
      </div>

      <div className="relative">
        <Input
          placeholder="Search products by name or SKU..."
          leftIcon={<Search className="h-4 w-4" />}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
          className="bg-surface"
        />
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-md z-20 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 flex justify-center text-foreground-secondary">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const availableStock = product.totalStock - product.reservedStock;
                const isOutOfStock = availableStock <= 0;
                return (
                  <div 
                    key={product._id}
                    className={cn(
                      "px-3 py-2 flex items-center justify-between text-sm transition-colors",
                      isOutOfStock ? "opacity-50 cursor-not-allowed bg-background" : "hover:bg-background-secondary cursor-pointer"
                    )}
                    onClick={() => {
                      if (!isOutOfStock) {
                        onSelectProduct(product);
                        setSearchTerm('');
                        setIsDropdownOpen(false);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{product.name}</div>
                      <div className="text-xs text-foreground-secondary font-mono mt-0.5">{product.sku}</div>
                    </div>
                    <div className="text-right ml-4 flex flex-col items-end">
                      <div className="font-medium tabular-nums">₹{product.sellingPrice.toFixed(2)}</div>
                      <div className={cn("text-xs mt-0.5", isOutOfStock ? "text-error" : "text-success")}>
                        {availableStock} in stock
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <PackageOpen className="h-6 w-6 text-foreground-secondary mx-auto mb-2" />
                <p className="text-sm text-foreground-secondary">No products found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../../components/ui/input/Input';
import { Select } from '../../../components/ui/input/Select';
import { Button } from '../../../components/ui/button/Button';

interface InventoryFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
}

export function InventoryFilters({ search, onSearchChange, category, onCategoryChange, status, onStatusChange }: InventoryFiltersProps) {
  return (
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0 p-1">
      <div className="flex-1 w-full max-w-sm">
        <Input 
          type="search" 
          placeholder="Search product name or SKU..." 
          leftIcon={<Search className="h-4 w-4" />}
          className="bg-surface border-border"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <div className="w-full sm:w-40">
          <Select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="" disabled hidden>Category</option>
            <option value="">All Categories</option>
            <option value="Paper">Paper</option>
            <option value="Cardstock">Cardstock</option>
            <option value="Rolls">Rolls</option>
            <option value="Specialty">Specialty</option>
            <option value="Packaging">Packaging</option>
            <option value="Uncategorized">Uncategorized</option>
          </Select>
        </div>
        
        <div className="w-full sm:w-40">
          <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </Select>
        </div>

        <Button variant="secondary" size="icon" className="shrink-0 hidden sm:flex">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

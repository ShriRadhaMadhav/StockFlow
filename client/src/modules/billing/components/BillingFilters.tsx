import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../../components/ui/input/Input';
import { Select } from '../../../components/ui/input/Select';
import { Button } from '../../../components/ui/button/Button';

interface BillingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
}

export function BillingFilters({ search, onSearchChange, status, onStatusChange }: BillingFiltersProps) {
  return (
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0 p-1">
      <div className="flex-1 w-full max-w-sm">
        <Input 
          type="search" 
          placeholder="Search invoices by ID, customer..." 
          leftIcon={<Search className="h-4 w-4" />}
          className="bg-surface border-border"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <div className="w-full sm:w-40">
          <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>
        
        <Button variant="secondary" size="icon" className="shrink-0 hidden sm:flex" disabled>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

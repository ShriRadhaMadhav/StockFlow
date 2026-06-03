import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table/Table';
import { Badge } from '../../../components/ui/badge/Badge';
import { Button } from '../../../components/ui/button/Button';
import { Pagination } from '../../../components/ui/pagination/Pagination';
import type { Product } from '../../../services/api/inventory.api';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Dropdown } from '../../../components/ui/dropdown/Dropdown';

interface InventoryTableProps {
  data: Product[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit?: (product: Product) => void;
}

export function InventoryTable({ 
  data, 
  isLoading,
  currentPage, 
  totalPages, 
  totalItems,
  onPageChange,
  onEdit
}: InventoryTableProps) {
  
  const getStatusBadgeVariant = (product: Product) => {
    const available = product.totalStock - product.reservedStock;
    if (available <= 0) return 'danger';
    if (available <= product.lowStockThreshold) return 'warning';
    return 'success';
  };

  const getStatusText = (product: Product) => {
    const available = product.totalStock - product.reservedStock;
    if (available <= 0) return 'Out of Stock';
    if (available <= product.lowStockThreshold) return 'Low Stock';
    return 'In Stock';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-foreground-secondary">Loading inventory...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-foreground-secondary">No products found.</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right whitespace-nowrap">Sell Price</TableHead>
            <TableHead className="text-right whitespace-nowrap">Available Qty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px] whitespace-nowrap"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item._id} className="group">
              <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
              <TableCell className="text-foreground-secondary font-mono text-xs whitespace-nowrap">{item.sku}</TableCell>
              <TableCell className="whitespace-nowrap">{item.category}</TableCell>
              <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(item.sellingPrice)}</TableCell>
              <TableCell className="text-right tabular-nums whitespace-nowrap">{item.totalStock - item.reservedStock} {item.unit}</TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(item)}>
                  {getStatusText(item)}
                </Badge>
              </TableCell>
              <TableCell>
                <Dropdown
                  trigger={
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-foreground-secondary" />
                    </Button>
                  }
                  items={[
                    {
                      label: 'Edit Product',
                      icon: <Edit className="w-4 h-4 mr-2" />,
                      onClick: () => onEdit?.(item)
                    },
                    {
                      label: 'Delete',
                      icon: <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: () => console.log('Delete product', item._id),
                      variant: 'danger'
                    }
                  ]}
                  align="end"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {totalItems > 0 && (
        <div className="flex items-center justify-between px-2 text-sm text-foreground-secondary">
          <div>
            Showing {data.length} entries of {totalItems} total
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

import { Trash2, Minus, Plus } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table/Table';
import { Button } from '../../../components/ui/button/Button';
import type { InvoiceItem } from '../types/billing';

interface InvoiceLineItemsProps {
  items: InvoiceItem[];
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export function InvoiceLineItems({ items, onUpdateQuantity, onRemoveItem }: InvoiceLineItemsProps) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center bg-background-secondary/30 mt-4">
        <p className="text-sm text-foreground-secondary">No items added to this invoice yet.</p>
        <p className="text-xs text-foreground-secondary mt-1">Search and select products above to begin.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-background-secondary/50">
            <TableHead>Product</TableHead>
            <TableHead className="w-32 text-right">Qty</TableHead>
            <TableHead className="w-32 text-right">Unit Price</TableHead>
            <TableHead className="w-32 text-right">Subtotal</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="group">
              <TableCell>
                <div className="font-medium">{item.productName}</div>
                <div className="text-xs text-foreground-secondary font-mono mt-0.5">{item.sku}</div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end">
                  <div className="flex items-center border border-border rounded-md bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-accent">
                    <button 
                      className="px-2 py-1.5 text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors border-r border-border"
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center py-1 text-sm bg-transparent focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      className="px-2 py-1.5 text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors border-l border-border"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums text-foreground-secondary">
                ₹{item.unitPrice.toFixed(2)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium text-foreground">
                ₹{item.subtotal.toFixed(2)}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 transition-opacity text-error hover:text-error hover:bg-error/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

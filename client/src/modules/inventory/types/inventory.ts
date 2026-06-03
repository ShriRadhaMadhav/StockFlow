export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  vendor: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  reservedStock: number;
  availableStock: number;
  status: StockStatus;
  lastUpdated: string;
}

export type SortConfig = {
  key: keyof InventoryItem;
  direction: 'asc' | 'desc';
} | null;

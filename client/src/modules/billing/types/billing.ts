export type PaymentStatus = 'Paid' | 'Pending' | 'Partial' | 'Overdue';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface InvoiceItem {
  id: string; // Unique ID for the line item in this invoice
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: PaymentStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
}

export type SortConfig = {
  key: keyof Invoice | string;
  direction: 'asc' | 'desc';
} | null;

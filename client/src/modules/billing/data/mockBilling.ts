import type { Invoice, Customer } from '../types/billing';

export const mockCustomers: Customer[] = [
  { id: 'CUST-001', name: 'Acme Corp', email: 'billing@acmecorp.com', phone: '+1-555-0100', address: '123 Business Rd, New York, NY', taxId: 'TAX-123456' },
  { id: 'CUST-002', name: 'Global Tech', email: 'finance@globaltech.io', phone: '+1-555-0101', address: '456 Innovation Way, San Francisco, CA' },
  { id: 'CUST-003', name: 'Stark Industries', email: 'accounts@stark.com', phone: '+1-555-0102', address: '789 Industrial Blvd, Chicago, IL', taxId: 'TAX-987654' },
  { id: 'CUST-004', name: 'Wayne Enterprises', email: 'ap@wayne.com', phone: '+1-555-0103', address: '1007 Mountain Drive, Gotham' },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-1001',
    invoiceNumber: 'INV-2026-1001',
    customer: mockCustomers[0],
    items: [
      { id: 'item-1', productId: 'INV-001', productName: 'Premium A4 Copy Paper 80gsm', sku: 'PAP-A4-80-PREM', quantity: 50, unitPrice: 3.50, subtotal: 175.00 },
      { id: 'item-2', productId: 'INV-004', productName: 'Cardstock A4 250gsm White', sku: 'CRD-A4-250-WHT', quantity: 20, unitPrice: 12.50, subtotal: 250.00 }
    ],
    subtotal: 425.00,
    taxPercentage: 10,
    taxAmount: 42.50,
    discountAmount: 0,
    totalAmount: 467.50,
    status: 'Paid',
    issueDate: '2026-05-01T10:00:00Z',
    dueDate: '2026-05-15T10:00:00Z',
    notes: 'Thank you for your business!'
  },
  {
    id: 'INV-1002',
    invoiceNumber: 'INV-2026-1002',
    customer: mockCustomers[1],
    items: [
      { id: 'item-3', productId: 'INV-006', productName: 'Thermal Receipt Rolls 80x80mm', sku: 'THM-80X80-ROL', quantity: 100, unitPrice: 1.50, subtotal: 150.00 }
    ],
    subtotal: 150.00,
    taxPercentage: 10,
    taxAmount: 15.00,
    discountAmount: 10.00,
    totalAmount: 155.00,
    status: 'Pending',
    issueDate: '2026-05-20T10:00:00Z',
    dueDate: '2026-06-05T10:00:00Z',
  },
  {
    id: 'INV-1003',
    invoiceNumber: 'INV-2026-1003',
    customer: mockCustomers[2],
    items: [
      { id: 'item-4', productId: 'INV-002', productName: 'Standard A3 Printer Paper 70gsm', sku: 'PAP-A3-70-STD', quantity: 30, unitPrice: 7.20, subtotal: 216.00 }
    ],
    subtotal: 216.00,
    taxPercentage: 10,
    taxAmount: 21.60,
    discountAmount: 0,
    totalAmount: 237.60,
    status: 'Overdue',
    issueDate: '2026-04-10T10:00:00Z',
    dueDate: '2026-05-10T10:00:00Z',
    notes: 'Please remit payment immediately.'
  },
  {
    id: 'INV-1004',
    invoiceNumber: 'INV-2026-1004',
    customer: mockCustomers[3],
    items: [
      { id: 'item-5', productId: 'INV-008', productName: 'Kraft Packing Paper Roll 50cm', sku: 'KRF-50CM-ROL', quantity: 10, unitPrice: 22.00, subtotal: 220.00 }
    ],
    subtotal: 220.00,
    taxPercentage: 10,
    taxAmount: 22.00,
    discountAmount: 0,
    totalAmount: 242.00,
    status: 'Partial',
    issueDate: '2026-05-25T10:00:00Z',
    dueDate: '2026-06-25T10:00:00Z',
  }
];

import { Modal } from '../../../components/ui/modal/Modal';
import { Button } from '../../../components/ui/button/Button';
import type { InvoiceItem, Customer } from '../types/billing';
import { Printer } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InvoiceItem[];
  customer: Customer | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  onConfirm?: () => void;
  isProcessing?: boolean;
}

export function PrintPreviewModal({ isOpen, onClose, items, customer, subtotal, taxAmount, total, onConfirm, isProcessing }: PrintPreviewModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Print Preview"
      className="max-w-4xl"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {onConfirm && (
              <Button onClick={onConfirm} isLoading={isProcessing} className="bg-success text-white hover:bg-success/90">
                Submit & Finalize
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handlePrint} className="flex items-center gap-2" variant="secondary" disabled={isProcessing}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      }
    >
      {/* Print Area - In a real app this might use an iframe or a specific printable layout class */}
      <div className="bg-white p-4 sm:p-8 rounded border border-border text-slate-900 mx-auto print:border-none print:p-0 print:m-0 w-full max-w-[21cm] min-h-auto sm:min-h-[29.7cm] overflow-x-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">INVOICE</h1>
            <p className="text-sm text-slate-500 mt-1">INV-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</p>
          </div>
          <div className="text-left sm:text-right text-sm">
            <h2 className="font-bold text-lg text-slate-900">StockFlow Wholesale</h2>
            <p className="text-slate-500 mt-1">123 Enterprise Blvd</p>
            <p className="text-slate-500">Suite 400</p>
            <p className="text-slate-500">Business City, BC 10020</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
            {customer ? (
              <div className="text-sm">
                <p className="font-bold text-slate-900">{customer.name}</p>
                <p className="text-slate-600 mt-1">{customer.address || 'No Address Provided'}</p>
                <p className="text-slate-600">{customer.email}</p>
                {customer.taxId && <p className="text-slate-600 mt-1">Tax ID: {customer.taxId}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No customer selected</p>
            )}
          </div>
          <div className="text-sm text-left sm:text-right space-y-1">
            <div className="flex sm:justify-end gap-4"><span className="text-slate-500 w-24 sm:w-auto">Issue Date:</span> <span className="font-medium text-slate-900">{new Date().toLocaleDateString()}</span></div>
            <div className="flex sm:justify-end gap-4"><span className="text-slate-500 w-24 sm:w-auto">Due Date:</span> <span className="font-medium text-slate-900">Net 30 Days</span></div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 font-semibold text-slate-900">Description</th>
                <th className="text-right py-3 font-semibold text-slate-900">Qty</th>
                <th className="text-right py-3 font-semibold text-slate-900">Unit Price</th>
                <th className="text-right py-3 font-semibold text-slate-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3">
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                  </td>
                  <td className="text-right py-3 tabular-nums text-slate-700">{item.quantity}</td>
                  <td className="text-right py-3 tabular-nums text-slate-700">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="text-right py-3 tabular-nums font-medium text-slate-900">₹{item.subtotal.toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">No items added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-64 text-sm space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Amount</span>
              <span className="tabular-nums">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-slate-900">
              <span className="font-bold text-slate-900">Total Due</span>
              <span className="font-bold text-lg tabular-nums text-slate-900">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-8 text-xs text-slate-500 text-center">
          <p>Please make checks payable to <strong>StockFlow Wholesale</strong>.</p>
          <p className="mt-1">For any questions concerning this invoice, please contact billing@stockflow.com.</p>
          <p className="mt-4 font-medium text-slate-400">Thank you for your business!</p>
        </div>

      </div>
    </Modal>
  );
}

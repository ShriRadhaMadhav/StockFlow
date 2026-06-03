import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../layouts/PageContainer';
import { PageHeader } from '../../../layouts/PageHeader';
import { CustomerSelector } from '../components/CustomerSelector';
import { ProductSelector } from '../components/ProductSelector';
import { InvoiceLineItems } from '../components/InvoiceLineItems';
import { InvoiceSummary } from '../components/InvoiceSummary';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { invoiceApi } from '../../../services/api/invoice.api';
import type { Customer, InvoiceItem } from '../types/billing';
import { useNavigate } from 'react-router-dom';

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Computed values
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = subtotal * (taxPercentage / 100);
  const total = subtotal + taxAmount;

  const handleSelectProduct = useCallback((product: any) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.productId === product._id);
      
      if (existingItemIndex >= 0) {
        const newItems = [...currentItems];
        const existing = newItems[existingItemIndex];
        const newQty = existing.quantity + 1;
        newItems[existingItemIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.unitPrice
        };
        return newItems;
      }

      const newItem: InvoiceItem = {
        id: `item-${Date.now()}`,
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        subtotal: product.sellingPrice
      };
      return [...currentItems, newItem];
    });
  }, []);

  const handleUpdateQuantity = useCallback((id: string, newQuantity: number) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
          : item
      )
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  }, []);

  const createInvoiceMutation = useMutation({
    mutationFn: async (workflowState: 'draft' | 'finalized') => {
      if (!customer) throw new Error("Please select a customer.");
      if (items.length === 0) throw new Error("Please add at least one item.");

      return invoiceApi.createInvoice({
        customerId: customer.id, // mapped from frontend structure
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          sellingPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        subtotal,
        taxPercentage,
        taxAmount,
        discountAmount: 0,
        total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        workflowState
      });
    },
    onSuccess: () => {
      // Invalidate queries so that dashboard and bills page refresh instantly
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      
      // Clear form on success
      setCustomer(null);
      setItems([]);
      setErrorMsg('');
      navigate('/bills');
    },
    onError: (err: Error) => {
      // Critical UX: preserve the form state, just show the transactional error
      setErrorMsg(err.message);
      setIsPreviewOpen(false); // Close preview if open
    }
  });

  const handleSaveDraft = () => {
    setErrorMsg('');
    createInvoiceMutation.mutate('draft');
  };

  const handleFinalize = () => {
    // We open preview first, but actual finalization happens there or we just confirm
    setIsPreviewOpen(true);
  };

  const submitFinalized = () => {
    setErrorMsg('');
    createInvoiceMutation.mutate('finalized');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Invoice"
        subtitle="Generate a new invoice for a customer."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Bills', href: '/bills' },
          { label: 'Create Invoice' }
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* LEFT COLUMN: Data Entry (70%) */}
        <div className="flex-1 lg:w-[70%] space-y-6">
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-200 shadow-sm flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
            </div>
          )}

          <div className="bg-surface border border-border rounded-lg p-5">
            <CustomerSelector 
              selectedCustomer={customer} 
              onSelect={setCustomer} 
            />
          </div>

          <div className="bg-surface border border-border rounded-lg p-5">
            <ProductSelector 
              onSelectProduct={handleSelectProduct} 
            />
            <InvoiceLineItems 
              items={items} 
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>

        </div>

        {/* RIGHT COLUMN: Live Summary (30%) */}
        <div className="lg:w-[30%] lg:min-w-[320px]">
          <InvoiceSummary 
            subtotal={subtotal}
            taxPercentage={taxPercentage}
            onUpdateTax={setTaxPercentage}
            onFinalize={handleFinalize}
            onSaveDraft={handleSaveDraft}
          />
          {createInvoiceMutation.isPending && (
            <div className="mt-4 text-center text-sm text-foreground-secondary font-medium">
              Processing Transaction...
            </div>
          )}
        </div>
      </div>

      <PrintPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        items={items}
        customer={customer}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        onConfirm={submitFinalized}
        isProcessing={createInvoiceMutation.isPending}
      />
    </PageContainer>
  );
}

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer } from '../../../components/ui/drawer/Drawer';
import { Button } from '../../../components/ui/button/Button';
import { Input } from '../../../components/ui/input/Input';
import { Select } from '../../../components/ui/input/Select';
import { inventoryApi } from '../../../services/api/inventory.api';
import type { Product } from '../../../services/api/inventory.api';

interface AddProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Product | null;
}

export function AddProductDrawer({ isOpen, onClose, initialData }: AddProductDrawerProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    sellingPrice: '',
    purchasePrice: '',
    initialQuantity: '',
    lowStockThreshold: '10',
    totalStock: '',
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        category: initialData.category || '',
        sellingPrice: initialData.sellingPrice?.toString() || '',
        purchasePrice: '', // Can't edit initial purchase price easily here
        initialQuantity: '', // Doesn't make sense for edit
        lowStockThreshold: initialData.lowStockThreshold?.toString() || '10',
        totalStock: initialData.totalStock?.toString() || '0',
      });
    } else {
      setFormData({ name: '', sku: '', category: '', sellingPrice: '', purchasePrice: '', initialQuantity: '', lowStockThreshold: '10', totalStock: '' });
    }
    setErrorMsg('');
  }, [initialData, isOpen]);
  
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createOrUpdateProductMutation = useMutation({
    mutationFn: async () => {
      if (isEditing && initialData) {
        // Update Product
        return await inventoryApi.updateProduct(initialData._id, {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unit: 'pcs', // Or get from initialData if needed
          sellingPrice: Number(formData.sellingPrice),
          lowStockThreshold: Number(formData.lowStockThreshold),
          totalStock: Number(formData.totalStock),
        });
      } else {
        // 1. Create Product
        const productRes = await inventoryApi.createProduct({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unit: 'pcs',
          sellingPrice: Number(formData.sellingPrice),
          lowStockThreshold: Number(formData.lowStockThreshold),
        });

        const productId = productRes.data._id;

        // 2. Create Initial Batch if quantity > 0
        const qty = Number(formData.initialQuantity);
        if (qty > 0) {
          await inventoryApi.createBatch({
            productId,
            quantity: qty,
            purchasePrice: Number(formData.purchasePrice) || 0,
          });
        }
        
        return productRes;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFormData({ name: '', sku: '', category: '', sellingPrice: '', purchasePrice: '', initialQuantity: '', lowStockThreshold: '10', totalStock: '' });
      setErrorMsg('');
      onClose();
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    createOrUpdateProductMutation.mutate();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Add New Product"}
      description={isEditing ? "Update product details." : "Create a new inventory item in the system."}
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} disabled={createOrUpdateProductMutation.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={createOrUpdateProductMutation.isPending}>
            {isEditing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200">
            {errorMsg}
          </div>
        )}
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Basic Information</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">Product Name *</label>
              <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. A4 Premium Copy Paper" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">SKU *</label>
                <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. PAP-A4-PREM" className="font-mono text-xs" required disabled={isEditing} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">Category *</label>
                <Select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="" disabled hidden>Select category...</option>
                  <option value="Paper">Paper</option>
                  <option value="Cardstock">Cardstock</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Uncategorized">Uncategorized</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Pricing & Stock</h4>
          <div className="grid grid-cols-2 gap-3">
            {!isEditing && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">Purchase Price</label>
                  <Input name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} type="number" step="0.01" placeholder="0.00" leftIcon={<span className="text-xs">₹</span>} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">Initial Quantity</label>
                  <Input name="initialQuantity" value={formData.initialQuantity} onChange={handleChange} type="number" placeholder="0" />
                </div>
              </>
            )}
            {isEditing && (
              <div>
                <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">Total Quantity</label>
                <Input name="totalStock" value={formData.totalStock} onChange={handleChange} type="number" placeholder="0" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">Selling Price *</label>
              <Input name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} type="number" step="0.01" placeholder="0.00" leftIcon={<span className="text-xs">₹</span>} required />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">Low Stock Threshold</label>
              <Input name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} type="number" placeholder="10" />
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
}

import { useState, useRef } from 'react';
import { Drawer } from '../../../components/ui/drawer/Drawer';
import { Button } from '../../../components/ui/button/Button';
import { ScanText, CheckCircle2, ArrowRight, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table/Table';
import { Badge } from '../../../components/ui/badge/Badge';
import { ocrApi } from '../../../services/api/ocr.api';
import { vendorApi } from '../../../services/api/vendor.api';
import { inventoryApi } from '../../../services/api/inventory.api';
import { formatCurrency } from '../../../utils/format';
import { useQueryClient } from '@tanstack/react-query';

interface OCRImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'processing' | 'verify';

export function OCRImportDrawer({ isOpen, onClose }: OCRImportDrawerProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable state
  const [editableResult, setEditableResult] = useState<any>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      const res = await ocrApi.uploadBill(file);
      const data = (res as any).data;
      
      // Initialize editable state with empty fields for selling price and threshold
      setEditableResult({
        vendorName: data.vendorName || '',
        invoiceNumber: data.invoiceNumber || '',
        date: data.date || '',
        totalAmount: data.totalAmount || 0,
        items: (data.items || []).map((item: any) => ({
          ...item,
          sellingPrice: '', // Set by user
          lowStockThreshold: '' // Set by user
        }))
      });
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to process image with AI.');
      setStep('upload');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setStep('upload');
    setEditableResult(null);
    setError(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setEditableResult((prev: any) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Recalculate total amount when quantity or unit price changes
      if (field === 'quantity' || field === 'unitPrice') {
         const newTotal = newItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
         return { ...prev, items: newItems, totalAmount: newTotal };
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleImport = async () => {
    if (!editableResult || editableResult.items.length === 0) {
      setError("No items to import.");
      return;
    }
    
    setIsImporting(true);
    setError(null);
    
    try {
      let vendorId = undefined;
      
      // 1. Create or Find Vendor
      if (editableResult.vendorName?.trim()) {
        const vendorName = editableResult.vendorName.trim();
        const vendorsRes = await vendorApi.getVendors({ search: vendorName });
        const existingVendor = vendorsRes.data.vendors.find((v: any) => v.name.toLowerCase() === vendorName.toLowerCase());
        
        if (existingVendor) {
          vendorId = existingVendor._id;
        } else {
          const newVendor = await vendorApi.createVendor({ name: vendorName });
          vendorId = newVendor.data._id;
        }
      }

      // 2. Process Items (Find/Create Product -> Create Batch)
      for (const item of editableResult.items) {
        if (!item.name?.trim() || !item.quantity || !item.unitPrice) continue;
        
        const itemName = item.name.trim();
        const productsRes = await inventoryApi.getProducts({ search: itemName });
        const existingProduct = productsRes.data.products.find((p: any) => p.name.toLowerCase() === itemName.toLowerCase());
        
        let productId;
        if (existingProduct) {
          productId = existingProduct._id;
          // Note: We might want to update the selling price here if it changed, but skipping for simplicity
        } else {
          // Generate a simple SKU
          const skuBase = itemName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM');
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const generatedSku = `${skuBase}-${randomNum}`;
          
          const newProduct = await inventoryApi.createProduct({
            name: itemName,
            sku: generatedSku,
            category: 'Uncategorized', // Default category
            unit: 'pcs',
            sellingPrice: Number(item.sellingPrice) || 0,
            lowStockThreshold: Number(item.lowStockThreshold) || 0
          });
          productId = newProduct.data._id;
        }

        // Create the inventory batch (purchase)
        await inventoryApi.createBatch({
          productId,
          quantity: Number(item.quantity),
          purchasePrice: Number(item.unitPrice),
          vendorId,
          invoiceNumber: editableResult.invoiceNumber
        });
      }

      // 3. Refresh data globally
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      handleReset();
    } catch (err: any) {
      setError(err.message || "Failed to commit import to database.");
      setIsImporting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleReset}
      title="OCR Invoice Import"
      description="Extract inventory line items directly from vendor invoices using AI."
      className="max-w-[800px]" // Wider drawer for editing
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={step === 'upload' ? 'text-accent' : 'text-foreground-secondary'}>1. Upload</span>
            <ArrowRight className="h-3 w-3 text-border" />
            <span className={step === 'processing' ? 'text-accent' : 'text-foreground-secondary'}>2. Processing</span>
            <ArrowRight className="h-3 w-3 text-border" />
            <span className={step === 'verify' ? 'text-accent' : 'text-foreground-secondary'}>3. Verify & Edit</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleReset} disabled={isImporting}>Cancel</Button>
            {step === 'upload' && <Button onClick={handleUploadClick}>Select Invoice Image</Button>}
            {step === 'verify' && (
              <Button onClick={handleImport} disabled={isImporting || !editableResult?.items?.length}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Committing...
                  </>
                ) : (
                  "Import Verified Items"
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />

        {step === 'upload' && (
          <div
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-10 bg-background-secondary/30 hover:bg-background-secondary/50 transition-colors cursor-pointer group"
            onClick={handleUploadClick}
          >
            <UploadCloud className="h-10 w-10 text-foreground-secondary mb-4 group-hover:text-accent transition-colors" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Upload Vendor Invoice</h3>
            <p className="text-xs text-foreground-secondary text-center max-w-sm">
              Upload a JPG or PNG invoice. Our AI will automatically extract line items, prices, and quantities for inventory import.
            </p>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-xs text-red-500 font-medium">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-background-secondary rounded-full animate-spin border-t-accent"></div>
              <ScanText className="h-6 w-6 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-6">Analyzing with AI...</h3>
            <p className="text-xs text-foreground-secondary mt-1">Extracting vendor, line items, and totals. This may take 10-20 seconds.</p>
          </div>
        )}

        {step === 'verify' && editableResult && (
          <div className="flex flex-col space-y-4 pb-10">
            <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Extraction Complete</p>
                  <p className="text-xs text-success/80">
                    Found {editableResult.items?.length || 0} line items. Please review and edit before committing.
                  </p>
                </div>
              </div>
              {editableResult.totalAmount > 0 && (
                <Badge variant="success">{formatCurrency(editableResult.totalAmount)}</Badge>
              )}
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Vendor & Invoice Info (Editable) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-background-secondary/30 rounded-lg">
                <label className="text-[10px] font-medium text-foreground-secondary uppercase tracking-wider block mb-1">Vendor Name</label>
                <input 
                  type="text" 
                  value={editableResult.vendorName} 
                  onChange={(e) => setEditableResult({...editableResult, vendorName: e.target.value})}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g. ABC Supplies"
                />
              </div>
              <div className="p-3 bg-background-secondary/30 rounded-lg">
                <label className="text-[10px] font-medium text-foreground-secondary uppercase tracking-wider block mb-1">Invoice #</label>
                <input 
                  type="text" 
                  value={editableResult.invoiceNumber} 
                  onChange={(e) => setEditableResult({...editableResult, invoiceNumber: e.target.value})}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="INV-..."
                />
              </div>
              <div className="p-3 bg-background-secondary/30 rounded-lg">
                <label className="text-[10px] font-medium text-foreground-secondary uppercase tracking-wider block mb-1">Date</label>
                <input 
                  type="text" 
                  value={editableResult.date} 
                  onChange={(e) => setEditableResult({...editableResult, date: e.target.value})}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>

            {/* Line Items Table (Editable) */}
            {editableResult.items && editableResult.items.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="w-24 text-right">Qty</TableHead>
                      <TableHead className="w-28 text-right">Purchase Price</TableHead>
                      <TableHead className="w-28 text-right">Selling Price</TableHead>
                      <TableHead className="w-24 text-right">Min Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableResult.items.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm"
                            step="0.01"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="number" 
                            value={item.sellingPrice} 
                            onChange={(e) => handleItemChange(idx, 'sellingPrice', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm text-emerald-600 font-medium"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="number" 
                            value={item.lowStockThreshold} 
                            onChange={(e) => handleItemChange(idx, 'lowStockThreshold', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm text-amber-600 font-medium"
                            min="0"
                            placeholder="0"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

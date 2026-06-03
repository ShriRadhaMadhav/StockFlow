import { useState, useRef } from 'react';
import { PageContainer } from '../../../layouts/PageContainer';
import { PageHeader } from '../../../layouts/PageHeader';
import { UploadCloud, CheckCircle2, FileText, Loader2, ArrowRight } from 'lucide-react';
import { ocrApi } from '../../../services/api/ocr.api';
import { vendorApi } from '../../../services/api/vendor.api';
import { inventoryApi } from '../../../services/api/inventory.api';
import { formatCurrency } from '../../../utils/format';
import { Button } from '../../../components/ui/button/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export function OcrImportsPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError("Please upload a valid image file (PNG, JPG, JPEG).");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await ocrApi.uploadBill(selectedFile);
      const data = res.data;
      data.items = (data.items || []).map((item: any) => ({
        ...item,
        sellingPrice: '',
        lowStockThreshold: ''
      }));
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to process image with AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setResult((prev: any) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'quantity' || field === 'unitPrice') {
         const newTotal = newItems.reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
         return { ...prev, items: newItems, totalAmount: newTotal };
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    setResult((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleImport = async () => {
    if (!result || !result.items || result.items.length === 0) {
      setError("No items to import.");
      return;
    }
    
    setIsImporting(true);
    setError(null);
    
    try {
      let vendorId = undefined;
      
      // 1. Create or Find Vendor
      if (result.vendorName?.trim()) {
        const vendorName = result.vendorName.trim();
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
      for (const item of result.items) {
        if (!item.name?.trim() || !item.quantity || !item.unitPrice) continue;
        
        const itemName = item.name.trim();
        const productsRes = await inventoryApi.getProducts({ search: itemName });
        const existingProduct = productsRes.data.products.find((p: any) => p.name.toLowerCase() === itemName.toLowerCase());
        
        let productId;
        if (existingProduct) {
          productId = existingProduct._id;
        } else {
          // Generate a simple SKU
          const skuBase = itemName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM');
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const generatedSku = `${skuBase}-${randomNum}`;
          
          const newProduct = await inventoryApi.createProduct({
            name: itemName,
            sku: generatedSku,
            category: 'Uncategorized',
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
          invoiceNumber: result.invoiceNumber
        });
      }

      // 3. Refresh data globally
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      // Navigate to inventory
      navigate('/inventory');
    } catch (err: any) {
      setError(err.message || "Failed to commit import to database.");
      setIsImporting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="OCR Imports (AI Vision)" 
      />

      <div className="mt-8 max-w-6xl grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          <div 
            className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-200 ease-in-out ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/*"
              onChange={handleChange}
              disabled={isProcessing || isImporting}
            />
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${dragActive ? 'bg-primary/20 text-primary' : 'bg-surface-hover text-foreground-secondary'}`}>
                {isProcessing || isImporting ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isProcessing ? 'Analyzing with AI...' : isImporting ? 'Committing to DB...' : 'Click or drag image here'}
                </p>
                <p className="text-xs text-foreground-secondary mt-1">
                  Supports JPG, PNG (Max 5MB)
                </p>
              </div>
            </div>
          </div>
          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          {file && !isProcessing && !error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
              <FileText className="w-5 h-5 text-primary" />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-foreground-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="xl:col-span-2">
          {isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center border border-border bg-surface rounded-2xl p-8 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm font-medium text-foreground">Extracting Data...</p>
              <p className="text-xs text-foreground-secondary mt-1">Reading vendor names, line items, and totals.</p>
            </div>
          ) : result ? (
            <div className="border border-border bg-surface rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border bg-surface-hover/30">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Extraction Complete
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider block mb-1">Vendor</label>
                    <input 
                      type="text" 
                      value={result.vendorName || ''} 
                      onChange={(e) => handleFieldChange('vendorName', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                      placeholder="Vendor Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider block mb-1">Invoice #</label>
                    <input 
                      type="text" 
                      value={result.invoiceNumber || ''} 
                      onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                      placeholder="INV-..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider block mb-1">Date</label>
                    <input 
                      type="text" 
                      value={result.date || ''} 
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider block mb-1">Total Amount</label>
                    <div className="text-sm font-bold text-emerald-600 mt-2">{formatCurrency(result.totalAmount || 0)}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4">
                  <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider mb-2 block">Line Items</label>
                  {result.items && result.items.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 relative">
                      <div className="grid grid-cols-[1fr_60px_80px_80px_70px] sm:grid-cols-[1fr_80px_110px_110px_90px] gap-2 md:gap-4 px-3 py-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wider sticky top-0 bg-surface z-10 border-b border-border/50">
                        <div>Item Name</div>
                        <div className="text-right">Qty</div>
                        <div className="text-right">Buy Price</div>
                        <div className="text-right">Sell Price</div>
                        <div className="text-right">Min Qty</div>
                      </div>
                      {result.items.map((item: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-[1fr_60px_80px_80px_70px] sm:grid-cols-[1fr_80px_110px_110px_90px] gap-2 md:gap-4 text-sm p-3 bg-surface-hover rounded-lg border border-border/50 items-center">
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm truncate"
                            placeholder="Item Name"
                            title={item.name}
                          />
                          <input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm"
                            min="1"
                            placeholder="Qty"
                            title="Quantity"
                          />
                          <input 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm"
                            step="0.01"
                            min="0"
                            placeholder="Buy ₹"
                            title="Purchase Price"
                          />
                          <input 
                            type="number" 
                            value={item.sellingPrice || ''} 
                            onChange={(e) => handleItemChange(idx, 'sellingPrice', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm text-emerald-600 font-medium"
                            step="0.01"
                            min="0"
                            placeholder="Sell ₹"
                            title="Selling Price"
                          />
                          <input 
                            type="number" 
                            value={item.lowStockThreshold || ''} 
                            onChange={(e) => handleItemChange(idx, 'lowStockThreshold', e.target.value)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-1 text-sm text-amber-600 font-medium"
                            min="0"
                            placeholder="Min Qty"
                            title="Low Stock Threshold"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-secondary">No items detected.</p>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full justify-center group" 
                    onClick={handleImport}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Committing...
                      </>
                    ) : (
                      <>
                        Create Inventory Batch <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-border bg-surface/50 rounded-2xl p-8">
              <p className="text-sm text-foreground-secondary text-center">
                Upload a bill image to see the extracted AI data here.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

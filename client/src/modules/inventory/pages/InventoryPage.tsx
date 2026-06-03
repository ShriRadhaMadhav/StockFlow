import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../layouts/PageContainer';
import { PageHeader } from '../../../layouts/PageHeader';
import { QuickActions } from '../../../components/ui/button/QuickActions';
import { InventoryFilters } from '../components/InventoryFilters';
import { InventoryTable } from '../components/InventoryTable';
import { AddProductDrawer } from '../components/AddProductDrawer';
import { BulkImportModal } from '../components/BulkImportModal';
import { OCRImportDrawer } from '../components/OCRImportDrawer';
import { inventoryApi } from '../../../services/api/inventory.api';
import type { Product } from '../../../services/api/inventory.api';
import { useDebounce } from '../../../hooks/useDebounce';

export default function InventoryPage() {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isOCRDrawerOpen, setIsOCRDrawerOpen] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, debouncedSearch, category, status],
    queryFn: () => inventoryApi.getProducts({ 
      page, 
      limit: 10, 
      search: debouncedSearch, 
      category,
      status: status !== 'all' ? status : undefined
    }),
  });

  const productsData = data?.data;

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsAddDrawerOpen(false);
    setTimeout(() => setEditingProduct(null), 300); // Wait for drawer animation
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        subtitle="Manage your stock, pricing, and operational fulfillment."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Inventory' }
        ]}
        actions={
          <QuickActions
            primaryActionLabel="Add Product"
            onPrimaryAction={() => {
              setEditingProduct(null);
              setIsAddDrawerOpen(true);
            }}
            actions={[
              { label: 'OCR Import', onClick: () => setIsOCRDrawerOpen(true) },
              { label: 'Bulk CSV', onClick: () => setIsBulkModalOpen(true) }
            ]}
          />
        }
      />

      <div className="flex flex-col space-y-4">
        <InventoryFilters 
          search={search}
          onSearchChange={handleSearchChange}
          category={category}
          onCategoryChange={handleCategoryChange}
          status={status}
          onStatusChange={handleStatusChange}
        />
        <InventoryTable 
          data={productsData?.products || []} 
          isLoading={isLoading}
          currentPage={productsData?.page || 1}
          totalPages={productsData?.totalPages || 1}
          totalItems={productsData?.total || 0}
          onPageChange={setPage}
          onEdit={handleEditProduct}
        />
      </div>

      {/* Workflow Overlays */}
      <AddProductDrawer 
        isOpen={isAddDrawerOpen} 
        onClose={handleCloseDrawer}
        initialData={editingProduct}
      />
      <BulkImportModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
      />
      <OCRImportDrawer 
        isOpen={isOCRDrawerOpen} 
        onClose={() => setIsOCRDrawerOpen(false)} 
      />
    </PageContainer>
  );
}

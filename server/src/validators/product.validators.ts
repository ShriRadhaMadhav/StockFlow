import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z.string().trim().min(1, 'SKU is required'),
  barcode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  purchasePrice: z.coerce.number().min(0, 'Purchase price must be >= 0').default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be >= 0').default(0),
  quantity: z.coerce.number().int().min(0, 'Quantity must be >= 0').default(0),
  minStockLevel: z.coerce.number().int().min(0).default(5),
  gstPercent: z.coerce.number().min(0).max(100).default(0),
  categoryId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

import { z } from 'zod';

export const updateStockSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  note: z.string().trim().optional(),
});

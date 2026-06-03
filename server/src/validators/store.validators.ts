import { z } from 'zod';

export const createStoreSchema = z.object({
  storeName: z.string().trim().min(2, 'Store name must be at least 2 characters'),
  businessType: z.string().trim().min(2, 'Business type is required'),
  gstNumber: z
    .string()
    .trim()
    .transform((value) => (value.length ? value.toUpperCase() : undefined))
    .optional(),
});

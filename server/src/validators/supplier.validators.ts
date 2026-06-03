import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required'),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().trim().optional(),
});

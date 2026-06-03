import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import mongoose from 'mongoose';

export const validate = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const issues = zodError.issues || (zodError as any).errors || [];
        const errors = issues.map((e: any) => ({
          path: e.path ? e.path.join('.') : '',
          message: e.message || 'Validation error',
        }));
        return sendError(res, 400, 'Validation failed', errors);
      }
      return next(error);
    }
  };
};

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

// Products
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    sku: z.string().min(2, 'SKU is required'),
    category: z.string().min(1, 'Category is required'),
    unit: z.string().default('pcs'),
    sellingPrice: z.number().positive('Selling price must be positive'),
    lowStockThreshold: z.number().nonnegative().default(10),
  }),
});

// Inventory Batches
export const createInventoryBatchSchema = z.object({
  body: z.object({
    productId: objectIdValidator,
    vendorId: objectIdValidator.optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    purchasePrice: z.number().positive('Purchase price must be positive'),
    invoiceNumber: z.string().optional(),
  }),
});

// Customers
export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
  }),
});

// Invoices
export const createInvoiceSchema = z.object({
  body: z.object({
    customerId: objectIdValidator,
    items: z.array(
      z.object({
        productId: objectIdValidator,
        quantity: z.number().int().positive('Quantity must be greater than zero'),
        sellingPrice: z.number().nonnegative('Selling price cannot be negative'),
      })
    ).min(1, 'At least one item is required'),
    taxPercentage: z.number().nonnegative().default(0),
    discountAmount: z.number().nonnegative().default(0),
    paymentTerms: z.string().optional(),
    dueDate: z.string().datetime(),
    notes: z.string().optional(),
    workflowState: z.enum(['draft', 'finalized']).default('draft'),
  }),
});

// Payments
export const createPaymentSchema = z.object({
  body: z.object({
    invoiceId: objectIdValidator,
    customerId: objectIdValidator,
    amount: z.number().positive('Payment amount must be greater than zero'),
    paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'cheque']),
    referenceNumber: z.string().optional(),
    paymentDate: z.string().optional(),
  }),
});

export * from './auth.validators';

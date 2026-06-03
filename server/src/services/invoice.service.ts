import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice';
import { deductStockFIFO } from './inventory.service';
import { updateOutstandingBalance } from './customer.service';
import { generateInvoiceNumber } from './counter.service';

interface CreateInvoiceData {
  businessId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; sellingPrice: number; subtotal: number }>;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentTerms?: string;
  dueDate: string;
  notes?: string;
  workflowState: 'draft' | 'finalized';
  createdBy: string;
}

export const createInvoiceTransactional = async (data: CreateInvoiceData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const businessIdObj = new mongoose.Types.ObjectId(data.businessId);
    const customerIdObj = new mongoose.Types.ObjectId(data.customerId);
    const userIdObj = new mongoose.Types.ObjectId(data.createdBy);

    // 1. Generate Invoice Number safely
    const invoiceNumber = await generateInvoiceNumber(businessIdObj, session);

    // 2. Create Invoice Document
    const invoice = new Invoice({
      ...data,
      businessId: businessIdObj,
      customerId: customerIdObj,
      createdBy: userIdObj,
      invoiceNumber,
    });

    await invoice.save({ session });

    // 3. If Finalized, deduct stock and update balances
    if (data.workflowState === 'finalized') {
      // Deduct stock for each item
      for (const item of data.items) {
        await deductStockFIFO(
          businessIdObj,
          new mongoose.Types.ObjectId(item.productId),
          item.quantity,
          invoice._id as mongoose.Types.ObjectId,
          userIdObj,
          session
        );
      }

      // Update customer outstanding balance
      await updateOutstandingBalance(customerIdObj, data.total, session);
    }

    // 4. Commit all changes
    await session.commitTransaction();
    return invoice;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

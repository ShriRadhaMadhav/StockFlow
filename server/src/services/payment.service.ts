import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { Invoice } from '../models/Invoice';
import { updateOutstandingBalance } from './customer.service';

interface RecordPaymentData {
  businessId: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  paymentDate?: string;
  recordedBy: string;
}

export const recordPaymentTransactional = async (data: RecordPaymentData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const businessIdObj = new mongoose.Types.ObjectId(data.businessId);
    const invoiceIdObj = new mongoose.Types.ObjectId(data.invoiceId);
    const customerIdObj = new mongoose.Types.ObjectId(data.customerId);
    const userIdObj = new mongoose.Types.ObjectId(data.recordedBy);

    // 1. Verify Invoice exists, belongs to business, and is finalized
    const invoice = await Invoice.findOne({
      _id: invoiceIdObj,
      businessId: businessIdObj,
    }).session(session);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.workflowState !== 'finalized') {
      throw new Error('Cannot record payments on draft or cancelled invoices');
    }

    // 2. Fetch existing payments to prevent overpayment
    const existingPayments = await Payment.find({ invoiceId: invoiceIdObj }).session(session);
    const totalPaidBefore = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBefore = Number((invoice.total - totalPaidBefore).toFixed(2));

    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (data.amount > remainingBefore) {
      throw new Error(`Payment of $${data.amount} exceeds the remaining invoice balance of $${remainingBefore}`);
    }

    // 3. Create the Payment document
    const payment = new Payment({
      businessId: businessIdObj,
      invoiceId: invoiceIdObj,
      customerId: customerIdObj,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      recordedBy: userIdObj,
    });

    await payment.save({ session });

    // 4. Update Invoice payment status
    const totalPaidAfter = totalPaidBefore + data.amount;
    const isFullyPaid = Math.abs(invoice.total - totalPaidAfter) < 0.01 || totalPaidAfter >= invoice.total;
    
    invoice.paymentStatus = isFullyPaid ? 'paid' : 'partial';
    await invoice.save({ session });

    // 5. Update Customer Outstanding Balance (negative updates reduce debt)
    await updateOutstandingBalance(customerIdObj, -data.amount, session);

    await session.commitTransaction();
    return payment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getPaymentsList = async (
  businessId: string,
  params: { page?: number; limit?: number; customerId?: string; paymentMethod?: string }
) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const filter: any = { businessId: new mongoose.Types.ObjectId(businessId) };
  if (params.customerId) {
    filter.customerId = new mongoose.Types.ObjectId(params.customerId);
  }
  if (params.paymentMethod) {
    filter.paymentMethod = params.paymentMethod;
  }

  const payments = await Payment.find(filter)
    .populate('customerId', 'name email')
    .populate('invoiceId', 'invoiceNumber total')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments(filter);

  return {
    payments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

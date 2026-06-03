import mongoose from 'mongoose';
import { Counter } from '../models/Counter';

export const generateInvoiceNumber = async (
  businessId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
): Promise<string> => {
  const counterId = `INV-${new Date().getFullYear()}`;

  let attempts = 0;
  while (attempts < 50) {
    const counter = await Counter.findOneAndUpdate(
      { businessId, id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );

    const sequence = counter.seq.toString().padStart(4, '0');
    const invoiceNumber = `${counterId}-${sequence}`;

    // Dynamically check if this invoice number already exists to avoid E11000 duplicate keys
    const exists = await mongoose.model('Invoice').findOne({ invoiceNumber }).session(session || null);
    if (!exists) {
      return invoiceNumber;
    }
    attempts++;
  }

  throw new Error('Failed to generate a unique invoice number: Max retry limit reached.');
};

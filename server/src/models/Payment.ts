import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  businessId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'cheque'], required: true },
  referenceNumber: { type: String },
  paymentDate: { type: Date, default: Date.now },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

paymentSchema.index({ businessId: 1, invoiceId: 1 });
paymentSchema.index({ businessId: 1, customerId: 1 });
paymentSchema.index({ businessId: 1, paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

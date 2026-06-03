import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorPayment extends Document {
  businessId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vendorPaymentSchema = new Schema<IVendorPayment>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'cheque'], required: true },
  referenceNumber: { type: String },
  paymentDate: { type: Date, default: Date.now },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const VendorPayment = mongoose.model<IVendorPayment>('VendorPayment', vendorPaymentSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  outstandingBalance: number;
  isArchived: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  outstandingBalance: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

vendorSchema.index({ businessId: 1, isArchived: 1, name: 1 });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);

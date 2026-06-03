import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryBatch extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  initialQuantity: number;
  quantity: number; // Current remaining quantity
  purchasePrice: number;
  invoiceNumber?: string;
  addedDate: Date;
  isArchived: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryBatchSchema = new Schema<IInventoryBatch>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  initialQuantity: { type: Number, required: true },
  quantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  invoiceNumber: { type: String },
  addedDate: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

inventoryBatchSchema.index({ businessId: 1, productId: 1, quantity: 1 });

export const InventoryBatch = mongoose.model<IInventoryBatch>('InventoryBatch', inventoryBatchSchema);

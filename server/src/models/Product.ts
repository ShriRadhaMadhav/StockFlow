import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: number;
  lowStockThreshold: number;
  // Caches for quick lookup; source of truth is batches & workflows
  totalStock: number;
  reservedStock: number; 
  isArchived: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true, default: 'pcs' },
  sellingPrice: { type: Number, required: true },
  lowStockThreshold: { type: Number, default: 10 },
  totalStock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

productSchema.index({ businessId: 1, sku: 1 }, { unique: true });
productSchema.index({ businessId: 1, isArchived: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);

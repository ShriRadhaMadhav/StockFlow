import mongoose, { Document, Schema } from 'mongoose';

export interface IStockMovement extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId; // Optional: Some movements might not attach to a specific batch
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'correction';
  quantity: number; // Positive for incoming, negative for outgoing
  source: string; // e.g., 'Invoice API', 'Manual Adjustment'
  referenceId?: mongoose.Types.ObjectId; // Links to InvoiceId or PurchaseId
  createdBy: mongoose.Types.ObjectId;
  timestamp: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'InventoryBatch' },
  type: { type: String, enum: ['purchase', 'sale', 'adjustment', 'return', 'correction'], required: true },
  quantity: { type: Number, required: true },
  source: { type: String, required: true },
  referenceId: { type: Schema.Types.ObjectId },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

stockMovementSchema.index({ businessId: 1, productId: 1, timestamp: -1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);

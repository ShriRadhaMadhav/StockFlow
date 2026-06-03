import mongoose from 'mongoose';
import { InventoryBatch } from '../models/InventoryBatch';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';

export const logStockMovement = async (
  businessId: mongoose.Types.ObjectId,
  productId: mongoose.Types.ObjectId,
  quantity: number,
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'correction',
  source: string,
  createdBy: mongoose.Types.ObjectId,
  referenceId?: mongoose.Types.ObjectId,
  batchId?: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
) => {
  const movement = new StockMovement({
    businessId,
    productId,
    batchId,
    type,
    quantity,
    source,
    referenceId,
    createdBy,
  });

  await movement.save({ session });
};

export const deductStockFIFO = async (
  businessId: mongoose.Types.ObjectId,
  productId: mongoose.Types.ObjectId,
  requiredQuantity: number,
  invoiceId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  session: mongoose.ClientSession
) => {
  if (requiredQuantity <= 0) return;

  const product = await Product.findOne({ _id: productId, businessId, isArchived: { $ne: true } }).session(session);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Find all available batches sorted by oldest first
  const batches = await InventoryBatch.find({
    businessId,
    productId,
    quantity: { $gt: 0 },
    isArchived: { $ne: true },
  })
    .sort({ addedDate: 1 })
    .session(session);

  let remainingToDeduct = requiredQuantity;

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;

    const deductAmount = Math.min(batch.quantity, remainingToDeduct);
    
    // Deduct from this batch
    batch.quantity -= deductAmount;
    await batch.save({ session });

    // Log the exact batch movement
    await logStockMovement(
      businessId,
      productId,
      -deductAmount, // negative for sale
      'sale',
      'Invoice Generation',
      userId,
      invoiceId,
      batch._id as mongoose.Types.ObjectId,
      session
    );

    remainingToDeduct -= deductAmount;
  }

  if (remainingToDeduct > 0) {
    throw new Error(`Insufficient stock for product ${product.name} (${product.sku}). Short by ${remainingToDeduct} units.`);
  }

  // Update product cache
  product.totalStock -= requiredQuantity;
  await product.save({ session });
};

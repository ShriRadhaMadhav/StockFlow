import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { InventoryBatch } from '../models/InventoryBatch';
import { Product } from '../models/Product';
import { Vendor } from '../models/Vendor';
import { logStockMovement } from '../services/inventory.service';
import { sendSuccess, sendError } from '../utils/response';

export const createBatch = async (req: Request, res: Response) => {
  const { productId, vendorId, quantity, purchasePrice, invoiceNumber } = req.body;
  const businessId = req.user?.businessId;
  const userId = req.user?.userId;
  if (!businessId || !userId) {
    return sendError(res, 401, 'Not authenticated or store not selected');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findOne({ _id: productId, businessId, isArchived: { $ne: true } }).session(session);
    if (!product) {
      throw new Error('Product not found or archived');
    }

    const batch = new InventoryBatch({
      businessId,
      productId,
      vendorId,
      initialQuantity: quantity,
      quantity,
      purchasePrice,
      invoiceNumber,
    });

    await batch.save({ session });

    // Update Product Total Stock Cache
    product.totalStock += quantity;
    await product.save({ session });

    // Update Vendor outstanding balance if vendorId is specified
    if (vendorId) {
      const vendor = await Vendor.findOne({ _id: vendorId, businessId }).session(session);
      if (vendor) {
        vendor.outstandingBalance += (quantity * purchasePrice);
        await vendor.save({ session });
      }
    }

    // Log the movement
    await logStockMovement(
      new mongoose.Types.ObjectId(businessId),
      new mongoose.Types.ObjectId(productId),
      quantity,
      'purchase',
      'Inventory Batch Received',
      new mongoose.Types.ObjectId(userId),
      batch._id as mongoose.Types.ObjectId,
      batch._id as mongoose.Types.ObjectId,
      session
    );

    await session.commitTransaction();
    return sendSuccess(res, 201, 'Inventory batch created successfully', batch);
  } catch (error: any) {
    await session.abortTransaction();
    return sendError(res, 400, error.message);
  } finally {
    session.endSession();
  }
};

export const getAllBatches = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return sendError(res, 401, 'No active store selected');
    }
    const { startDate, endDate, productId, vendorId, minCost, maxCost } = req.query;

    const query: any = { businessId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (productId) {
      query.productId = productId;
    }

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (minCost || maxCost) {
      query.purchasePrice = {};
      if (minCost) {
        query.purchasePrice.$gte = parseFloat(minCost as string);
      }
      if (maxCost) {
        query.purchasePrice.$lte = parseFloat(maxCost as string);
      }
    }

    // Populate Product and Vendor names to display in the Purchases table
    const batches = await InventoryBatch.find(query)
      .sort({ createdAt: -1 })
      .populate('productId', 'name sku unit')
      .populate('vendorId', 'name email')
      .lean();

    return sendSuccess(res, 200, 'Purchases retrieved successfully', batches);
  } catch (error: any) {
    return sendError(res, 500, 'Internal server error');
  }
};

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Vendor } from '../models/Vendor';
import { InventoryBatch } from '../models/InventoryBatch';
import { VendorPayment } from '../models/VendorPayment';
import { sendSuccess, sendError } from '../utils/response';

export const createVendor = async (req: Request, res: Response) => {
  const { name, email, phone, address, gstNumber } = req.body;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const vendor = new Vendor({
    businessId,
    name,
    email,
    phone,
    address,
    gstNumber,
    outstandingBalance: 0,
  });

  await vendor.save();
  return sendSuccess(res, 201, 'Vendor created successfully', vendor);
};

export const getVendors = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const skip = (page - 1) * limit;
  const searchCondition: any = { businessId, isArchived: { $ne: true } };

  if (search) {
    searchCondition.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const vendors = await Vendor.find(searchCondition)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Vendor.countDocuments(searchCondition);

  return sendSuccess(res, 200, 'Vendors retrieved successfully', {
    vendors,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
};

export const getVendorById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const vendor = await Vendor.findOne({ _id: id, businessId, isArchived: { $ne: true } });
  if (!vendor) {
    return sendError(res, 404, 'Vendor not found');
  }

  // Calculate live statistics
  // 1. Total purchases (sum of quantity * purchasePrice for this vendor)
  const batches = await InventoryBatch.find({ vendorId: id, businessId });
  const totalPurchased = batches.reduce((sum, batch) => sum + (batch.initialQuantity * batch.purchasePrice), 0);

  // 2. Total payments made (sum of payments)
  const payments = await VendorPayment.find({ vendorId: id, businessId });
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);

  return sendSuccess(res, 200, 'Vendor retrieved successfully', {
    vendor,
    stats: {
      totalPurchased,
      totalPaid,
      outstandingBalance: vendor.outstandingBalance,
      batchesCount: batches.length,
      paymentsCount: payments.length,
    }
  });
};

export const getVendorLedger = async (req: Request, res: Response) => {
  const { id } = req.params;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const vendor = await Vendor.findOne({ _id: id, businessId, isArchived: { $ne: true } });
  if (!vendor) {
    return sendError(res, 404, 'Vendor not found');
  }

  // Fetch purchases (InventoryBatches)
  const batches = await InventoryBatch.find({ vendorId: id, businessId }).populate('productId', 'name sku');
  // Fetch payments (VendorPayments)
  const payments = await VendorPayment.find({ vendorId: id, businessId });

  // Map into ledger records
  const ledgerItems: any[] = [];

  batches.forEach((batch: any) => {
    const prodName = batch.productId?.name || 'Unknown Product';
    ledgerItems.push({
      _id: batch._id,
      type: 'purchase',
      amount: batch.initialQuantity * batch.purchasePrice,
      date: batch.addedDate || batch.createdAt,
      description: `Stock batch added: ${batch.initialQuantity} units of ${prodName}`,
      reference: batch.invoiceNumber || 'No invoice number',
    });
  });

  payments.forEach((payment) => {
    ledgerItems.push({
      _id: payment._id,
      type: 'payment',
      amount: payment.amount,
      date: payment.paymentDate || payment.createdAt,
      description: `Payment made via ${payment.paymentMethod.replace('_', ' ').toUpperCase()}`,
      reference: payment.referenceNumber || 'No ref number',
    });
  });

  // Sort chronologically from OLDEST to NEWEST to calculate running balance
  ledgerItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const ledgerWithBalances = ledgerItems.map((item) => {
    if (item.type === 'purchase') {
      runningBalance += item.amount;
    } else if (item.type === 'payment') {
      runningBalance -= item.amount;
    }
    return {
      ...item,
      runningBalance,
    };
  });

  // Reverse it to show NEWEST first on the frontend ledger view
  ledgerWithBalances.reverse();

  return sendSuccess(res, 200, 'Vendor ledger retrieved successfully', ledgerWithBalances);
};

export const recordVendorPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, paymentMethod, referenceNumber, paymentDate } = req.body;
  const businessId = req.user?.businessId;
  const userId = req.user?.userId;

  if (!businessId || !userId) {
    return sendError(res, 401, 'Not authenticated or store not selected');
  }

  if (!amount || amount <= 0) {
    return sendError(res, 400, 'Payment amount must be greater than zero');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vendor = await Vendor.findOne({ _id: id, businessId, isArchived: { $ne: true } }).session(session);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Create payment
    const payment = new VendorPayment({
      businessId,
      vendorId: id,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      recordedBy: userId,
    });

    await payment.save({ session });

    // Deduct vendor's outstanding balance
    vendor.outstandingBalance -= amount;
    await vendor.save({ session });

    await session.commitTransaction();
    return sendSuccess(res, 201, 'Vendor payment recorded successfully', payment);
  } catch (error: any) {
    await session.abortTransaction();
    return sendError(res, 400, error.message);
  } finally {
    session.endSession();
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const vendor = await Vendor.findOneAndUpdate(
    { _id: id, businessId, isArchived: { $ne: true } },
    { $set: { isArchived: true, deletedAt: new Date() } },
    { new: true }
  );

  if (!vendor) {
    return sendError(res, 404, 'Vendor not found');
  }

  return sendSuccess(res, 200, 'Vendor deleted successfully', null);
};

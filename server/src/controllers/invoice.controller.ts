import { Request, Response } from 'express';
import { createInvoiceTransactional } from '../services/invoice.service';
import { Invoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { sendSuccess, sendError } from '../utils/response';

export const createInvoice = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  const userId = req.user?.userId;
  if (!businessId || !userId) {
    return sendError(res, 401, 'Not authenticated or store not selected');
  }

  try {
    const data = {
      ...req.body,
      businessId,
      createdBy: userId,
    };

    // Note: createInvoiceTransactional handles the mongoose session transaction internally
    const invoice = await createInvoiceTransactional(data);

    return sendSuccess(res, 201, 'Invoice created successfully', invoice);
  } catch (error: any) {
    // If it's an insufficient stock error, it will bubble up here and the transaction is already aborted
    return sendError(res, 400, error.message);
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const query: any = { businessId, isArchived: { $ne: true } };

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search as string, $options: 'i' };
    
    // Find matching customers first
    const matchingCustomers = await Customer.find({ 
      businessId, 
      name: searchRegex 
    }).select('_id');
    
    const customerIds = matchingCustomers.map(c => c._id);
    
    query.$or = [
      { invoiceNumber: searchRegex },
      { customerId: { $in: customerIds } }
    ];
  }
  if (req.query.status && req.query.status !== 'all') query.paymentStatus = req.query.status;
  if (req.query.workflowState) query.workflowState = req.query.workflowState;
  if (req.query.customerId) query.customerId = req.query.customerId;

  const invoices = await Invoice.find(query)
    .populate('customerId', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Invoice.countDocuments(query);

  return sendSuccess(res, 200, 'Invoices retrieved successfully', {
    invoices,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }
  const { id } = req.params;

  const invoice = await Invoice.findOne({ _id: id, businessId, isArchived: { $ne: true } })
    .populate('customerId', 'name email phone address')
    .populate('items.productId', 'name sku unit');

  if (!invoice) {
    return sendError(res, 404, 'Invoice not found');
  }

  return sendSuccess(res, 200, 'Invoice retrieved successfully', invoice);
};

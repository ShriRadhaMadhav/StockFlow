import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { searchCustomers } from '../services/customer.service';
import { sendSuccess, sendError } from '../utils/response';

export const createCustomer = async (req: Request, res: Response) => {
  const { name, email, phone, address, gstNumber } = req.body;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const customer = new Customer({
    businessId,
    name,
    email,
    phone,
    address,
    gstNumber,
  });

  await customer.save();
  return sendSuccess(res, 201, 'Customer created successfully', customer);
};

export const getCustomers = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const result = await searchCustomers(businessId, search, page, limit);
  
  return sendSuccess(res, 200, 'Customers retrieved successfully', result);
};

export const getCustomerById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const customer = await Customer.findOne({ _id: id, businessId, isArchived: { $ne: true } });
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  // Calculate live statistics
  // 1. Total invoiced (sum of total for finalized invoices)
  const invoices = await Invoice.find({ customerId: id, businessId, workflowState: 'finalized' });
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // 2. Total paid (sum of payment amounts)
  const payments = await Payment.find({ customerId: id, businessId });
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);

  return sendSuccess(res, 200, 'Customer retrieved successfully', {
    customer,
    stats: {
      totalInvoiced,
      totalPaid,
      outstandingBalance: customer.outstandingBalance,
      invoicesCount: invoices.length,
      paymentsCount: payments.length,
    }
  });
};

export const getCustomerLedger = async (req: Request, res: Response) => {
  const { id } = req.params;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const customer = await Customer.findOne({ _id: id, businessId, isArchived: { $ne: true } });
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  // Fetch finalized invoices
  const invoices = await Invoice.find({ customerId: id, businessId, workflowState: 'finalized' });
  // Fetch payments
  const payments = await Payment.find({ customerId: id, businessId });

  // Map into ledger records
  const ledgerItems: any[] = [];

  invoices.forEach((inv) => {
    ledgerItems.push({
      _id: inv._id,
      type: 'invoice',
      amount: inv.total,
      date: inv.createdAt,
      description: `Sales invoice generated: #${inv.invoiceNumber}`,
      reference: inv.invoiceNumber,
    });
  });

  payments.forEach((pay) => {
    ledgerItems.push({
      _id: pay._id,
      type: 'payment',
      amount: pay.amount,
      date: pay.paymentDate || pay.createdAt,
      description: `Payment received via ${pay.paymentMethod.toUpperCase()}`,
      reference: pay.referenceNumber || 'No ref number',
    });
  });

  // Sort chronologically from OLDEST to NEWEST to calculate running balance
  ledgerItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const ledgerWithBalances = ledgerItems.map((item) => {
    if (item.type === 'invoice') {
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

  return sendSuccess(res, 200, 'Customer ledger retrieved successfully', ledgerWithBalances);
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: id, businessId, isArchived: { $ne: true } },
    { $set: { isArchived: true, deletedAt: new Date() } },
    { new: true }
  );

  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  return sendSuccess(res, 200, 'Customer deleted successfully', null);
};

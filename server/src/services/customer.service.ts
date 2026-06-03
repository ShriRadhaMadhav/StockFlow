import mongoose from 'mongoose';
import { Customer } from '../models/Customer';

export const updateOutstandingBalance = async (
  customerId: mongoose.Types.ObjectId,
  amountChange: number, // Positive adds debt, negative reduces debt
  session?: mongoose.ClientSession
) => {
  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { $inc: { outstandingBalance: amountChange } },
    { new: true, session }
  );

  if (!customer) {
    throw new Error('Customer not found for balance update');
  }

  return customer;
};

export const searchCustomers = async (businessId: string, query: string = '', page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const searchCondition: any = query
    ? {
        businessId,
        isArchived: { $ne: true },
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      }
    : { businessId, isArchived: { $ne: true } };

  const customers = await Customer.find(searchCondition)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Customer.countDocuments(searchCondition);

  return { customers, total, page, totalPages: Math.ceil(total / limit) };
};

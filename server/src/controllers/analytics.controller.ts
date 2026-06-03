import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { Vendor } from '../models/Vendor';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';

export const getSalesTrends = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return sendError(res, 401, 'No active store selected');
    }

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Invoice.aggregate([
      { 
        $match: { 
          businessId: new mongoose.Types.ObjectId(businessId), 
          workflowState: 'finalized',
          isArchived: { $ne: true },
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$total' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days with 0 revenue — no mock data
    const data: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = trends.find((t: any) => t._id === dateStr);
      data.push({
        date: dateStr,
        revenue: found ? found.revenue : 0,
        orders: found ? found.invoiceCount : 0
      });
    }

    return sendSuccess(res, 200, 'Sales trends retrieved', data);
  } catch (error: any) {
    console.error('Error fetching sales trends:', error);
    return sendError(res, 500, 'Internal server error');
  }
};

export const getInventoryTurnover = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return sendError(res, 401, 'No active store selected');
    }

    // For turnover, we compare total sales over the last 30 days to current stock
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesVolume = await StockMovement.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          type: 'sale',
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalSold: { $sum: { $abs: '$quantity' } }
        }
      }
    ]);

    const salesMap = new Map(salesVolume.map(s => [s._id.toString(), s.totalSold]));

    const products = await Product.find({ businessId: new mongoose.Types.ObjectId(businessId), isArchived: { $ne: true } })
      .select('name sku totalStock unit')
      .lean();

    // Real data only — no mock fallback
    const data = products.map(p => {
      const sold = salesMap.get(p._id.toString()) || 0;
      const currentStock = p.totalStock || 0;
      const turnoverRatio = currentStock > 0 ? parseFloat((sold / currentStock).toFixed(2)) : 0;
      
      return {
        id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        currentStock,
        soldLast30Days: sold,
        turnoverRatio
      };
    }).sort((a, b) => b.turnoverRatio - a.turnoverRatio).slice(0, 10);

    return sendSuccess(res, 200, 'Inventory turnover retrieved', data);
  } catch (error: any) {
    console.error('Error fetching inventory turnover:', error);
    return sendError(res, 500, 'Internal server error');
  }
};

export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return sendError(res, 401, 'No active store selected');
    }
    const now = new Date();

    // Accounts Receivable (Unpaid Invoices)
    const unpaidInvoices = await Invoice.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      workflowState: 'finalized',
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] },
      isArchived: { $ne: true }
    }).select('total discountAmount taxAmount dueDate').lean();

    let ar0_30 = 0;
    let ar31_60 = 0;
    let ar60Plus = 0;
    let totalAR = 0;

    unpaidInvoices.forEach(inv => {
      const outstanding = inv.total;
      totalAR += outstanding;

      const diffTime = Math.abs(now.getTime() - new Date(inv.dueDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (now <= new Date(inv.dueDate)) {
        ar0_30 += outstanding;
      } else {
        if (diffDays <= 30) ar0_30 += outstanding;
        else if (diffDays <= 60) ar31_60 += outstanding;
        else ar60Plus += outstanding;
      }
    });

    // Accounts Payable (from Vendors outstandingBalance)
    const vendors = await Vendor.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
      { $group: { _id: null, totalAP: { $sum: '$outstandingBalance' } } }
    ]);
    const totalAP = vendors.length > 0 ? vendors[0].totalAP : 0;

    // Real data only — no mock fallback
    const data = {
      ar: {
        '0-30 Days': ar0_30,
        '31-60 Days': ar31_60,
        '60+ Days': ar60Plus,
        total: totalAR
      },
      ap: {
        total: totalAP
      },
      netCashPosition: totalAR - totalAP
    };

    return sendSuccess(res, 200, 'Cash flow retrieved', data);
  } catch (error: any) {
    console.error('Error fetching cash flow:', error);
    return sendError(res, 500, 'Internal server error');
  }
};

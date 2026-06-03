import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { Vendor } from '../models/Vendor';
import { Product } from '../models/Product';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return sendError(res, 401, 'No active store selected');
    }
    const period = (req.query.period as string) || '7d'; // '7d', '30d', '90d'

    // Determine date ranges
    let daysCount = 7;
    if (period === '30d') daysCount = 30;
    else if (period === '90d') daysCount = 90;

    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - daysCount);
    periodStart.setHours(0, 0, 0, 0);

    const prevPeriodStart = new Date();
    prevPeriodStart.setDate(periodStart.getDate() - daysCount);
    prevPeriodStart.setHours(0, 0, 0, 0);

    const businessOid = new mongoose.Types.ObjectId(businessId);

    // 1. Total Revenue (from finalized invoices)
    const revenueResult = await Invoice.aggregate([
      { $match: { businessId: businessOid, workflowState: 'finalized', isArchived: { $ne: true } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Revenue in current period
    const currentPeriodRevenue = await Invoice.aggregate([
      { $match: { businessId: businessOid, workflowState: 'finalized', isArchived: { $ne: true }, createdAt: { $gte: periodStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const currentRev = currentPeriodRevenue.length > 0 ? currentPeriodRevenue[0].total : 0;

    // Revenue in previous period
    const prevPeriodRevenue = await Invoice.aggregate([
      { $match: { businessId: businessOid, workflowState: 'finalized', isArchived: { $ne: true }, createdAt: { $gte: prevPeriodStart, $lt: periodStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const prevRev = prevPeriodRevenue.length > 0 ? prevPeriodRevenue[0].total : 0;

    // Calculate real percentage change
    const revenueChange = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : (currentRev > 0 ? 100 : 0);

    // 2. Accounts Receivable (from Customers)
    const arResult = await Customer.aggregate([
      { $match: { businessId: businessOid } },
      { $group: { _id: null, totalAR: { $sum: '$outstandingBalance' } } }
    ]);
    const accountsReceivable = arResult.length > 0 ? arResult[0].totalAR : 0;

    // 3. Accounts Payable (from Vendors)
    const apResult = await Vendor.aggregate([
      { $match: { businessId: businessOid } },
      { $group: { _id: null, totalAP: { $sum: '$outstandingBalance' } } }
    ]);
    const accountsPayable = apResult.length > 0 ? apResult[0].totalAP : 0;

    // 4. Revenue Trend (daily breakdown for the selected period)
    const revenueTrend = await Invoice.aggregate([
      {
        $match: {
          businessId: businessOid,
          workflowState: 'finalized',
          isArchived: { $ne: true },
          createdAt: { $gte: periodStart }
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

    // Fill in missing days with zero revenue
    const trendData: { date: string; revenue: number; invoiceCount: number }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = revenueTrend.find((t: any) => t._id === dateStr);
      trendData.push({
        date: dateStr,
        revenue: found ? found.revenue : 0,
        invoiceCount: found ? found.invoiceCount : 0
      });
    }

    // 5. Recent Activity (Latest 5 invoices)
    const recentActivity = await Invoice.find({ businessId, isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name')
      .lean();

    // 6. Low Stock Items
    const lowStockItems = await Product.find({
      businessId,
      isArchived: { $ne: true },
      $expr: { $lte: ['$totalStock', '$lowStockThreshold'] }
    })
    .sort({ totalStock: 1 })
    .limit(5)
    .lean();

    // 7. Quick counts
    const totalProducts = await Product.countDocuments({ businessId, isArchived: { $ne: true } });
    const totalInvoices = await Invoice.countDocuments({ businessId, isArchived: { $ne: true } });
    const totalCustomers = await Customer.countDocuments({ businessId });

    return sendSuccess(res, 200, 'Dashboard stats retrieved', {
      totalRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      accountsReceivable,
      accountsPayable,
      revenueTrend: trendData,
      recentActivity,
      lowStockItems,
      totalProducts,
      totalInvoices,
      totalCustomers,
      period
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return sendError(res, 500, 'Internal server error');
  }
};

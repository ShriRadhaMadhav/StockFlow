import { Request, Response } from 'express';
import { StockMovement } from '../models/StockMovement';
import '../models/User'; // Side-effect import to register schema
import { sendSuccess, sendError } from '../utils/response';

export const getMovements = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return sendError(res, 401, 'No active store selected');
    }
    const { startDate, endDate, productId, type, source } = req.query;

    const query: any = { businessId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    if (productId) {
      query.productId = productId;
    }

    if (type) {
      query.type = type;
    }

    if (source) {
      query.source = { $regex: source as string, $options: 'i' };
    }

    // Simple implementation without pagination for now to get it working fast
    const movements = await StockMovement.find(query)
      .sort({ timestamp: -1 })
      .populate('productId', 'name sku unit')
      .populate('createdBy', 'name email')
      .lean();

    return sendSuccess(res, 200, 'Stock movements retrieved', movements);
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return sendError(res, 500, 'Internal server error');
  }
};

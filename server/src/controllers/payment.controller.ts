import { Request, Response } from 'express';
import { recordPaymentTransactional, getPaymentsList } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/response';

export const recordPayment = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  const userId = req.user?.userId;
  if (!businessId || !userId) {
    return sendError(res, 401, 'Not authenticated or store not selected');
  }

  try {
    const data = {
      ...req.body,
      businessId,
      recordedBy: userId,
    };

    const payment = await recordPaymentTransactional(data);

    return sendSuccess(res, 201, 'Payment recorded successfully', payment);
  } catch (error: any) {
    return sendError(res, 400, error.message);
  }
};

export const getPayments = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const customerId = req.query.customerId as string;
  const paymentMethod = req.query.paymentMethod as string;

  try {
    const result = await getPaymentsList(businessId, {
      page,
      limit,
      customerId,
      paymentMethod,
    });

    return sendSuccess(res, 200, 'Payments retrieved successfully', result);
  } catch (error: any) {
    return sendError(res, 400, error.message);
  }
};

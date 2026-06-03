import { Request, Response } from 'express';
import { Business } from '../models/Business';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

export const createBusiness = async (req: Request, res: Response) => {
  const { storeName, businessType, gstNumber } = req.body;

  try {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, 'Not authenticated');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const business = new Business({
      name: storeName,
      email: user.email,
      taxId: gstNumber || undefined,
    });

    await business.save();

    user.businessId = business._id as any;
    user.role = 'owner'; // Make the creator the owner
    await user.save();

    const storeResponse = {
      id: business._id.toString(),
      storeName: business.name,
      businessType: businessType || 'Retail & ERP',
      gstNumber: business.taxId || null,
      ownerId: user._id.toString(),
      createdAt: business.createdAt.toISOString(),
    };

    return sendSuccess(res, 201, 'Store created successfully', {
      message: 'Store created successfully',
      store: storeResponse,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal server error during store creation');
  }
};

export const getMyBusiness = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, 'Not authenticated');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    let store = null;
    const stores: any[] = [];

    if (user.businessId) {
      const business = await Business.findById(user.businessId);
      if (business) {
        const storeResponse = {
          id: business._id.toString(),
          storeName: business.name,
          businessType: 'Retail & ERP',
          gstNumber: business.taxId || null,
          ownerId: user._id.toString(),
          createdAt: business.createdAt.toISOString(),
        };
        store = storeResponse;
        stores.push(storeResponse);
      }
    }

    return sendSuccess(res, 200, 'Stores retrieved successfully', {
      store,
      stores,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal server error retrieving stores');
  }
};

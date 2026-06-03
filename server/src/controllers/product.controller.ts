import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { sendSuccess, sendError } from '../utils/response';

export const createProduct = async (req: Request, res: Response) => {
  const { name, sku, category, unit, sellingPrice, lowStockThreshold } = req.body;
  
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const existing = await Product.findOne({ businessId, sku });
  if (existing) {
    return sendError(res, 400, `Product with SKU ${sku} already exists`);
  }

  const product = new Product({
    businessId,
    name,
    sku,
    category,
    unit,
    sellingPrice,
    lowStockThreshold,
  });

  await product.save();
  return sendSuccess(res, 201, 'Product created successfully', product);
};

export const getProducts = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const category = req.query.category as string;
  const status = req.query.status as string;

  const query: any = { businessId, isArchived: { $ne: true } };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }
  
  if (category) {
    query.category = category;
  }

  if (status) {
    if (status === 'out_of_stock') {
      // In out_of_stock, we consider totalStock <= 0
      query.$expr = { $lte: ['$totalStock', 0] };
    } else if (status === 'in_stock') {
      // In stock is strictly greater than lowStockThreshold
      query.$expr = { $gt: ['$totalStock', '$lowStockThreshold'] };
    } else if (status === 'low_stock') {
      // Low stock is > 0 but <= lowStockThreshold
      query.$and = [
        { $expr: { $gt: ['$totalStock', 0] } },
        { $expr: { $lte: ['$totalStock', '$lowStockThreshold'] } }
      ];
    }
  }

  const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await Product.countDocuments(query);

  return sendSuccess(res, 200, 'Products retrieved successfully', {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, unit, sellingPrice, lowStockThreshold, totalStock } = req.body;
  const businessId = req.user?.businessId;
  if (!businessId) {
    return sendError(res, 401, 'No active store selected');
  }

  const product = await Product.findOneAndUpdate(
    { _id: id, businessId, isArchived: { $ne: true } },
    { $set: { name, category, unit, sellingPrice, lowStockThreshold, totalStock } },
    { new: true }
  );

  if (!product) {
    return sendError(res, 404, 'Product not found');
  }

  return sendSuccess(res, 200, 'Product updated successfully', product);
};

import { Router } from 'express';
import { createProduct, getProducts, updateProduct } from '../controllers/product.controller';
import { validate, createProductSchema } from '../validators';
import { asyncHandler } from '../middleware/asyncHandler';
import { protect } from '../middleware/auth';

const router = Router();

// In a real app, protect all routes. For testing, we might want to bypass it initially
router.post('/', validate(createProductSchema), asyncHandler(createProduct));
router.get('/', asyncHandler(getProducts));
router.put('/:id', asyncHandler(updateProduct));

export default router;

import { Router } from 'express';
import { createBatch, getAllBatches } from '../controllers/inventory.controller';
import { validate, createInventoryBatchSchema } from '../validators';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/batches', validate(createInventoryBatchSchema), asyncHandler(createBatch));
router.get('/batches', asyncHandler(getAllBatches));

export default router;

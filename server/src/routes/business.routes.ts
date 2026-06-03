import { Router } from 'express';
import { createBusiness, getMyBusiness } from '../controllers/business.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, asyncHandler(createBusiness));
router.get('/my-business', protect, asyncHandler(getMyBusiness));

export default router;

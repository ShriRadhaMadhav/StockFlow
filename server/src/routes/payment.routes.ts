import { Router } from 'express';
import { recordPayment, getPayments } from '../controllers/payment.controller';
import { validate, createPaymentSchema } from '../validators';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/', validate(createPaymentSchema), asyncHandler(recordPayment));
router.get('/', asyncHandler(getPayments));

export default router;

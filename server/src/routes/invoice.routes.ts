import { Router } from 'express';
import { createInvoice, getInvoices, getInvoiceById } from '../controllers/invoice.controller';
import { validate, createInvoiceSchema } from '../validators';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/', validate(createInvoiceSchema), asyncHandler(createInvoice));
router.get('/', asyncHandler(getInvoices));
router.get('/:id', asyncHandler(getInvoiceById));

export default router;

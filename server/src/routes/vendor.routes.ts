import { Router } from 'express';
import { createVendor, getVendors, getVendorById, getVendorLedger, recordVendorPayment, deleteVendor } from '../controllers/vendor.controller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/', asyncHandler(createVendor));
router.get('/', asyncHandler(getVendors));
router.get('/:id', asyncHandler(getVendorById));
router.get('/:id/ledger', asyncHandler(getVendorLedger));
router.post('/:id/payments', asyncHandler(recordVendorPayment));
router.delete('/:id', asyncHandler(deleteVendor));

export default router;

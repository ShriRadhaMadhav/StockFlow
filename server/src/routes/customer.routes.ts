import { Router } from 'express';
import { createCustomer, getCustomers, getCustomerById, getCustomerLedger, deleteCustomer } from '../controllers/customer.controller';
import { validate, createCustomerSchema } from '../validators';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/', validate(createCustomerSchema), asyncHandler(createCustomer));
router.get('/', asyncHandler(getCustomers));
router.get('/:id', asyncHandler(getCustomerById));
router.get('/:id/ledger', asyncHandler(getCustomerLedger));
router.delete('/:id', asyncHandler(deleteCustomer));

export default router;

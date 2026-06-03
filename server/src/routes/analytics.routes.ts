import { Router } from 'express';
import { getSalesTrends, getInventoryTurnover, getCashFlow } from '../controllers/analytics.controller';

const router = Router();

router.get('/sales-trends', getSalesTrends);
router.get('/inventory-turnover', getInventoryTurnover);
router.get('/cash-flow', getCashFlow);

export default router;

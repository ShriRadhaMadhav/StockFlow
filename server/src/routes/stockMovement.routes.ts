import { Router } from 'express';
import { getMovements } from '../controllers/stockMovement.controller';

const router = Router();

router.get('/', getMovements);

export default router;

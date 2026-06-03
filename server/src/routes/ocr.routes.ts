import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import { processBillImage } from '../controllers/ocr.controller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();
const upload = multer({ dest: os.tmpdir() });

// Ensure we have 'billImage' as the field name
router.post('/upload-bill', upload.single('billImage'), asyncHandler(processBillImage));

export default router;

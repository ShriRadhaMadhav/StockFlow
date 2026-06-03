import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth.controller';
import { validate, registerSchema, loginSchema } from '../validators';
import { asyncHandler } from '../middleware/asyncHandler';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/signup', validate(registerSchema), asyncHandler(signup));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));

export default router;

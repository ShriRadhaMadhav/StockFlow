import rateLimit from 'express-rate-limit';

const message = { success: false, message: 'Too many requests, please try again later.' };

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message,
});

// Stricter Rate Limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message,
});

// Specific Rate Limiter for OCR endpoint (expensive AI calls)
export const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message,
});

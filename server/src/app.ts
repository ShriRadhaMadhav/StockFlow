import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, ocrLimiter } from './middleware/rateLimiter';

const app: Application = express();

// Trust reverse proxy (e.g. Render, Heroku, Nginx) for rate-limiting
app.set('trust proxy', 1);

// Compression - before other middleware
app.use(compression());

// Global Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
}));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
app.use('/api', apiLimiter);

// Basic root route for cron jobs / uptime monitors
app.get('/', (req, res) => {
  res.status(200).send('StockFlow API is running.');
});

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running normally.' });
});

import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import customerRoutes from './routes/customer.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import vendorRoutes from './routes/vendor.routes';
import dashboardRoutes from './routes/dashboard.routes';
import stockMovementRoutes from './routes/stockMovement.routes';
import ocrRoutes from './routes/ocr.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import businessRoutes from './routes/business.routes';
import { protect } from './middleware/auth';

// Routes will be mounted here
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/products', protect, productRoutes);
app.use('/api/v1/inventory', protect, inventoryRoutes);
app.use('/api/v1/customers', protect, customerRoutes);
app.use('/api/v1/invoices', protect, invoiceRoutes);
app.use('/api/v1/payments', protect, paymentRoutes);
app.use('/api/v1/vendors', protect, vendorRoutes);
app.use('/api/v1/dashboard', protect, dashboardRoutes);
app.use('/api/v1/stock-movements', protect, stockMovementRoutes);
app.use('/api/v1/ocr', protect, ocrLimiter);
app.use('/api/v1/ocr', protect, ocrRoutes);
app.use('/api/v1/analytics', protect, analyticsRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

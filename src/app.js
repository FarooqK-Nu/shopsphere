import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import ApiError from './utils/ApiError.js';
import globalErrorHandler from './middleware/errorMiddleware.js';
import productRouter from './routes/productRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';
import authRouter from './routes/authRoutes.js';
import cartRouter from './routes/cartRoutes.js';
import wishlistRouter from './routes/wishlistRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import { handleStripeWebhook } from './controllers/paymentController.js';

const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Implement CORS with credential support (necessary for Better Auth cookies)
app.use(cors({
  origin: true, // In production, replace with specific domain
  credentials: true
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting to prevent brute force and DDoS attacks
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests from this IP, please try again in a minute!'
});
app.use('/api', limiter);

// Stripe webhook needs raw body parser (MUST be defined before express.json body parser)
app.post('/api/v1/payment/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Body parsers with payload limit configuration
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Express 5 query getter compatibility workaround for express-mongo-sanitize
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true
  });
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 2) ROUTES
// Base health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ShopSphere API is healthy and running'
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/payment', paymentRouter);
app.use('/api/v1/admin', adminRouter);

// Test error route to verify custom error handling
app.get('/api/v1/test-error', (req, res) => {
  throw new ApiError('This is a test operational error!', 400);
});

// Unhandled route fallback
app.all(/(.*)/, (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) GLOBAL ERROR MIDDLEWARE
app.use(globalErrorHandler);

export default app;

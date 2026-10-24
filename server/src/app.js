import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import { csrfGuard, CSRF_HEADER } from './middleware/csrf.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { shippingRules } from './utils/pricing.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', CSRF_HEADER],
  }),
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.use(apiLimiter, csrfGuard);

app.get('/', (req, res) => {
  res.json({ success: true, data: { name: 'FitStore API', status: 'ok', health: '/health' } });
});

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

/** Public store configuration (no secrets). */
app.get('/config', (req, res) => {
  res.json({ success: true, data: { ...shippingRules(), currency: 'INR', paymentMode: 'test' } });
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

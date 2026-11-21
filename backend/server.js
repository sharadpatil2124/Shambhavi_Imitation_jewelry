import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import Settings from './models/Settings.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { sanitizeInputs } from './middleware/sanitizeMiddleware.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

connectDB();

Settings.updateOne({}, { contactPhone: '+91 70838 74227' }).catch(err => {
  console.error('⚠️ Failed to pre-update default settings phone:', err.message);
});

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false
}));

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Production threshold: supports heavy shopping & multi-user catalog browsing
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150, // Production threshold: prevents brute force while accommodating shared NAT/cellular IPs
  message: {
    success: false,
    message: 'Too many login, registration, or contact attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/users/login', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/users/verify-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/users/resend-otp', authLimiter);
app.use('/api/auth/resend-otp', authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/users/reset-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/enquiries', authLimiter);

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', userRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryRoutes);

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✨ Shambhavi Imitation Jewelry Premium MERN API is running successfully...'
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Shambhavi Luxury Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT IN USE] Port ${PORT} is already occupied by another process.`);
    console.error(`👉 Close the process using port ${PORT} or run 'npx kill-port ${PORT}'.\n`);
  } else {
    console.error('❌ Server startup error:', err.message);
  }
  process.exit(1);
});

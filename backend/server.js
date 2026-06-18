import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// DB Connection
import connectDB from './config/db.js';

// Route Handlers
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

// Error Middlewares
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Input sanitization middleware
import { sanitizeInputs } from './middleware/sanitizeMiddleware.js';

// Load environmental variables
dotenv.config();

// Enforce JWT_SECRET configuration
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}


// Establish MongoDB Mongoose connection
connectDB();

// Ensure existing settings document is updated with the new WhatsApp number
Settings.updateOne({}, { contactPhone: '+91 70838 74227' }).catch(err => {
  console.error('⚠️ Failed to pre-update default settings phone:', err.message);
});

const app = express();

// 1. Security Headers Configuration (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: false // Allows cross-origin image loads in browser
}));

// 2. Cross-Origin Requests Support (CORS)
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://shambhavi-imitation-jewelry.vercel.app'
];
const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : [];
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Body Parsing Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);

// 4. Rate Limiting Protection (Prevent brute-force & scraping)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
app.use('/api/', apiLimiter);

// Stricter Rate Limiter for sensitive endpoints (auth & contact enquiries)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 25, // Limit each IP to 25 requests per windowMs
  message: {
    success: false,
    message: 'Too many login, registration, or contact attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Protect sensitive endpoints from brute-force & spamming
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

// 5. Statically Serve Local Temporary Uploads (For fallback local images access)
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. MERN REST Endpoints Routing Table
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

// Favicon ignore route to prevent log spamming 404 errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root Ping Test Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✨ Shambhavi Imitation Jewelry Premium MERN API is running successfully...'
  });
});

// 7. Error Handling Pipelines Interceptors
app.use(notFound);
app.use(errorHandler);

// Listen Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Shambhavi Luxury Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

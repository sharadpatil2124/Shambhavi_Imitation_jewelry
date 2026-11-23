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
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { sanitizeInputs } from './middleware/sanitizeMiddleware.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

// Connects to MySQL and creates any missing tables before the server accepts requests.
await connectDB();

const app = express();

// On Hostinger the app runs behind the hosting's web server, which forwards every request. Without this,
// Express sees that proxy's
// address instead of the visitor's, and every visitor shares one rate-limit allowance.
// TRUST_PROXY_HOPS = number of proxies between the visitor and this server (default 1).
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

app.use(helmet({
  crossOriginResourcePolicy: false,
  // Browsers must use HTTPS for this API for 1 year (turn on "Force HTTPS" for the domain in Hostinger).
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true }
}));

// CORS: only the store's own sites may call this API from a browser.
// ALLOWED_ORIGINS = comma-separated list, e.g. "https://your-domain.com,https://admin.your-domain.com".
// Local development addresses are always allowed outside production.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const isDevOrigin = (origin) => process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

if (allowedOrigins.length === 0) {
  console.warn("⚠️ ALLOWED_ORIGINS is not set: the API accepts browser requests from any website. Set it in backend/.env (or the hosting panel's environment variables) to your storefront and admin addresses.");
}

const corsOptions = {
  origin: (origin, callback) => {
    // Requests without an Origin header (server-to-server, curl, health checks) are not browser cross-site requests.
    if (!origin || allowedOrigins.length === 0) return callback(null, true);
    const allowed = allowedOrigins.includes(origin) || isDevOrigin(origin);
    // Refused origins get no CORS headers, so the browser blocks the page from reading the response.
    return callback(null, allowed);
  },
  // Sessions use a Bearer token, not cookies, so browsers never need to send credentials.
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
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

// Shows the address the server sees for the caller, to confirm TRUST_PROXY_HOPS is right after deploys.
app.get('/api/health/ip', (req, res) => res.json({ success: true, ip: req.ip }));

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
    message: '✨ Shambhavi Imitation Jewelry Premium API is running successfully...'
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

import express from 'express';
import {
  getDashboardAnalytics,
  getSalesReport,
  getCustomerReport,
  getRevenueStats,
  getAllUsers,
  getUserDetails,
  getCartWishlistAnalytics,
  getSettings,
  updateSettings,
  getNotifications
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Expose settings publicly for frontend branding/freight calculation
router.get('/settings/public', getSettings);

// Enforce both JWT authentication and Admin role checks on all routes
router.use(protect, admin);

router.get('/dashboard', getDashboardAnalytics);
router.get('/sales-report', getSalesReport);
router.get('/customers', getCustomerReport); // Keep this for legacy / dashboard quick view
router.get('/revenue-stats', getRevenueStats);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.get('/cart-wishlist-analytics', getCartWishlistAnalytics);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/notifications', getNotifications);

export default router;

import express from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  getRazorpayKey
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - no auth needed
router.get('/key', getRazorpayKey);

// Payment operations require secure customer sessions
router.use(protect);

router.post('/order', createRazorpayOrder);
router.post('/verify', verifyPayment);

export default router;

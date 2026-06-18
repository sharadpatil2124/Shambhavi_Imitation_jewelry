import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  cancelOrder,
  refundOrder
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All order actions require secure authentication sessions
router.use(protect);

// Customer endpoints
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// Admin-only management endpoints
router.get('/', admin, getOrders);
router.put('/:id/status', admin, updateOrderStatus);
router.put('/:id/refund', admin, refundOrder);

export default router;

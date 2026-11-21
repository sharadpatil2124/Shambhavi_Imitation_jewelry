import express from 'express';
import {
  getUserCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getUserCart)
  .post(addToCart)
  .put(updateCartItemQuantity)
  .delete(removeFromCart);

export default router;

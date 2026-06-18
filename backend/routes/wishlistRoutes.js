import express from 'express';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All wishlist actions are protected behind JWT authentication
router.use(protect);

router.route('/')
  .get(getUserWishlist)
  .post(addToWishlist);

router.route('/:productId')
  .delete(removeFromWishlist);

export default router;

import express from 'express';
import {
  addReview,
  getProductReviews,
  editReview,
  deleteReview,
  getAllReviews,
  toggleReviewApproval
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly accessible route
router.get('/product/:productId', getProductReviews);

// Protected routes (require customer session)
router.post('/', protect, addReview);
router.put('/:id', protect, editReview);
router.delete('/:id', protect, deleteReview);

// Admin moderation routes
router.get('/', protect, admin, getAllReviews);
router.put('/:id/approve', protect, admin, toggleReviewApproval);

export default router;

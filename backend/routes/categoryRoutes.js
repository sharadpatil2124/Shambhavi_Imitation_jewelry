import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);

// Protected Admin-only routes (Single file upload layer for cover photo)
router.post('/', protect, admin, upload.single('image'), createCategory);
router.put('/:id', protect, admin, upload.single('image'), updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

export default router;

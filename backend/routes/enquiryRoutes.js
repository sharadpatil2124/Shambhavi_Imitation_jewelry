import express from 'express';
import {
  createEnquiry,
  getEnquiries,
  deleteEnquiry
} from '../controllers/enquiryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to submit an enquiry
router.post('/', createEnquiry);

// Admin routes to view/manage enquiries
router.get('/', protect, admin, getEnquiries);
router.delete('/:id', protect, admin, deleteEnquiry);

export default router;

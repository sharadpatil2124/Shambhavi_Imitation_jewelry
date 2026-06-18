import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true // Cache user name directly for fast catalog rendering
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a star rating'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars']
  },
  title: {
    type: String,
    trim: true
  },
  comment: {
    type: String,
    required: [true, 'Please provide review description comments'],
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure a single user can only submit one review per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;

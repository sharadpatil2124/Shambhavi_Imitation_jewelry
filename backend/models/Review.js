import { Model } from '../db/model.js';

// Table: reviews (one review per user per product, enforced by a unique key).
const Review = Model.define('Review', {
  table: 'reviews',
  fields: {
    user: { type: 'id', ref: 'User', column: 'user_id', required: true },
    product: { type: 'id', ref: 'Product', column: 'product_id', required: true },
    name: { type: 'string', required: true },
    rating: {
      type: 'number',
      required: 'Please provide a star rating',
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars']
    },
    title: { type: 'string', trim: true },
    comment: { type: 'string', required: 'Please provide review description comments', trim: true },
    isApproved: { type: 'boolean', default: true }
  }
});

export default Review;

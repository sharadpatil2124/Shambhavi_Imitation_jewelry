import { Model } from '../db/model.js';

// Table: coupons
const Coupon = Model.define('Coupon', {
  table: 'coupons',
  fields: {
    code: { type: 'string', required: 'Please provide the coupon code', uppercase: true, trim: true },
    discountPercentage: {
      type: 'number',
      required: 'Please specify the discount percentage',
      min: [1, 'Discount percentage must be at least 1%'],
      max: [100, 'Discount percentage cannot exceed 100%']
    },
    expiryDate: { type: 'date', required: 'Please specify the expiration date' },
    minOrderValue: { type: 'number', default: 0, min: [0, 'Minimum order value cannot be negative'] },
    isActive: { type: 'boolean', default: true }
  }
});

export default Coupon;

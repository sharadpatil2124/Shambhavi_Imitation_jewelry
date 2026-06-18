import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide the coupon code'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Please specify the discount percentage'],
    min: [1, 'Discount percentage must be at least 1%'],
    max: [100, 'Discount percentage cannot exceed 100%']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please specify the expiration date']
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order value cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;

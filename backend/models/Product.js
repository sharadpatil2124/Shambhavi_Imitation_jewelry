import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the product name'],
    trim: true,
    index: true
  },
  sku: {
    type: String,
    required: [true, 'Please provide product SKU code'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please associate this product with a category']
  },
  price: {
    type: Number,
    required: [true, 'Please specify the retail price'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Please specify the original cross-out price'],
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100%']
  },
  description: {
    type: String,
    required: [true, 'Please add a details description for the jewelry piece']
  },
  details: [{
    type: String,
    trim: true
  }],
  colors: [{
    type: String,
    trim: true
  }],
  sizes: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String, // Cloudinary secure URLs
    required: [true, 'Please upload at least one product image']
  }],
  stock: {
    type: Number,
    required: [true, 'Please specify stock inventory quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  rating: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be at least 1.0'],
    max: [5, 'Rating cannot exceed 5.0']
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  finishType: {
    type: String,
    trim: true,
    default: ''
  },
  weight: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Helper auto-calculate discount percentage before saving
productSchema.pre('save', function (next) {
  if (this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  } else {
    this.discount = 0;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;

import { Model } from '../db/model.js';

// Table: products. details/colors/sizes/images are lists of text stored as JSON.
const Product = Model.define('Product', {
  table: 'products',
  fields: {
    name: { type: 'string', required: 'Please provide the product name', trim: true },
    sku: { type: 'string', required: 'Please provide product SKU code', uppercase: true, trim: true },
    category: { type: 'id', ref: 'Category', column: 'category_id', required: 'Please associate this product with a category' },
    price: { type: 'number', required: 'Please specify the retail price', min: [0, 'Price cannot be negative'] },
    originalPrice: { type: 'number', required: 'Please specify the original cross-out price', min: [0, 'Original price cannot be negative'] },
    discount: {
      type: 'number',
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%']
    },
    description: { type: 'string', required: 'Please add a details description for the jewelry piece' },
    details: { type: 'stringArray', trim: true },
    colors: { type: 'stringArray', trim: true },
    sizes: { type: 'stringArray', trim: true },
    images: { type: 'stringArray' },
    stock: {
      type: 'number',
      required: 'Please specify stock inventory quantity',
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    rating: {
      type: 'number',
      default: 4.5,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot exceed 5.0']
    },
    reviewsCount: { type: 'number', default: 0 },
    isTrending: { type: 'boolean', default: false },
    isNewArrival: { type: 'boolean', default: false },
    finishType: { type: 'string', trim: true, default: '' },
    weight: { type: 'string', trim: true, default: '' }
  },
  preSave() {
    if (this.originalPrice > this.price) {
      this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    } else {
      this.discount = 0;
    }
  }
});

export default Product;

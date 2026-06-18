import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  color: { type: String, trim: true },
  size: { type: String, trim: true }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One cart document per user
    index: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;

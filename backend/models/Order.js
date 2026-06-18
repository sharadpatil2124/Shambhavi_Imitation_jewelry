import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  color: { type: String },
  size: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Razorpay'],
    required: true
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    email_address: { type: String }
  },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  discountPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  orderStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Processing'
  },
  courierName: { type: String },
  trackingNumber: { type: String },
  trackingId: { type: String },
  deliveredAt: { type: Date }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;

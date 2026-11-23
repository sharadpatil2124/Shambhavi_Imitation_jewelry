import { Model } from '../db/model.js';

// Table: orders. shippingAddress and paymentResult are stored as columns of the order
// (shipping_address_*, payment_result_*); the ordered items are in the child table order_items.
const Order = Model.define('Order', {
  table: 'orders',
  fields: {
    user: { type: 'id', ref: 'User', column: 'user_id', required: true },
    'shippingAddress.street': { type: 'string', required: true },
    'shippingAddress.city': { type: 'string', required: true },
    'shippingAddress.state': { type: 'string', required: true },
    'shippingAddress.pincode': { type: 'string', required: true },
    'shippingAddress.phone': { type: 'string', required: true },
    'shippingAddress.email': { type: 'string', required: true },
    paymentMethod: { type: 'string', enum: ['COD', 'Razorpay'], required: true },
    'paymentResult.id': 'string',
    'paymentResult.status': 'string',
    'paymentResult.email_address': 'string',
    razorpayOrderId: 'string',
    razorpayPaymentId: 'string',
    razorpaySignature: 'string',

    itemsPrice: { type: 'number', required: true, default: 0.0 },
    taxPrice: { type: 'number', required: true, default: 0.0 },
    shippingPrice: { type: 'number', required: true, default: 0.0 },
    discountPrice: { type: 'number', required: true, default: 0.0 },
    totalPrice: { type: 'number', required: true, default: 0.0 },

    isPaid: { type: 'boolean', required: true, default: false },
    paidAt: { type: 'date', keepNull: true }, // unpaid orders are saved with paidAt: null
    orderStatus: {
      type: 'string',
      required: true,
      enum: ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled', 'Refunded', 'Cancellation Requested'],
      default: 'Processing'
    },
    cancellationReason: 'string',
    // True once this order's items have been put back into stock (cancel or refund), so it never happens twice.
    stockRestored: { type: 'boolean', default: false },
    isRefunded: { type: 'boolean', default: false },
    refundAmount: { type: 'number', default: 0.0 },
    refundReason: { type: 'string', default: '' },
    refundedAt: 'date',
    refundTransactionId: { type: 'string', default: '' },
    courierName: 'string',
    trackingNumber: 'string',
    trackingId: 'string',
    deliveredAt: 'date'
  },
  children: {
    orderItems: {
      table: 'order_items',
      foreignKey: 'order_id',
      fields: {
        product: { type: 'id', ref: 'Product', column: 'product_id', required: true },
        name: { type: 'string', required: true },
        quantity: { type: 'number', required: true },
        image: { type: 'string', required: true },
        price: { type: 'number', required: true },
        color: 'string',
        size: 'string'
      }
    }
  }
});

export default Order;

import crypto from 'crypto';
import razorpayInstance from '../config/razorpay.js';
import Order from '../models/Order.js';
import { priceOrder, PricingError, toPaise } from '../utils/orderPricing.js';

// Razorpay signs `${order_id}|${payment_id}` with the key secret only when a payment succeeds.
// Compared in constant time. There is no mock/bypass path.
export const isValidRazorpaySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !razorpayOrderId || !razorpayPaymentId || typeof razorpaySignature !== 'string') return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(razorpaySignature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// @desc    Get Razorpay Public Key ID
// @route   GET /api/payments/key
// @access  Public
export const getRazorpayKey = (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123456'
  });
};

// @desc    Create Razorpay Order for the customer's cart. The amount is calculated on the server.
// @route   POST /api/payments/order
// @access  Private
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderItems, couponCode } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      res.status(400);
      throw new Error('Your cart is empty or out of date. Please refresh the page and try again.');
    }

    let pricing;
    try {
      pricing = await priceOrder({ orderItems, couponCode });
    } catch (err) {
      if (err instanceof PricingError) res.status(err.status);
      throw err;
    }

    if (pricing.settings.onlinePaymentEnabled === false) {
      res.status(400);
      throw new Error('Online payment is currently unavailable. Please choose Cash on Delivery.');
    }

    const options = {
      amount: toPaise(pricing.totalPrice),
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      // Binds this payment to the customer; checked again when the order is created.
      notes: { userId: String(req.user._id), couponCode: pricing.couponCode || '' }
    };

    let order;
    try {
      order = await razorpayInstance.orders.create(options);
    } catch (err) {
      console.error('❌ [Razorpay] Order creation failed:', err?.error?.description || err.message);
      res.status(502);
      throw new Error('Online payment is temporarily unavailable. Please try again in a few minutes or choose Cash on Delivery.');
    }

    res.status(201).json({
      success: true,
      message: 'Razorpay order created successfully',
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Signature for an order the customer owns
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      res.status(400);
      throw new Error('Please provide complete payment signature parameters');
    }

    if (!isValidRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      res.status(400);
      throw new Error('Payment verification failed: Invalid transaction signature');
    }

    const order = await Order.findById(orderId);
    if (!order || String(order.user) !== String(req.user._id)) {
      res.status(404);
      throw new Error('Order not found');
    }

    // The payment must be the one this order was created and paid with.
    if (order.razorpayOrderId !== String(razorpayOrderId) || order.razorpayPaymentId !== String(razorpayPaymentId)) {
      res.status(400);
      throw new Error('Payment verification failed: this payment does not belong to this order');
    }

    res.json({
      success: true,
      message: 'Payment verification succeeded: Secure signature validated successfully'
    });
  } catch (error) {
    next(error);
  }
};

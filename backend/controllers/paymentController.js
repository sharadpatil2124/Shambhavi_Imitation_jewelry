import crypto from 'crypto';
import razorpayInstance from '../config/razorpay.js';
import Order from '../models/Order.js';

// @desc    Get Razorpay Public Key ID
// @route   GET /api/payments/key
// @access  Public
export const getRazorpayKey = (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123456'
  });
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      res.status(400);
      throw new Error('Please specify a transaction amount');
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // Amount in paise (Razorpay standard)
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

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

// @desc    Verify Razorpay Signature & Save Payment details
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

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400);
      throw new Error('Please provide complete payment signature parameters');
    }

    // 1. Re-generate HMAC signature for security validation
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mockKeySecret6543210987';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // 2. Validate Signatures match
    if (generated_signature === razorpaySignature) {
      // Payment Verified!
      // If a local order ID is passed, update the order status
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.razorpayOrderId = razorpayOrderId;
          order.razorpayPaymentId = razorpayPaymentId;
          order.razorpaySignature = razorpaySignature;
          order.paymentResult = {
            id: razorpayPaymentId,
            status: 'Success',
            email_address: req.user.email
          };
          await order.save();
        }
      }

      res.json({
        success: true,
        message: 'Payment verification succeeded: Secure signature validated successfully'
      });
    } else {
      res.status(400);
      throw new Error('Payment verification failed: Invalid transaction signature');
    }
  } catch (error) {
    next(error);
  }
};

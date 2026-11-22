import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/userModel.js';
import razorpayInstance from '../config/razorpay.js';
import { priceOrder, PricingError, toPaise } from '../utils/orderPricing.js';
import { isValidRazorpaySignature } from './paymentController.js';
import { escapeRegex, parsePagination, queryString } from '../utils/queryHelpers.js';
import {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderRefundEmail,
  sendOrderDeliveryEmail,
  sendCancellationRejectedEmail,
  sendOrderShippedEmail
} from '../utils/sendEmail.js';

// Puts an order's items back into stock at most once (cancellation or refund).
// The flag is claimed atomically, so two simultaneous admin actions cannot both restore.
// Orders created before this flag existed count as already restored once Cancelled or Refunded.
const restoreOrderStockOnce = async (order, previousStatus) => {
  if (order.stockRestored || ['Cancelled', 'Refunded'].includes(previousStatus)) return false;

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, stockRestored: { $ne: true } },
    { $set: { stockRestored: true } }
  );
  order.stockRestored = true;
  if (!claimed) return false;

  for (const item of order.orderItems) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }
  return true;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems: requestedItems,
      shippingAddress,
      paymentMethod,
      couponCode,
      totalPrice: displayedTotal,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!['COD', 'Razorpay'].includes(paymentMethod)) {
      res.status(400);
      throw new Error('Please choose a valid payment method');
    }

    // Check the delivery address before reserving any stock.
    const requiredAddressFields = ['street', 'city', 'state', 'pincode', 'phone', 'email'];
    const missingAddressFields = requiredAddressFields.filter(
      (field) => typeof shippingAddress?.[field] !== 'string' || !shippingAddress[field].trim()
    );
    if (missingAddressFields.length > 0) {
      res.status(400);
      throw new Error(`Please complete the delivery address: ${missingAddressFields.join(', ')} missing`);
    }

    // 1. Price the order on the server. Prices, discount and total sent by the browser are ignored.
    let pricing;
    try {
      pricing = await priceOrder({ orderItems: requestedItems, couponCode });
    } catch (err) {
      if (err instanceof PricingError) res.status(err.status);
      throw err;
    }
    const { items: orderItems, settings } = pricing;

    if (paymentMethod === 'COD' && settings.codEnabled === false) {
      res.status(400);
      throw new Error('Cash on Delivery is currently unavailable. Please choose online payment.');
    }
    if (paymentMethod === 'Razorpay' && settings.onlinePaymentEnabled === false) {
      res.status(400);
      throw new Error('Online payment is currently unavailable. Please choose Cash on Delivery.');
    }

    // 2. For Razorpay, prove the payment before anything else: genuine signature, paid by this
    //    customer, for exactly this total, and not already used for another order.
    let paymentProof = null;
    if (paymentMethod === 'Razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(400);
        throw new Error('Payment details are missing. Please complete the payment to place this order.');
      }
      if (!isValidRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
        res.status(400);
        throw new Error('Payment verification failed: Invalid transaction signature');
      }

      let gatewayOrder;
      try {
        gatewayOrder = await razorpayInstance.orders.fetch(String(razorpayOrderId));
      } catch (err) {
        console.error('❌ [Razorpay] Could not fetch order for verification:', err?.error?.description || err.message);
        res.status(502);
        throw new Error('We could not confirm your payment with the payment gateway. Please contact support with your payment ID: ' + razorpayPaymentId);
      }

      if (String(gatewayOrder?.notes?.userId || '') !== String(req.user._id)) {
        res.status(400);
        throw new Error('Payment verification failed: this payment does not belong to your account');
      }
      if (Number(gatewayOrder.amount) !== toPaise(pricing.totalPrice)) {
        console.error(`❌ [Razorpay] Amount mismatch for ${razorpayOrderId}: paid ${gatewayOrder.amount} paise, order total ${toPaise(pricing.totalPrice)} paise`);
        res.status(409);
        throw new Error('The amount paid does not match your order total. Please contact support with your payment ID: ' + razorpayPaymentId);
      }
      if (await Order.exists({ razorpayOrderId: String(razorpayOrderId) })) {
        res.status(409);
        throw new Error('This payment has already been used for another order');
      }
      paymentProof = { razorpayOrderId: String(razorpayOrderId), razorpayPaymentId: String(razorpayPaymentId), razorpaySignature: String(razorpaySignature) };
    } else if (displayedTotal !== undefined && Number(displayedTotal) !== pricing.totalPrice) {
      // COD: do not place an order for a different amount than the customer was shown.
      res.status(409);
      throw new Error(`Prices in your cart have changed. Your order total is now ₹${pricing.totalPrice.toLocaleString('en-IN')}. Please review your cart and try again.`);
    }

    // 3. Atomic Concurrency Stock Deduction (Prevents Race Conditions & Overselling)
    const deductedProducts = [];
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback any items that were already deducted in this multi-item order
        for (const reverted of deductedProducts) {
          await Product.findByIdAndUpdate(reverted.id, { $inc: { stock: reverted.quantity } });
        }

        const existing = await Product.findById(item.product);
        res.status(400);
        if (!existing) {
          throw new Error(`Product not found: SKU ${item.sku || 'N/A'}`);
        } else {
          throw new Error(`Insufficient inventory: Only ${existing.stock} units of "${existing.name}" are available.`);
        }
      }

      deductedProducts.push({ id: item.product, quantity: item.quantity });
    }

    // 4. Create the Order with server-calculated amounts. Paid only when the payment was proven above.
    //    If saving fails for any reason, put the deducted stock back so no units are lost.
    let order;
    try {
      order = await Order.create({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: pricing.itemsPrice,
        taxPrice: pricing.taxPrice,
        shippingPrice: pricing.shippingPrice,
        discountPrice: pricing.discountPrice,
        totalPrice: pricing.totalPrice,
        ...(paymentProof || {}),
        isPaid: Boolean(paymentProof),
        paidAt: paymentProof ? Date.now() : null,
        paymentResult: paymentProof
          ? { id: paymentProof.razorpayPaymentId, status: 'Success', email_address: req.user.email }
          : undefined
      });
    } catch (createError) {
      for (const reverted of deductedProducts) {
        await Product.findByIdAndUpdate(reverted.id, { $inc: { stock: reverted.quantity } });
      }
      throw createError;
    }

    // 5. Clear user's Shopping Cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // 6. Send order confirmation email asynchronously
    if (order.shippingAddress && order.shippingAddress.email) {
      sendOrderConfirmationEmail(order.shippingAddress.email, order).catch(err => {
        console.error('⚠️ [Order Email Error]: Failed to send confirmation email:', err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      res.status(404);
      throw new Error('Order not found: Invalid Transaction ID format');
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found: Transaction ID does not exist');
    }

    // Validate access (Admin or the user who placed the order)
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You are not authorized to view this receipt');
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin Only)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const search = queryString(req.query.search);
    const status = queryString(req.query.status);
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, { defaultLimit: 10, maxLimit: 100 });
    const query = {};

    if (status) {
      query.orderStatus = status;
    }

    if (search) {
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        query._id = search;
      } else {
        const pattern = escapeRegex(search);
        const users = await User.find({
          isVerified: true,
          $or: [
            { name: { $regex: pattern, $options: 'i' } },
            { email: { $regex: pattern, $options: 'i' } }
          ]
        }).select('_id');

        const userIds = users.map(u => u._id);

        query.$or = [
          { user: { $in: userIds } },
          { 'shippingAddress.name': { $regex: pattern, $options: 'i' } },
          { 'shippingAddress.email': { $regex: pattern, $options: 'i' } },
          { 'shippingAddress.phone': { $regex: pattern, $options: 'i' } }
        ];
      }
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status / Dispatch parameters (Admin Only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const status = req.body.status || req.body.orderStatus;
    const courierName = req.body.courierName;
    const trackingNumber = req.body.trackingNumber || req.body.trackingId;
    const rejectionReason = req.body.rejectionReason;

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const previousStatus = order.orderStatus;

    // A. Check if Admin is approving cancellation (changing to Cancelled)
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      // 1. Restore product inventory stocks (skipped if a refund already did)
      await restoreOrderStockOnce(order, previousStatus);

      order.orderStatus = 'Cancelled';
      await order.save();

      // 2. Send order cancellation email to user
      if (order.shippingAddress && order.shippingAddress.email) {
        sendOrderCancellationEmail(order.shippingAddress.email, order).catch(err => {
          console.error('⚠️ [Cancellation Email Error]:', err.message);
        });
      }

      return res.json({
        success: true,
        message: 'Order cancelled by Admin and inventory stock restored',
        order
      });
    }

    // B. Check if Admin is rejecting a cancellation request
    if (previousStatus === 'Cancellation Requested' && status !== 'Cancelled' && status !== 'Refunded') {
      order.orderStatus = status || 'Processing';
      await order.save();

      // Send rejection notification email to user
      if (order.shippingAddress && order.shippingAddress.email) {
        sendCancellationRejectedEmail(order.shippingAddress.email, order, rejectionReason || 'Order is already being processed').catch(err => {
          console.error('⚠️ [Rejection Email Error]:', err.message);
        });
      }

      return res.json({
        success: true,
        message: `Cancellation request declined. Order status updated to: ${order.orderStatus}`,
        order
      });
    }

    // C. Check if Admin is marking order as Refunded directly via status update
    if (status === 'Refunded' && previousStatus !== 'Refunded') {
      if (!order.isPaid) {
        res.status(400);
        throw new Error('Cannot process refund: Order payment status is unpaid');
      }

      // Restore product inventory stocks unless already restored
      await restoreOrderStockOnce(order, previousStatus);

      order.orderStatus = 'Refunded';
      order.isRefunded = true;
      order.refundAmount = order.totalPrice;
      order.refundReason = rejectionReason || 'Status changed to Refunded by admin';
      order.refundedAt = Date.now();
      order.refundTransactionId = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await order.save();

      if (order.shippingAddress && order.shippingAddress.email) {
        sendOrderRefundEmail(order.shippingAddress.email, order).catch(err => {
          console.error('⚠️ [Refund Email Error]:', err.message);
        });
      }

      return res.json({
        success: true,
        message: 'Order marked as Refunded, inventory restored and customer notified',
        order
      });
    }

    // C. Regular status updates (Delivered, Shipped, etc.)
    order.orderStatus = status || order.orderStatus;
    
    if (courierName) order.courierName = courierName;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
      order.trackingId = trackingNumber;
    }

    if (status === 'Shipped' || status === 'Dispatched') {
      // Send tracking details notification email to customer
      if (order.shippingAddress && order.shippingAddress.email) {
        sendOrderShippedEmail(order.shippingAddress.email, order).catch(err => {
          console.error('⚠️ [Shipped Email Error]: Failed to send tracking email:', err.message);
        });
      }
    }

    if (status === 'Delivered') {
      order.isPaid = true;
      order.paidAt = order.paidAt || Date.now();
      order.deliveredAt = Date.now();

      // Send delivery notification email
      if (order.shippingAddress && order.shippingAddress.email) {
        sendOrderDeliveryEmail(order.shippingAddress.email, order).catch(err => {
          console.error('⚠️ [Delivery Email Error]:', err.message);
        });
      }
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to: ${order.orderStatus}`,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request order cancellation (Customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Verify access
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: Unauthorized action');
    }

    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Dispatched' || order.orderStatus === 'Shipped') {
      res.status(400);
      throw new Error('Cannot cancel order: Item has already been dispatched/delivered');
    }

    if (order.orderStatus === 'Cancelled') {
      res.status(400);
      throw new Error('Order has already been cancelled');
    }

    if (order.orderStatus === 'Refunded' || order.isRefunded) {
      res.status(400);
      throw new Error('Order has already been refunded');
    }

    // Set Status to Cancellation Requested & save reason
    order.orderStatus = 'Cancellation Requested';
    order.cancellationReason = reason || 'No reason provided';
    await order.save();

    res.json({
      success: true,
      message: 'Cancellation request submitted to admin for review',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund order payment (Admin Only)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
export const refundOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body || {};

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(404);
      throw new Error('Order not found: Invalid Order ID format');
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found: Order does not exist');
    }

    // Check if order is already refunded
    if (order.orderStatus === 'Refunded' || order.isRefunded) {
      res.status(400);
      throw new Error('Order has already been refunded');
    }

    // Payment validation: Cannot refund if order was never paid
    if (!order.isPaid) {
      res.status(400);
      throw new Error('Cannot process refund: Order payment status is unpaid');
    }

    // Amount validation
    const refundAmount = (amount !== undefined && amount !== null && amount !== '') ? Number(amount) : order.totalPrice;
    if (isNaN(refundAmount) || refundAmount <= 0) {
      res.status(400);
      throw new Error('Invalid refund amount: Must be a positive number greater than 0');
    }
    if (refundAmount > order.totalPrice) {
      res.status(400);
      throw new Error(`Refund amount (₹${refundAmount}) cannot exceed total order value (₹${order.totalPrice})`);
    }

    // 1. Restore product inventory stocks unless already restored by cancellation
    await restoreOrderStockOnce(order, order.orderStatus);

    // 2. Mark order as Refunded
    order.orderStatus = 'Refunded';
    order.isRefunded = true;
    order.refundAmount = refundAmount;
    order.refundReason = reason || 'Admin processed refund';
    order.refundedAt = Date.now();
    order.refundTransactionId = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await order.save();

    // 3. Send refund confirmation email
    if (order.shippingAddress && order.shippingAddress.email) {
      sendOrderRefundEmail(order.shippingAddress.email, order).catch(err => {
        console.error('⚠️ [Refund Email Error]:', err.message);
      });
    }

    res.json({
      success: true,
      message: `Order #${order._id.toString().substring(18).toUpperCase()} refunded successfully for ₹${refundAmount.toLocaleString('en-IN')}`,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public order tracking lookup (Guests and Customers)
// @route   POST /api/orders/track
// @access  Public
export const trackOrderPublicly = async (req, res, next) => {
  try {
    const { orderId, identifier } = req.body;

    if (!orderId) {
      res.status(400);
      throw new Error('Please provide a valid Order ID to track');
    }

    const cleanOrderId = String(orderId).trim();

    if (!/^[0-9a-fA-F]{24}$/.test(cleanOrderId)) {
      res.status(404);
      throw new Error('Order not found: Please check the Order ID format');
    }

    // Tracking always needs the email or phone used for the order, so an order ID alone reveals nothing.
    const cleanInput = identifier === undefined || identifier === null ? '' : String(identifier).trim().toLowerCase();
    if (!cleanInput) {
      res.status(400);
      throw new Error('Please enter the email address or phone number used for this order');
    }

    const order = await Order.findById(cleanOrderId);
    if (!order) {
      res.status(404);
      throw new Error('No order found with this Order ID');
    }

    const orderEmail = (order.shippingAddress?.email || '').toLowerCase();
    // Phones are compared on their last 10 digits, so "+91 98765 43210" matches "9876543210"
    // but a short fragment like "0" does not.
    const lastTen = (value) => String(value || '').replace(/\D/g, '').slice(-10);
    const orderPhone = lastTen(order.shippingAddress?.phone);
    const inputPhone = lastTen(cleanInput);

    const isEmailMatch = Boolean(orderEmail) && orderEmail === cleanInput;
    const isPhoneMatch = orderPhone.length === 10 && inputPhone === orderPhone;

    if (!isEmailMatch && !isPhoneMatch) {
      res.status(403);
      throw new Error('Verification failed: The provided email or phone does not match this order');
    }

    // Return safe public tracking payload without sensitive payment tokens
    res.json({
      success: true,
      order: {
        _id: order._id,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        isRefunded: order.isRefunded || order.orderStatus === 'Refunded',
        refundAmount: order.refundAmount || (order.orderStatus === 'Refunded' ? order.totalPrice : 0),
        refundReason: order.refundReason || '',
        refundedAt: order.refundedAt || null,
        refundTransactionId: order.refundTransactionId || '',
        itemsPrice: order.itemsPrice,
        shippingPrice: order.shippingPrice,
        discountPrice: order.discountPrice,
        totalPrice: order.totalPrice,
        courierName: order.courierName || 'Standard Express Delivery',
        trackingNumber: order.trackingNumber || order.trackingId || '',
        deliveredAt: order.deliveredAt,
        shippingAddress: {
          city: order.shippingAddress?.city,
          state: order.shippingAddress?.state,
          pincode: order.shippingAddress?.pincode
        },
        orderItems: (order.orderItems || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          color: item.color,
          size: item.size
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

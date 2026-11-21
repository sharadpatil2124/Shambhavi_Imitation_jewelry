import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/userModel.js';
import {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderRefundEmail,
  sendOrderDeliveryEmail,
  sendCancellationRejectedEmail,
  sendOrderShippedEmail
} from '../utils/sendEmail.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      res.status(400);
      throw new Error('No items specified to create an order');
    }

    // 1. Atomic Concurrency Stock Deduction (Prevents Race Conditions & Overselling)
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

    // 2. Create the Order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isPaid: paymentMethod === 'Razorpay' ? true : false,
      paidAt: paymentMethod === 'Razorpay' ? Date.now() : null
    });

    // 3. Clear user's Shopping Cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // 4. Send order confirmation email asynchronously
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
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.orderStatus = status;
    }

    if (search) {
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        query._id = search;
      } else {
        const users = await User.find({
          isVerified: true,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        const userIds = users.map(u => u._id);
        
        query.$or = [
          { user: { $in: userIds } },
          { 'shippingAddress.name': { $regex: search, $options: 'i' } },
          { 'shippingAddress.email': { $regex: search, $options: 'i' } },
          { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
        ];
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      orders,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
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
      // 1. Restore product inventory stocks
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

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

      // Restore product inventory stocks if not already cancelled
      if (previousStatus !== 'Cancelled') {
        for (const item of order.orderItems) {
          if (item.product) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
          }
        }
      }

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

    // 1. Restore product inventory stocks if not already restored by cancellation
    if (order.orderStatus !== 'Cancelled' && order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
          });
        }
      }
    }

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

    const cleanOrderId = orderId.trim();

    if (!/^[0-9a-fA-F]{24}$/.test(cleanOrderId)) {
      res.status(404);
      throw new Error('Order not found: Please check the Order ID format');
    }

    const order = await Order.findById(cleanOrderId);
    if (!order) {
      res.status(404);
      throw new Error('No order found with this Order ID');
    }

    // Security verification: If user is not authenticated or not the owner/admin,
    // they must provide either the matching phone number or email address
    if (identifier) {
      const cleanInput = identifier.trim().toLowerCase();
      const orderEmail = (order.shippingAddress?.email || '').toLowerCase();
      const orderPhone = (order.shippingAddress?.phone || '').replace(/\D/g, '');
      const inputPhone = cleanInput.replace(/\D/g, '');

      const isEmailMatch = orderEmail && orderEmail === cleanInput;
      const isPhoneMatch = orderPhone && inputPhone && (orderPhone.endsWith(inputPhone) || inputPhone.endsWith(orderPhone));

      if (!isEmailMatch && !isPhoneMatch) {
        res.status(403);
        throw new Error('Verification failed: The provided email or phone does not match this order');
      }
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

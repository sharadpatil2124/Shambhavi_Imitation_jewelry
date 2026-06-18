import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/userModel.js';
import { sendOrderConfirmationEmail } from '../utils/sendEmail.js';

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

    // 1. Verify Stock levels & Deduct stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: SKU ${item.sku || 'N/A'}`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient inventory: Only ${product.stock} units of ${product.name} are available`);
      }

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.orderStatus = status || order.orderStatus;
    
    if (courierName) order.courierName = courierName;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
      order.trackingId = trackingNumber;
    }

    if (status === 'Delivered') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.deliveredAt = Date.now();
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

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
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

    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Dispatched') {
      res.status(400);
      throw new Error('Cannot cancel order: Item has already been dispatched/delivered');
    }

    // 1. Restore product inventory stocks
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // 2. Set Status
    order.orderStatus = 'Cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully and stock inventory restored',
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
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.orderStatus !== 'Cancelled') {
      res.status(400);
      throw new Error('Cannot process refund: Order must be Cancelled first');
    }

    if (!order.isPaid) {
      res.status(400);
      throw new Error('Cannot process refund: Order payment status is unpaid');
    }

    // Process refund logic here (e.g. via Razorpay API refund call)
    // For now we will mock update the database status
    order.orderStatus = 'Refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Order refund marked successfully in records',
      order
    });
  } catch (error) {
    next(error);
  }
};

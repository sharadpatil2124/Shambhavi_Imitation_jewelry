import Order from '../models/Order.js';
import { query } from '../config/db.js';
import { parsePagination, queryString } from '../utils/queryHelpers.js';
import User from '../models/userModel.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Cart from '../models/Cart.js';
import Settings from '../models/Settings.js';
import Enquiry from '../models/Enquiry.js';

// Delivered orders that were not refunded (the orders that count as revenue).
const ACTIVE_DELIVERED = "order_status = 'Delivered' AND (is_refunded <> 1 OR is_refunded IS NULL)";

// @desc    Get dashboard analytics dashboard counters
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Core counters (Total Orders strictly for Delivered orders excluding refunded per user mandate)
    const totalUsers = await User.countDocuments({ role: 'customer', isVerified: true });
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({ orderStatus: 'Delivered', isRefunded: { $ne: true } });
    const totalReviews = await Review.countDocuments({});

    // 2. Compute Total Revenue strictly from active Delivered orders (refunded orders auto-deducted)
    const [revenueStats] = await query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total_price), 0) AS totalRevenue FROM orders WHERE ${ACTIVE_DELIVERED}`
    );
    const totalRevenue = revenueStats.count > 0 ? Number(revenueStats.totalRevenue) : 0;

    // Compute Refund Statistics
    const [refundStats] = await query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(COALESCE(refund_amount, total_price)), 0) AS totalRefunded
       FROM orders WHERE order_status = 'Refunded' OR is_refunded = 1`
    );
    const totalRefunded = refundStats.count > 0 ? Number(refundStats.totalRefunded) : 0;
    const refundedOrders = Number(refundStats.count);

    // 3. Order status segregation for all statuses including Refunded
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const confirmedOrders = await Order.countDocuments({ orderStatus: 'Confirmed' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
    const shippedOrders = await Order.countDocuments({ orderStatus: { $in: ['Shipped', 'Dispatched'] } });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered', isRefunded: { $ne: true } });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });
    const cancellationRequestedOrders = await Order.countDocuments({ orderStatus: 'Cancellation Requested' });

    // 4. Low stock inventory warnings (stock < 5)
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
      .select('name sku stock price images')
      .limit(5);

    res.json({
      success: true,
      analytics: {
        counters: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalReviews,
          totalRevenue,
          totalRefunded,
          refundedOrders
        },
        orderStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          cancellationRequested: cancellationRequestedOrders,
          refunded: refundedOrders
        },
        lowStockAlerts: lowStockProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales revenue reports grouped by month
// @route   GET /api/admin/sales-report
// @access  Private/Admin
export const getSalesReport = async (req, res, next) => {
  try {
    // Aggregation: Group active delivered payments by month-year (excluding refunded)
    const rows = await query(
      `SELECT YEAR(created_at) AS year, MONTH(created_at) AS month,
              COUNT(*) AS salesCount, SUM(total_price) AS totalSales
       FROM orders
       WHERE ${ACTIVE_DELIVERED}
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY year DESC, month DESC`
    );
    const monthlySales = rows.map((r) => ({
      _id: { year: Number(r.year), month: Number(r.month) },
      salesCount: Number(r.salesCount),
      totalSales: Number(r.totalSales)
    }));

    res.json({
      success: true,
      monthlySales
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get newest registered customers reports
// @route   GET /api/admin/customers
// @access  Private/Admin
export const getCustomerReport = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer', isVerified: true })
      .select('name email phone createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily revenue statistics for charts
// @route   GET /api/admin/revenue-stats
// @access  Private/Admin
export const getRevenueStats = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day,
              SUM(total_price) AS revenue, COUNT(*) AS orderCount
       FROM orders
       WHERE ${ACTIVE_DELIVERED}
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY day ASC
       LIMIT 30`
    );
    const dailyRevenue = rows.map((r) => ({
      _id: r.day,
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount)
    }));

    res.json({
      success: true,
      dailyRevenue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers with search, pagination, order statistics
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const search = queryString(req.query.search);
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, { defaultLimit: 10, maxLimit: 100 });
    const filter = { role: 'customer', isVerified: true };

    if (search) {
      filter.$or = [
        { name: { $contains: search } },
        { email: { $contains: search } },
        { phone: { $contains: search } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const usersData = [];
    for (const user of users) {
      const orders = await Order.find({ user: user._id });
      const orderCount = orders.length;
      const totalSpent = orders
        .filter(order => order.isPaid)
        .reduce((sum, order) => sum + order.totalPrice, 0);

      usersData.push({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || [],
        createdAt: user.createdAt,
        orderCount,
        totalSpent
      });
    }

    res.json({
      success: true,
      users: usersData,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer details and order history
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isVerified: true }).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('Customer not found');
    }

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cart and wishlist analytics (abandoned carts, wishlists)
// @route   GET /api/admin/cart-wishlist-analytics
// @access  Private/Admin
export const getCartWishlistAnalytics = async (req, res, next) => {
  try {
    // 1. Most wishlisted products
    const wishlistedProducts = (await query(
      `SELECT product_id AS productId, COUNT(*) AS count
       FROM wishlist_items
       GROUP BY product_id
       ORDER BY count DESC, product_id
       LIMIT 10`
    )).map((r) => ({ _id: r.productId, count: Number(r.count) }));
    const populatedWishlisted = await Product.populate(wishlistedProducts, {
      path: '_id',
      select: 'name sku price images stock'
    });

    // 2. Active/Abandoned Carts (with items)
    const activeCarts = await Cart.find({ 'items.0': { $exists: true } })
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images stock')
      .sort({ updatedAt: -1 });

    let totalAbandonedValue = 0;
    let totalAbandonedItemsCount = 0;

    const abandonedCartsData = activeCarts.map(cart => {
      let cartTotal = 0;
      let itemsCount = 0;
      const items = cart.items.map(item => {
        const itemPrice = item.product ? item.product.price : 0;
        const subtotal = itemPrice * item.quantity;
        cartTotal += subtotal;
        itemsCount += item.quantity;
        return {
          product: item.product,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          subtotal
        };
      });
      totalAbandonedValue += cartTotal;
      totalAbandonedItemsCount += itemsCount;
      return {
        _id: cart._id,
        user: cart.user,
        items,
        total: cartTotal,
        itemsCount,
        updatedAt: cart.updatedAt
      };
    });

    // 3. Popular products currently in user carts
    const popularInCarts = (await query(
      `SELECT product_id AS productId, SUM(quantity) AS count
       FROM cart_items
       GROUP BY product_id
       ORDER BY count DESC, product_id
       LIMIT 10`
    )).map((r) => ({ _id: r.productId, count: Number(r.count) }));
    const populatedPopularInCarts = await Product.populate(popularInCarts, {
      path: '_id',
      select: 'name sku price images stock'
    });

    res.json({
      success: true,
      wishlistAnalytics: populatedWishlisted,
      cartAnalytics: {
        totalCarts: activeCarts.length,
        totalValue: totalAbandonedValue,
        totalItems: totalAbandonedItemsCount,
        popularItems: populatedPopularInCarts,
        cartsList: abandonedCartsData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get store settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update store settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, message: 'Store settings updated successfully', settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active notifications from DB
// @route   GET /api/admin/notifications
// @access  Private/Admin
export const getNotifications = async (req, res, next) => {
  try {
    // 1. Fetch latest processing/pending orders (new orders)
    const orders = await Order.find({ orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] } })
      .sort({ createdAt: -1 })
      .limit(5);

    // 2. Fetch low stock items (stock <= 5)
    const lowStock = await Product.find({ stock: { $lte: 5 } })
      .select('name stock updatedAt')
      .limit(5);

    // 3. Fetch latest unapproved reviews
    const reviews = await Review.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Fetch latest customer enquiries
    const enquiries = await Enquiry.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    const notifications = [];

    // Map orders
    orders.forEach(order => {
      notifications.push({
        id: `order-${order._id}`,
        title: 'New Order Placed!',
        message: `Order #${order._id.toString().substring(18).toUpperCase()} was submitted for ₹${order.totalPrice.toLocaleString('en-IN')}.`,
        time: order.createdAt,
        link: '/orders',
        type: 'order'
      });
    });

    // Map low stock
    lowStock.forEach(prod => {
      notifications.push({
        id: `stock-${prod._id}`,
        title: 'Low Inventory Warning',
        message: `"${prod.name}" has only ${prod.stock} unit(s) remaining in catalog.`,
        time: prod.updatedAt || new Date(),
        link: '/products',
        type: 'product'
      });
    });

    // Map reviews
    reviews.forEach(rev => {
      notifications.push({
        id: `review-${rev._id}`,
        title: 'Pending Review Approval',
        message: `${rev.name} submitted a ${rev.rating}-star review waiting for approval.`,
        time: rev.createdAt,
        link: '/reviews',
        type: 'review'
      });
    });

    // Map enquiries
    enquiries.forEach(enq => {
      notifications.push({
        id: `enquiry-${enq._id}`,
        title: 'New Customer Enquiry',
        message: `Concierge message from ${enq.name} regarding: "${enq.subject || 'concierge inquiry'}".`,
        time: enq.createdAt,
        link: '/enquiries',
        type: 'enquiry'
      });
    });

    // Sort all notifications by time (newest first)
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Calculate count of items
    const totalCount = notifications.length;

    res.json({
      success: true,
      notifications: notifications.slice(0, 15), // limit list size
      count: totalCount
    });
  } catch (error) {
    next(error);
  }
};


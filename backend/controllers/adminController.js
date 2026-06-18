import Order from '../models/Order.js';
import User from '../models/userModel.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Settings from '../models/Settings.js';
import Enquiry from '../models/Enquiry.js';

// @desc    Get dashboard analytics dashboard counters
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Core counters
    const totalUsers = await User.countDocuments({ role: 'customer', isVerified: true });
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    const totalReviews = await Review.countDocuments({});

    // 2. Compute Total Revenue (Mongoose aggregation)
    const revenueStats = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // 3. Order status segregation
    const processingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
    const dispatchedOrders = await Order.countDocuments({ orderStatus: 'Dispatched' });
    const outForDeliveryOrders = await Order.countDocuments({ orderStatus: 'OutForDelivery' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

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
          totalRevenue
        },
        orderStatus: {
          processing: processingOrders,
          dispatched: dispatchedOrders,
          outForDelivery: outForDeliveryOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
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
    // Aggregation: Group payments by month-year
    const monthlySales = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          salesCount: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

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
    const dailyRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 } // Last 30 active sales days
    ]);

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
    const { search, page = 1, limit = 10 } = req.query;
    const query = { role: 'customer', isVerified: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

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
    const wishlistedProducts = await Wishlist.aggregate([
      { $unwind: '$products' },
      { $group: { _id: '$products', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
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
    const popularInCarts = await Cart.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
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


import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// @desc    Get current user's shopping cart
// @route   GET /api/cart
// @access  Private
export const getUserCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price originalPrice images stock sku category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    // Handle lazy initialization if cart was not created during register
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, color, size } = req.body;

    if (!productId) {
      res.status(400);
      throw new Error('Please specify the product ID to add');
    }

    // Verify product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found: Cannot add invalid item to cart');
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart with same color and size specs
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color === color &&
        item.size === size
    );

    if (existingItemIndex > -1) {
      // Increase quantity
      cart.items[existingItemIndex].quantity += Number(quantity);
    } else {
      // Add new cart item entry
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        color,
        size
      });
    }

    await cart.save();

    // Populate product details for response
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice images stock sku category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.json({
      success: true,
      message: `${product.name} added to cart successfully`,
      cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of item in cart
// @route   PUT /api/cart
// @access  Private
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { productId, quantity, color, size } = req.body;

    if (!productId || quantity === undefined) {
      res.status(400);
      throw new Error('Please specify the product ID and new quantity');
    }

    if (Number(quantity) < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1 unit');
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Shopping cart not found');
    }

    // Locate the target item
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color === color &&
        item.size === size
    );

    if (itemIndex === -1) {
      res.status(404);
      throw new Error('Item not found in shopping cart');
    }

    // Update quantity
    cart.items[itemIndex].quantity = Number(quantity);
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice images stock sku category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.json({
      success: true,
      message: 'Cart item quantity updated successfully',
      cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart
// @access  Private
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, color, size } = req.body;

    if (!productId) {
      res.status(400);
      throw new Error('Please specify the product ID to remove');
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Shopping cart not found');
    }

    // Filter out item
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.color === color &&
          item.size === size
        )
    );

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice images stock sku category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart
    });
  } catch (error) {
    next(error);
  }
};

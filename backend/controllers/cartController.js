import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Returns the user's cart, creating it in one atomic step. A plain find-then-create fails with a
// duplicate-key error when two requests create the same cart at once.
export const getOrCreateCart = async (userId) => {
  try {
    return await Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { upsert: true, new: true }
    );
  } catch (err) {
    if (err?.code === 11000) return Cart.findOne({ user: userId });
    throw err;
  }
};

const isWholeQuantity = (q) => Number.isInteger(q) && q >= 1;

// Units of this product already in the cart, across all colour/size lines, optionally excluding one line.
const quantityInCart = (cart, productId, exceptIndex = -1) =>
  cart.items.reduce((sum, item, index) =>
    (index !== exceptIndex && item.product.toString() === String(productId) ? sum + item.quantity : sum), 0);

// @desc    Get current user's shopping cart
// @route   GET /api/cart
// @access  Private
export const getUserCart = async (req, res, next) => {
  try {
    // Lazily created (atomically) if it was not created during registration
    const cart = await getOrCreateCart(req.user._id);
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

    const addQuantity = Number(quantity);
    if (!isWholeQuantity(addQuantity)) {
      res.status(400);
      throw new Error('Quantity must be a whole number of at least 1');
    }

    const cart = await getOrCreateCart(req.user._id);

    // Never let the cart hold more units than are in stock
    const alreadyInCart = quantityInCart(cart, productId);
    if (alreadyInCart + addQuantity > product.stock) {
      res.status(400);
      throw new Error(product.stock <= alreadyInCart
        ? `${product.name} is out of stock${alreadyInCart ? ' (all available units are already in your cart)' : ''}`
        : `Only ${product.stock} units of ${product.name} are available${alreadyInCart ? ` and ${alreadyInCart} are already in your cart` : ''}`);
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
      cart.items[existingItemIndex].quantity += addQuantity;
    } else {
      // Add new cart item entry
      cart.items.push({
        product: productId,
        quantity: addQuantity,
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

    if (!isWholeQuantity(Number(quantity))) {
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

    // Never let the cart hold more units than are in stock
    const product = await Product.findById(productId).select('name stock');
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    const otherLines = quantityInCart(cart, productId, itemIndex);
    if (otherLines + Number(quantity) > product.stock) {
      res.status(400);
      throw new Error(`Only ${product.stock} units of ${product.name} are available${otherLines ? ` (${otherLines} already in your cart in other options)` : ''}`);
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

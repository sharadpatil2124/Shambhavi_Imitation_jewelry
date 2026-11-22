import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// Returns the user's wishlist, creating it in one atomic step (a find-then-create fails with a
// duplicate-key error when two requests create the same wishlist at once).
const getOrCreateWishlist = async (userId) => {
  try {
    return await Wishlist.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, products: [] } },
      { upsert: true, new: true }
    );
  } catch (err) {
    if (err?.code === 11000) return Wishlist.findOne({ user: userId });
    throw err;
  }
};

// @desc    Get user's saved wishlist products
// @route   GET /api/wishlist
// @access  Private
export const getUserWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    await wishlist.populate({
      path: 'products',
      select: 'name price originalPrice discount images stock rating sku category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.json({
      success: true,
      wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      res.status(400);
      throw new Error('Please specify a valid product ID to save');
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found: Cannot save invalid item to wishlist');
    }

    const wishlist = await getOrCreateWishlist(req.user._id);

    // Add product if not already saved
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate({
      path: 'products',
      select: 'name price originalPrice discount images stock rating sku category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.json({
      success: true,
      message: `${product.name} saved to wishlist successfully`,
      wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      res.status(404);
      throw new Error('Wishlist not found');
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();

    await wishlist.populate({
      path: 'products',
      select: 'name price originalPrice discount images stock rating sku category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    res.json({
      success: true,
      message: 'Item removed from wishlist successfully',
      wishlist
    });
  } catch (error) {
    next(error);
  }
};

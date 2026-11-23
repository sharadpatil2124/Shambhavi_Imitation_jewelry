import Wishlist from '../models/Wishlist.js';
import { isDuplicateKeyError } from '../db/model.js';
import { transaction } from '../config/db.js';
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
    if (isDuplicateKeyError(err)) return Wishlist.findOne({ user: userId });
    throw err;
  }
};

// Runs a wishlist change inside a transaction. The user's wishlist row stays locked until the change
// is saved, so simultaneous requests are applied one after another instead of overwriting each other.
// The response is sent only after the change is committed.
const oneChangeAtATime = (change) => async (req, res, next) => {
  let payload;
  try {
    payload = await transaction(() => change(req, res));
  } catch (error) {
    return next(error);
  }
  res.json(payload);
};

const populateWishlist = (wishlist) => wishlist.populate({
  path: 'products',
  select: 'name price originalPrice discount images stock rating sku category',
  populate: {
    path: 'category',
    select: 'name'
  }
});

// @desc    Get user's saved wishlist products
// @route   GET /api/wishlist
// @access  Private
export const getUserWishlist = async (req, res, next) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    await populateWishlist(wishlist);

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
export const addToWishlist = oneChangeAtATime(async (req, res) => {
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

  await populateWishlist(wishlist);

  return {
    success: true,
    message: `${product.name} saved to wishlist successfully`,
    wishlist
  };
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = oneChangeAtATime(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id }).forUpdate();
  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId
  );

  await wishlist.save();

  await populateWishlist(wishlist);

  return {
    success: true,
    message: 'Item removed from wishlist successfully',
    wishlist
  };
});

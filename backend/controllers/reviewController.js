import Review from '../models/Review.js';
import Product from '../models/Product.js';

// Helper utility to recalculate and update product ratings and review counts
const updateProductRatingStats = async (productId) => {
  const reviews = await Review.find({ product: productId, isApproved: true });
  const reviewsCount = reviews.length;
  
  let rating = 4.5; // Default fallback rating
  if (reviewsCount > 0) {
    const totalStars = reviews.reduce((acc, cur) => acc + cur.rating, 0);
    rating = Number((totalStars / reviewsCount).toFixed(1));
  }

  await Product.findByIdAndUpdate(productId, {
    rating,
    reviewsCount
  });
};

// @desc    Add review for a product
// @route   POST /api/reviews
// @access  Private
export const addReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
      res.status(400);
      throw new Error('Please specify product ID, rating star score, and comment content');
    }

    // Check if user already submitted a review for this product
    const reviewExists = await Review.findOne({ user: req.user._id, product: productId });
    if (reviewExists) {
      res.status(400);
      throw new Error('You have already submitted a review for this jewelry piece');
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      name: req.user.name,
      rating: Number(rating),
      title,
      comment
    });

    // Recalculate stats
    await updateProductRatingStats(productId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a specific product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit user review
// @route   PUT /api/reviews/:id
// @access  Private
export const editReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Verify ownership
    if (review.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: Unauthorized action');
    }

    review.rating = rating !== undefined ? Number(rating) : review.rating;
    review.title = title !== undefined ? title : review.title;
    review.comment = comment || review.comment;

    await review.save();

    // Recalculate stats
    await updateProductRatingStats(review.product);

    res.json({
      success: true,
      message: 'Your review has been updated successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Verify ownership or admin privileges
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: Unauthorized action');
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate stats
    await updateProductRatingStats(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for moderation (Admin Only)
// @route   GET /api/reviews
// @access  Private/Admin
export const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('product', 'name sku price images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      reviews,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle review approval status (Admin Only)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
export const toggleReviewApproval = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    review.isApproved = !review.isApproved;
    await review.save();

    // Recalculate rating stats for product
    await updateProductRatingStats(review.product);

    res.json({
      success: true,
      message: `Review approval status updated to ${review.isApproved}`,
      review
    });
  } catch (error) {
    next(error);
  }
};

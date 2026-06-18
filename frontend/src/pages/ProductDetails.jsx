import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart, FiShoppingBag, FiMinus, FiPlus, FiArrowLeft, FiCheck, FiTruck, FiShield, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { FaHeart, FaStar, FaWhatsapp } from 'react-icons/fa';
import { getImageUrl } from '../utils/image';
import { addToCart } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { toast } from 'react-toastify';
import productService from '../services/productService';
import api from '../services/api';

// Premium Visual Loading Placeholder
const DetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center justify-center space-y-4 select-none">
    <div className="w-12 h-12 border-4 border-gold-250 border-t-gold-500 rounded-full animate-spin"></div>
    <span className="text-xs font-bold tracking-[0.3em] text-gold-600 uppercase animate-pulse">
      Loading Masterpiece...
    </span>
  </div>
);

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  // Dynamic state bindings
  const [product, setProduct] = useState(null);
  const [relatedProductsList, setRelatedProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState(null);

  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Hover zoom coordinates tracker
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Fetch product specifications from MERN backend
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await productService.getProductById(id);
        if (response && response.success) {
          const fetchedProduct = response.product;
          setProduct(fetchedProduct);
          
          // Prime local option states
          setActiveImageIndex(0);
          setSelectedColor(fetchedProduct.colors?.[0] || "");
          setSelectedSize(fetchedProduct.sizes?.[0] || "");
          setQuantity(1);

          // Fetch related recommendation masterpieces in the same category
          const categoryFilter = typeof fetchedProduct.category === 'object' 
            ? fetchedProduct.category?.name 
            : fetchedProduct.category;

          if (categoryFilter) {
            const relResponse = await productService.getProducts({ 
              category: categoryFilter, 
              limit: 5 
            });
            if (relResponse && relResponse.success) {
              // Exclude the current product from recommendations
              const filteredList = (relResponse.products || [])
                .filter(p => p._id !== fetchedProduct._id)
                .slice(0, 4);
              setRelatedProductsList(filteredList);
            }
          }
        } else {
          throw new Error('Masterpiece not found in catalog.');
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve jewelry details from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await api.get(`/reviews/product/${id}`);
      if (response && response.success) {
        setReviews(response.reviews || []);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  // Calculate rating statistics dynamically
  const totalReviews = reviews.length;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(rev => {
    const r = Math.round(rev.rating);
    if (ratingCounts[r] !== undefined) {
      ratingCounts[r]++;
    }
  });

  const getRatingBarPercentage = (stars) => {
    if (totalReviews === 0) return "0%";
    return `${((ratingCounts[stars] / totalReviews) * 100).toFixed(0)}%`;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to write a review.");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Please provide a star rating between 1 and 5.");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please provide review comments.");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await api.post('/reviews', {
        productId: id,
        rating,
        title: reviewTitle,
        comment: reviewComment
      });
      if (response && response.success) {
        toast.success("Thank you! Your review was successfully submitted.");
        setReviewTitle("");
        setReviewComment("");
        setRating(5);
        setShowReviewForm(false);
        // Refresh reviews list
        fetchReviews();
        // Refresh product details to get updated ratings & reviewsCount
        const prodResponse = await productService.getProductById(id);
        if (prodResponse && prodResponse.success) {
          setProduct(prodResponse.product);
        }
      } else {
        toast.error(response.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Review submission error:", err);
      toast.error(err.response?.data?.message || err.message || "An error occurred while submitting your review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center select-none">
        <FiAlertTriangle className="text-red-500 mx-auto mb-4" size={40} />
        <h2 className="font-serif text-3xl font-bold mb-4 text-primary">Masterpiece Not Found</h2>
        <p className="text-secondary text-sm font-sans mb-8 max-w-sm mx-auto">
          {error || "We couldn't locate the specific luxury jewelry piece you're seeking. It might have sold out or been archived."}
        </p>
        <Link
          to="/shop"
          className="bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-colors"
        >
          Return to Shop Catalog
        </Link>
      </div>
    );
  }

  const productId = product._id || product.id;
  const isWishlisted = wishlistItems.some((item) => (item._id || item.id) === productId);

  const handleWishlistToggle = () => {
    dispatch(toggleWishlist(product));
    if (isWishlisted) {
      toast.info(`Removed from wishlist: ${product.name}`, { position: "bottom-right", autoClose: 2000 });
    } else {
      toast.success(`Added to wishlist: ${product.name}`, { position: "bottom-right", autoClose: 2000 });
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity, color: selectedColor, size: selectedSize }));
    toast.success(`Added ${quantity}x to Cart: ${product.name}`, { position: "bottom-right", autoClose: 2000 });
  };

  const handleBuyNow = () => {
    dispatch(addToCart({ product, quantity, color: selectedColor, size: selectedSize }));
    navigate('/checkout');
  };

  const handleOrderOnWhatsApp = () => {
    const whatsappNumber = settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : "917083874227";
    const text = `Hello Shambhavi Imitation! I am interested in purchasing this product:\n\n*Product:* ${product.name}\n*SKU:* ${product.sku}\n*Price:* ₹${product.price.toLocaleString('en-IN')}\n*Color:* ${selectedColor}\n*Size:* ${selectedSize}\n*Quantity:* ${quantity}\n\nPlease confirm availability and help me complete the order. Thank you!`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedText}`, '_blank');
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* 1. Breadcrumbs / Go Back */}
      <div className="mb-6 flex items-center justify-between select-none">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs text-secondary hover:text-gold-600 font-semibold tracking-wide uppercase transition-colors cursor-pointer"
        >
          <FiArrowLeft />
          <span>Go Back</span>
        </button>
        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-secondary">
          <Link to="/" className="hover:text-gold-600">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold-600">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(categoryName)}`} className="hover:text-gold-600">{categoryName}</Link>
          <span>/</span>
          <span className="text-primary font-semibold truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* 2. Main Product Info Layout */}
      <div className="flex flex-col lg:flex-row gap-12 bg-white border border-gold-200/50 p-6 sm:p-8 lg:p-10 shadow-sm mb-16 dark:bg-[#090805] dark:border-gold-900/60">
        
        {/* Left Side: Image Selector Galleries */}
        <div className="w-full lg:w-1/2 flex flex-col md:flex-row gap-4">
          
          {/* Thumbnails vertical stack for desktop/large screens */}
          <div className="flex flex-row md:flex-col gap-2.5 order-2 md:order-1 overflow-x-auto md:overflow-y-auto md:w-20 md:h-[450px]">
            {product.images?.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-14 h-14 md:w-20 md:h-20 border-2 flex-shrink-0 transition-all duration-300 cursor-pointer ${
                  activeImageIndex === idx ? 'border-gold-500 shadow-sm' : 'border-gold-100 hover:border-gold-300'
                }`}
              >
                <img src={getImageUrl(img)} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Large Main Image */}
          <div 
            className="flex-grow order-1 md:order-2 aspect-square relative bg-[#faf9f6] overflow-hidden border border-gold-100 max-h-[450px] cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={getImageUrl(product.images?.[activeImageIndex])}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-100 ease-out"
              style={{
                transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
              }}
            />
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 z-10">
                -{product.discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Product Details & Actions */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between">
          <div className="text-left">
            {/* Category / SKU */}
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-gold-600 mb-3 select-none">
              <span>{categoryName}</span>
              <span>SKU: {product.sku}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-primary mb-3 leading-tight m-0 text-left dark:text-white">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-6 select-none">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    size={14}
                    className={i < Math.floor(product.rating || 5) ? 'text-amber-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-primary dark:text-gold-400">{product.rating || 5}</span>
              <span className="text-xs text-secondary font-medium dark:text-gray-400">({product.reviewsCount || 0} verified customers)</span>
            </div>

            {/* Pricing Panel */}
            <div className="flex items-baseline space-x-3 mb-6 bg-gold-50/50 p-4 border border-gold-100/30 dark:bg-gold-950/10">
              <span className="font-sans text-3xl font-bold text-primary dark:text-gold-400">
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <>
                  <span className="font-sans text-base text-secondary line-through dark:text-gray-400">
                    ₹{product.originalPrice?.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 uppercase tracking-wide">
                    {product.discount}% OFF SPECIAL PRICE
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-secondary text-sm font-sans leading-relaxed mb-6 text-left dark:text-gray-300">
              {product.description}
            </p>

            {/* Color Option Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5 select-none text-left">
                <span className="block text-xs font-bold uppercase tracking-wider text-primary mb-2 dark:text-white">
                  Select Color: <span className="text-gold-600 font-semibold">{selectedColor}</span>
                </span>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs font-medium border rounded-none transition-all duration-200 cursor-pointer ${
                        selectedColor === color
                          ? 'border-gold-600 bg-gold-50 text-gold-800 font-semibold shadow-xs'
                          : 'border-gray-200 hover:border-gold-300 text-primary bg-white'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Option Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6 select-none text-left">
                <span className="block text-xs font-bold uppercase tracking-wider text-primary mb-2 dark:text-white">
                  Select Size: <span className="text-gold-600 font-semibold">{selectedSize}</span>
                </span>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs font-medium border rounded-none transition-all duration-200 cursor-pointer ${
                        selectedSize === size
                          ? 'border-gold-600 bg-gold-50 text-gold-800 font-semibold shadow-xs'
                          : 'border-gray-200 hover:border-gold-300 text-primary bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {/* Quantity Selector */}
            <div className="flex items-center space-x-4 mb-6 select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white">Quantity:</span>
              <div className="flex items-center border border-gold-300 bg-white">
                <button
                  onClick={handleDecrement}
                  className="px-3.5 py-2 text-secondary hover:text-gold-600 transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <FiMinus size={14} />
                </button>
                <span className="w-12 text-center font-sans font-bold text-sm text-primary">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="px-3.5 py-2 text-secondary hover:text-gold-600 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <FiPlus size={14} />
                </button>
              </div>
            </div>

            {/* Cart & Buy Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-white hover:bg-gold-50 border-2 border-gold-500 text-gold-700 font-bold py-4 px-6 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FiShoppingBag size={15} />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 px-6 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer border-2 border-gold-500 hover:border-gold-600"
              >
                <span>Buy It Now</span>
              </button>
            </div>

            {/* Secondary Actions: WhatsApp & Wishlist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleOrderOnWhatsApp}
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FaWhatsapp size={16} />
                <span>Order on WhatsApp</span>
              </button>

              <button
                onClick={handleWishlistToggle}
                className="w-full border border-gray-200 hover:border-red-400 text-primary hover:text-red-500 font-semibold py-3.5 px-6 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer bg-white"
              >
                {isWishlisted ? (
                  <>
                    <FaHeart className="text-red-500" size={14} />
                    <span>Wishlisted</span>
                  </>
                ) : (
                  <>
                    <FiHeart size={14} />
                    <span>Add to Wishlist</span>
                  </>
                )}
              </button>
            </div>

            {/* Key Quality Indicators */}
            <div className="border-t border-gold-100 pt-6 grid grid-cols-3 gap-4 text-center select-none dark:border-gold-900/60">
              <div className="flex flex-col items-center">
                <FiTruck className="text-gold-600 mb-1" size={18} />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide dark:text-white">Free Shipping</span>
                <span className="text-[9px] text-secondary mt-0.5 dark:text-gray-400">On orders &gt; ₹{(settings?.freeShippingThreshold ?? 5000).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-col items-center border-x border-gold-100 dark:border-gold-900/60">
                <FiShield className="text-gold-600 mb-1" size={18} />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide dark:text-white">100% Secure</span>
                <span className="text-[9px] text-secondary mt-0.5 dark:text-gray-400">Encrypted Payments</span>
              </div>
              <div className="flex flex-col items-center">
                <FiRefreshCw className="text-gold-600 mb-1" size={18} />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide dark:text-white">Easy Returns</span>
                <span className="text-[9px] text-secondary mt-0.5 dark:text-gray-400">7-day replacement policy</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Customer Reviews Section */}
      <section className="bg-white border border-gold-200/50 p-6 sm:p-8 lg:p-10 shadow-sm mb-16 dark:bg-[#090805] dark:border-gold-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-gold-100 pb-6 dark:border-gold-900/60">
          <h3 className="font-serif text-xl font-bold tracking-wide text-primary m-0 dark:text-white">
            Customer Reviews ({reviews.length})
          </h3>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="inline-block bg-primary hover:bg-gold-500 text-white font-bold py-2.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center"
          >
            {showReviewForm ? "Cancel Review" : "Write a Review"}
          </button>
        </div>

        {/* Dynamic Interactive Review Form */}
        {showReviewForm && (
          <div className="mb-10 p-6 border border-gold-200/85 bg-gold-50/20 dark:bg-gold-950/5 dark:border-gold-800 text-left transition-all duration-300">
            <h4 className="font-serif text-base font-bold text-primary mb-4 dark:text-white">Share Your Experience</h4>
            
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Your Rating</label>
                  <div className="flex items-center space-x-1.5 mb-2">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        type="button"
                        key={starValue}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-amber-400 hover:scale-110 transition-transform duration-100 cursor-pointer"
                        aria-label={`Rate ${starValue} stars`}
                      >
                        <FaStar
                          size={24}
                          className={(hoverRating || rating) >= starValue ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-gold-600 ml-2 select-none">
                      {rating === 5 && 'Excellent'}
                      {rating === 4 && 'Very Good'}
                      {rating === 3 && 'Average'}
                      {rating === 2 && 'Poor'}
                      {rating === 1 && 'Terrible'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Review Title</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Absolutely stunning design!"
                    className="w-full bg-white border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none dark:bg-[#0c0b08] dark:border-gold-850 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Detailed Comments</label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe the quality, polish, wear comfort, and visual beauty of this imitation masterpiece..."
                    className="w-full bg-white border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none dark:bg-[#0c0b08] dark:border-gold-850 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-primary hover:bg-gold-500 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-colors cursor-pointer disabled:opacity-55"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-secondary text-sm mb-4">You must be logged in to leave a review for this jewelry design.</p>
                <Link
                  to="/login"
                  className="inline-block bg-primary hover:bg-gold-600 text-white font-bold py-3 px-6 text-xs tracking-widest uppercase transition-colors"
                >
                  Sign In Securely
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start mb-10 pb-8 border-b border-gold-100 dark:border-gold-900/60 text-left">
          {/* Average Rating Scorecard */}
          <div className="bg-gold-50/20 border border-gold-200/40 p-6 text-center w-full md:w-56 dark:bg-gold-950/5">
            <span className="text-4xl font-serif font-bold text-primary dark:text-white">{product.rating || 5}</span>
            <div className="flex text-amber-400 justify-center my-2">
              {[...Array(5)].map((_, i) => <FaStar key={i} size={15} className={i < Math.floor(product.rating || 5) ? 'text-amber-400' : 'text-gray-200'} />)}
            </div>
            <span className="text-xs text-secondary font-medium block dark:text-gray-400">Out of 5 Stars</span>
          </div>

          {/* Rating Bars Simulation */}
          <div className="flex-grow w-full space-y-2 max-w-md">
            {[
              { label: "5 Stars", percentage: getRatingBarPercentage(5), count: ratingCounts[5] },
              { label: "4 Stars", percentage: getRatingBarPercentage(4), count: ratingCounts[4] },
              { label: "3 Stars", percentage: getRatingBarPercentage(3), count: ratingCounts[3] },
              { label: "2 Stars", percentage: getRatingBarPercentage(2), count: ratingCounts[2] },
              { label: "1 Star", percentage: getRatingBarPercentage(1), count: ratingCounts[1] }
            ].map((bar) => (
              <div key={bar.label} className="flex items-center text-xs text-secondary font-medium dark:text-gray-400">
                <span className="w-14 text-left">{bar.label}</span>
                <div className="flex-grow bg-gray-100 h-2 mx-3 rounded-none overflow-hidden dark:bg-gray-800">
                  <div className="bg-gold-500 h-full" style={{ width: bar.percentage }}></div>
                </div>
                <span className="w-8 text-right font-semibold">{bar.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Review list */}
        <div className="space-y-6 text-left">
          {reviewsLoading ? (
            <div className="py-8 text-center">
              <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-secondary/60">Loading customer reviews...</p>
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((rev, idx) => (
              <div key={idx} className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif text-sm font-bold text-primary dark:text-white">{rev.user?.name || rev.name || "Customer"}</h4>
                  <span className="text-[10px] text-secondary font-semibold dark:text-gray-400">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                  </span>
                </div>
                <div className="flex text-amber-400 mb-2">
                  {[...Array(5)].map((_, i) => <FaStar key={i} size={11} className={i < (rev.rating || 5) ? 'text-amber-400' : 'text-gray-200'} />)}
                </div>
                {rev.title && <h5 className="font-serif text-sm font-bold text-primary mb-1 dark:text-white">{rev.title}</h5>}
                <p className="text-secondary text-sm font-sans leading-relaxed dark:text-gray-300">{rev.comment}</p>
              </div>
            ))
          ) : (
            <div className="py-12 text-center border border-dashed border-gold-200/60 dark:border-gold-900/40">
              <p className="text-secondary text-sm font-sans mb-4">No reviews yet for this masterpiece.</p>
              <p className="text-xs text-secondary/60 mb-6">Be the first to share your thoughts and help others make a beautiful choice.</p>
              <button
                onClick={() => {
                  setShowReviewForm(true);
                }}
                className="bg-primary hover:bg-gold-600 text-white font-bold py-3 px-6 text-xs tracking-widest uppercase transition-colors"
              >
                Write the First Review
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Related Products Grid */}
      {relatedProductsList.length > 0 && (
        <section className="border-t border-gold-200/50 pt-16 dark:border-gold-900/60">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">CURATED RECOMMENDATIONS</span>
            <h2 className="font-serif text-3xl font-bold tracking-wide text-primary dark:text-white">Related masterpieces</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {relatedProductsList.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onQuickView={(prod) => setSelectedQuickViewProduct(prod)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick View Modal Overlay */}
      {selectedQuickViewProduct && (
        <QuickViewModal
          product={selectedQuickViewProduct}
          onClose={() => setSelectedQuickViewProduct(null)}
        />
      )}

    </div>
  );
}

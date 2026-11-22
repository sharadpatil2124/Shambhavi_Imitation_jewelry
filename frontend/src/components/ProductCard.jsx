import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi';
import { getImageUrl } from '../utils/image';
import { FaHeart, FaStar } from 'react-icons/fa';
import { toggleWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import { toast } from 'react-toastify';

export default function ProductCard({ product, onQuickView }) {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  
  const productId = product._id || product.id;
  const isWishlisted = wishlistItems.some((item) => (item._id || item.id) === productId);

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product));
    if (isWishlisted) {
      toast.info(`Removed from wishlist: ${product.name}`, { position: "bottom-right", autoClose: 2000 });
    } else {
      toast.success(`Added to wishlist: ${product.name}`, { position: "bottom-right", autoClose: 2000 });
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }))
      .unwrap()
      .then(() => toast.success(`Added to Cart: ${product.name}`, { position: "bottom-right", autoClose: 2000 }))
      .catch((message) => toast.error(message || "Could not add this item to your cart.", { position: "bottom-right" }));
  };

  return (
    <div className="group bg-white dark:bg-[#0c0a06] border border-gold-200/50 overflow-hidden relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-gold-500/60 flex flex-col h-full select-none">
      {/* Product Image and Overlay Actions */}
      <div className="relative aspect-square overflow-hidden bg-[#faf9f6] dark:bg-[#12100b] select-none">
        
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1.5 pointer-events-none">
          {product.isTrending && (
            <span className="bg-gold-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1">
              Trending
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-primary dark:bg-gold-950/80 dark:border dark:border-gold-800 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1">
              New Arrival
            </span>
          )}
          {product.discount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1">
              -{product.discount}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 bg-white/95 dark:bg-[#100d07]/90 hover:bg-white text-primary hover:text-red-500 p-2.5 shadow-md transition-all duration-300 hover:scale-110 border border-gold-200/30 cursor-pointer"
          aria-label="Add to Wishlist"
        >
          {isWishlisted ? (
            <FaHeart className="text-red-500 w-4 h-4 sm:w-4.5 sm:h-4.5" />
          ) : (
            <FiHeart className="text-primary dark:text-gold-300 w-4 h-4 sm:w-4.5 sm:h-4.5 hover:text-red-500" />
          )}
        </button>

        {/* Main Product Link for Image */}
        <Link to={`/product/${productId}`} className="block w-full h-full">
          <img
            src={getImageUrl(product.images[0])}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {product.images[1] && (
            <img
              src={getImageUrl(product.images[1])}
              alt={`${product.name} alternate`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
            />
          )}
        </Link>

        {/* Desktop Quick View Overlay Action */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={() => onQuickView(product)}
            className="bg-white hover:bg-gold-500 hover:text-white dark:bg-[#100d07] dark:text-gold-200 dark:hover:bg-gold-500 dark:hover:text-white text-primary px-5 py-3 font-semibold text-xs tracking-widest uppercase shadow-xl flex items-center space-x-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 border border-gold-300/40 cursor-pointer"
          >
            <FiEye size={14} />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow dark:bg-[#0c0a06]">
        {/* Category */}
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold-600 mb-1 block text-left">
          {typeof product.category === 'object' ? product.category?.name : product.category}
        </span>

        {/* Title */}
        <Link
          to={`/product/${productId}`}
          className="font-serif text-sm sm:text-base font-bold text-primary dark:text-white hover:text-gold-600 dark:hover:text-gold-400 transition-colors duration-200 line-clamp-1 mb-2 text-left"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center space-x-1.5 mb-3 select-none">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                size={11}
                className={i < Math.floor(product.rating) ? 'text-amber-400' : 'text-gray-200 dark:text-gold-950/60'}
              />
            ))}
          </div>
          <span className="text-[10px] text-secondary dark:text-gold-300 font-medium">({product.reviewsCount})</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-gold-200/40 dark:border-gold-950/60">
          <div className="flex flex-col text-left min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-sans text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-800 dark:from-gold-300 dark:to-gold-500">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <span className="font-sans text-xs text-secondary dark:text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="shrink-0 bg-primary hover:bg-gold-500 text-white hover:text-primary py-2.5 px-3 border border-primary hover:border-gold-500 transition-all duration-300 flex items-center space-x-1.5 font-sans text-xs font-semibold cursor-pointer dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
            title="Add to Cart"
          >
            <FiShoppingBag size={14} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

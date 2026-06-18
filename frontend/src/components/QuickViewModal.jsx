import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiX, FiHeart, FiShoppingBag, FiMinus, FiPlus } from 'react-icons/fi';
import { FaHeart, FaStar, FaWhatsapp } from 'react-icons/fa';
import { getImageUrl } from '../utils/image';
import { addToCart } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import { toast } from 'react-toastify';

export default function QuickViewModal({ product, onClose }) {
  if (!product) return null;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [quantity, setQuantity] = useState(1);

  // Hover zoom coordinates tracker
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const { settings } = useSelector((state) => state.settings);
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
    onClose();
  };

  const handleBuyNow = () => {
    dispatch(addToCart({ product, quantity, color: selectedColor, size: selectedSize }));
    onClose();
    navigate('/checkout');
  };

  const handleOrderOnWhatsApp = () => {
    const whatsappNumber = settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : "917083874227";
    const text = `Hello Shambhavi Imitation! I am extremely interested in buying this item:\n\n*Product:* ${product.name}\n*SKU:* ${product.sku}\n*Price:* ₹${product.price.toLocaleString('en-IN')}\n*Color:* ${selectedColor}\n*Size:* ${selectedSize}\n*Qty:* ${quantity}\n\nCan you please check availability and help me place the order? Thank you!`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedText}`, '_blank');
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Backdrop click closer */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white border border-gold-200/50 rounded-none shadow-2xl overflow-hidden transform animate-scale-up z-10 flex flex-col md:flex-row max-h-[90svh] md:max-h-none overflow-y-auto md:overflow-visible">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/80 hover:bg-gold-50 text-primary hover:text-gold-600 p-2 border border-gold-100 z-20 transition-all duration-300"
          aria-label="Close modal"
        >
          <FiX size={20} />
        </button>

        {/* Left Side: Images & Slider preview */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center bg-[#faf9f6]">
          {/* Main Large Image */}
          <div 
            className="relative aspect-square w-full overflow-hidden border border-gold-100 bg-white mb-4 cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={getImageUrl(product.images[activeImageIndex])}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-100 ease-out"
              style={{
                transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
              }}
            />
          </div>
          
          {/* Image Thumbnails Selection */}
          <div className="flex gap-2.5 overflow-x-auto py-1">
            {product.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`w-16 h-16 sm:w-20 sm:h-20 border-2 flex-shrink-0 transition-all duration-300 ${
                  activeImageIndex === index ? 'border-gold-500 shadow-md' : 'border-gold-100 hover:border-gold-300'
                }`}
              >
                <img src={getImageUrl(img)} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Product Customizations and Info */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50svh] md:max-h-[85vh]">
          <div>
            {/* SKU and Category */}
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-gold-600 mb-2">
              <span>{typeof product.category === 'object' ? product.category?.name : product.category}</span>
              <span>SKU: {product.sku}</span>
            </div>

            {/* Title */}
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-wide mb-3 leading-tight">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    size={13}
                    className={i < Math.floor(product.rating) ? 'text-amber-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-primary">{product.rating}</span>
              <span className="text-xs text-secondary font-medium">({product.reviewsCount} reviews)</span>
            </div>

            {/* Pricing Section */}
            <div className="flex items-baseline space-x-3 mb-6 bg-gold-50/50 p-3 border border-gold-100/30">
              <span className="font-sans text-2xl font-bold text-primary">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <>
                  <span className="font-sans text-sm text-secondary line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 uppercase tracking-wide">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Product Description */}
            <p className="text-secondary text-sm font-sans leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Color Option Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <span className="block text-xs font-bold uppercase tracking-wider text-primary mb-2">
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
              <div className="mb-6">
                <span className="block text-xs font-bold uppercase tracking-wider text-primary mb-2">
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
            {/* Quantity and Cart Actions */}
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Quantity:</span>
              <div className="flex items-center border border-gold-300 bg-white">
                <button
                  onClick={handleDecrement}
                  className="px-3 py-2 text-secondary hover:text-gold-600 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <FiMinus size={14} />
                </button>
                <span className="w-10 text-center font-sans font-bold text-sm text-primary select-none">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="px-3 py-2 text-secondary hover:text-gold-600 transition-colors"
                  aria-label="Increase quantity"
                >
                  <FiPlus size={14} />
                </button>
              </div>
            </div>

            {/* Buttons Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-white hover:bg-gold-50 border-2 border-gold-500 text-gold-700 font-bold py-3.5 px-4 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FiShoppingBag size={15} />
                <span>Add to Cart</span>
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3.5 px-4 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer border-2 border-gold-500 hover:border-gold-600"
              >
                <span>Buy It Now</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Order on WhatsApp */}
              <button
                onClick={handleOrderOnWhatsApp}
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-3 px-4 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FaWhatsapp size={16} />
                <span>Order on WhatsApp</span>
              </button>

              {/* Wishlist toggle */}
              <button
                onClick={handleWishlistToggle}
                className="w-full border border-gray-200 hover:border-red-400 text-primary hover:text-red-500 font-semibold py-3 px-4 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer bg-white"
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
          </div>
        </div>

      </div>
    </div>
  );
}

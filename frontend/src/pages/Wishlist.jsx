import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiTrash2, FiEye } from 'react-icons/fi';
import { removeFromWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import QuickViewModal from '../components/QuickViewModal';
import { toast } from 'react-toastify';
import productService from '../services/productService';
import { getImageUrl } from '../utils/image';

export default function Wishlist() {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const products = useSelector((state) => state.products.items) || [];

  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState(null);

  const handleAddToCart = (item) => {
    // Find full product object to add properly, or reconstruct it using wishlist item metadata
    const fullProduct = products.find(p => p.id === item.id || p._id === item.id) || {
      _id: item.id,
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      images: [item.image],
      colors: ['Default'],
      sizes: ['Standard'],
      countInStock: 10
    };
    dispatch(addToCart({ product: fullProduct, quantity: 1 }));
    toast.success(`Added to Cart: ${item.name}`, { position: "bottom-right", autoClose: 2000 });
  };

  const handleRemove = (id, name) => {
    dispatch(removeFromWishlist(id));
    toast.info(`Removed from wishlist: ${name}`, { position: "bottom-right", autoClose: 2000 });
  };

  const handleQuickView = async (item) => {
    const fullProduct = products.find(p => p.id === item.id || p._id === item.id);
    if (fullProduct) {
      setSelectedQuickViewProduct(fullProduct);
    } else {
      try {
        const response = await productService.getProductById(item.id);
        if (response && response.success && response.product) {
          setSelectedQuickViewProduct(response.product);
        } else {
          toast.error("Failed to load product details for quick view.");
        }
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        toast.error("Failed to load product details.");
      }
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center select-none animate-fade-in">
        <div className="flex flex-col items-center max-w-sm mx-auto">
          <div className="w-20 h-20 bg-gold-50 border border-gold-200/50 rounded-full flex items-center justify-center text-gold-600 mb-6">
            <FiHeart size={32} />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary mb-3">Your Wishlist is Empty</h2>
          <p className="text-secondary text-sm font-sans mb-8 leading-relaxed">
            You haven't saved any jewelry pieces yet. Explore our collections and click the heart icon on your favorite items to save them here.
          </p>
          <Link
            to="/shop"
            className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-4 px-6 text-xs tracking-widest uppercase transition-colors"
          >
            Browse Jewelry Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="border-b border-gold-100 pb-4 mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0">
          My Saved Wishlist ({wishlistItems.length} items)
        </h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {wishlistItems.map((item) => (
          <div
            key={item.id}
            className="group bg-white border border-gold-100/60 overflow-hidden luxury-shadow flex flex-col h-full relative"
          >
            {/* Image & overlay */}
            <div className="relative aspect-square overflow-hidden bg-[#faf9f6] select-none">
              <img
                src={getImageUrl(item.image)}
                alt={item.name}
                className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 ease-out"
              />
              
              {/* Trash/Remove Icon */}
              <button
                onClick={() => handleRemove(item.id, item.name)}
                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-secondary hover:text-red-500 p-2 border border-gold-100/50 shadow-md transition-colors"
                title="Remove from wishlist"
              >
                <FiTrash2 size={16} />
              </button>

              {/* Quick view overlay */}
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={() => handleQuickView(item)}
                  className="bg-white hover:bg-gold-500 hover:text-white text-primary px-4 py-2.5 font-semibold text-[10px] tracking-widest uppercase shadow-xl flex items-center space-x-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all duration-350 cursor-pointer"
                >
                  <FiEye size={12} />
                  <span>Quick View</span>
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gold-600 mb-1">
                {item.category}
              </span>
              <Link
                to={`/product/${item.id}`}
                className="font-serif text-sm font-bold text-primary hover:text-gold-600 transition-colors line-clamp-1 mb-2"
              >
                {item.name}
              </Link>
              
              <div className="mt-auto pt-3 border-t border-gold-100/40 flex items-center justify-between">
                <span className="font-sans text-sm sm:text-base font-bold text-primary">
                  ₹{item.price.toLocaleString('en-IN')}
                </span>
                
                <button
                  onClick={() => handleAddToCart(item)}
                  className="bg-primary hover:bg-gold-500 text-white p-2.5 sm:px-3 sm:py-2 transition-colors flex items-center space-x-1.5 font-sans text-xs font-semibold cursor-pointer"
                  title="Add to Cart"
                >
                  <FiShoppingBag size={14} />
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

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

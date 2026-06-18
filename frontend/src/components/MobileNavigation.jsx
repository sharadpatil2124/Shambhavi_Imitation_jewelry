import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiHome, FiShoppingBag, FiHeart, FiGrid, FiUser } from 'react-icons/fi';

export default function MobileNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const isActive = (path) => currentPath === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gold-200/80 shadow-2xl z-40 px-3 py-2 flex justify-around items-center select-none pb-safe">
      {/* Home */}
      <Link
        to="/"
        className={`flex flex-col items-center p-2 transition-colors duration-200 ${
          isActive('/') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiHome size={20} />
        <span className="text-[10px] font-medium mt-1 tracking-wide">Home</span>
      </Link>

      {/* Shop */}
      <Link
        to="/shop"
        className={`flex flex-col items-center p-2 transition-colors duration-200 ${
          isActive('/shop') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiShoppingBag size={20} />
        <span className="text-[10px] font-medium mt-1 tracking-wide">Shop</span>
      </Link>

      {/* Categories */}
      <Link
        to="/categories"
        className={`flex flex-col items-center p-2 transition-colors duration-200 ${
          isActive('/categories') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiGrid size={20} />
        <span className="text-[10px] font-medium mt-1 tracking-wide">Categories</span>
      </Link>

      {/* Wishlist */}
      <Link
        to="/wishlist"
        className={`flex flex-col items-center p-2 transition-colors duration-200 relative ${
          isActive('/wishlist') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiHeart size={20} />
        {wishlistCount > 0 && (
          <span className="absolute top-1 right-1 bg-gold-600 text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center border border-white">
            {wishlistCount}
          </span>
        )}
        <span className="text-[10px] font-medium mt-1 tracking-wide">Wishlist</span>
      </Link>

      {/* Account */}
      <Link
        to={isAuthenticated ? "/account" : "/login"}
        className={`flex flex-col items-center p-2 transition-colors duration-200 ${
          isActive('/account') || isActive('/login') || isActive('/register')
            ? 'text-gold-600'
            : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiUser size={20} />
        <span className="text-[10px] font-medium mt-1 tracking-wide">Account</span>
      </Link>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiHome, FiShoppingBag, FiHeart, FiGrid, FiUser } from 'react-icons/fi';

export default function MobileNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const wishlistCount = wishlistItems.length;

  const isActive = (path) => currentPath === path;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-[#0a0907]/95 backdrop-blur-md border-t border-gold-200/80 dark:border-gold-950/60 shadow-2xl z-40 px-1 grid grid-cols-5 items-stretch select-none">
      {/* Home */}
      <Link
        to="/"
        className={`flex flex-col items-center justify-center min-w-0 px-1 transition-colors duration-200 ${
          isActive('/') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiHome size={20} />
        <span className="text-[10px] leading-tight font-medium mt-1 min-[375px]:tracking-wide truncate max-w-full">Home</span>
      </Link>

      {/* Shop */}
      <Link
        to="/shop"
        className={`flex flex-col items-center justify-center min-w-0 px-1 transition-colors duration-200 ${
          isActive('/shop') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiShoppingBag size={20} />
        <span className="text-[10px] leading-tight font-medium mt-1 min-[375px]:tracking-wide truncate max-w-full">Shop</span>
      </Link>

      {/* Categories */}
      <Link
        to="/categories"
        className={`flex flex-col items-center justify-center min-w-0 px-1 transition-colors duration-200 ${
          isActive('/categories') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiGrid size={20} />
        <span className="text-[10px] leading-tight font-medium mt-1 min-[375px]:tracking-wide truncate max-w-full">Categories</span>
      </Link>

      {/* Wishlist */}
      <Link
        to="/wishlist"
        className={`flex flex-col items-center justify-center min-w-0 px-1 transition-colors duration-200 relative ${
          isActive('/wishlist') ? 'text-gold-600' : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiHeart size={20} />
        {wishlistCount > 0 && (
          <span className="absolute top-1.5 left-1/2 ml-1.5 bg-gold-600 text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center border border-white">
            {wishlistCount}
          </span>
        )}
        <span className="text-[10px] leading-tight font-medium mt-1 min-[375px]:tracking-wide truncate max-w-full">Wishlist</span>
      </Link>

      {/* Account */}
      <Link
        to={isAuthenticated ? "/account" : "/login"}
        className={`flex flex-col items-center justify-center min-w-0 px-1 transition-colors duration-200 ${
          isActive('/account') || isActive('/login') || isActive('/register')
            ? 'text-gold-600'
            : 'text-secondary hover:text-gold-500'
        }`}
      >
        <FiUser size={20} />
        <span className="text-[10px] leading-tight font-medium mt-1 min-[375px]:tracking-wide truncate max-w-full">Account</span>
      </Link>
    </div>
  );
}

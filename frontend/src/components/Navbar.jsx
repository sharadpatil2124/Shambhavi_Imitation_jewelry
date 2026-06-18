import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX, FiChevronDown, FiSun, FiMoon } from 'react-icons/fi';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "Categories", path: "/categories" },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" }
  ];

  return (
    <>
      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-gold-200/80 shadow-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Hamburger menu for mobile, Nav Links for desktop */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-primary hover:text-gold-600 p-2 md:hidden transition-colors"
                aria-label="Open menu"
              >
                <FiMenu size={24} />
              </button>

              <nav className="hidden md:flex space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className="text-primary font-bold text-xs sm:text-sm tracking-[0.2em] uppercase hover:text-gold-600 transition-all duration-200 relative group py-2"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center: Brand Typography with Circular Luxury Logo */}
            <div className="flex flex-col items-center select-none text-center">
              <Link to="/" className="group flex items-center space-x-2 sm:space-x-3">
                <img 
                  src={settings?.logoUrl || "/logo.png"} 
                  alt="Shambhavi Jewelry Logo" 
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full border border-gold-300 shadow-xs group-hover:scale-105 transition-transform duration-300"
                />
                <div className="flex flex-col items-start text-left">
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.18em] text-primary group-hover:text-gold-600 transition-colors duration-300 leading-none">
                    SHAMBHAVI
                  </span>
                  <span className="text-[8px] sm:text-[9px] tracking-[0.3em] font-sans font-semibold text-gold-600 uppercase mt-0.5 sm:mt-1">
                    Imitation Jewelry
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: Search, Wishlist, Cart, Profile */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-primary hover:text-gold-600 transition-colors cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>

              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-primary hover:text-gold-600 transition-colors"
                aria-label="Search products"
              >
                <FiSearch size={22} />
              </button>

              {/* Profile */}
              <Link
                to={isAuthenticated ? "/account" : "/login"}
                className="p-2 text-primary hover:text-gold-600 transition-colors hidden sm:block"
                title="My Account"
              >
                <FiUser size={22} />
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 text-primary hover:text-gold-600 transition-colors relative"
                title="Wishlist"
              >
                <FiHeart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-gold-600 text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center border border-white animate-scale-up">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="p-2 text-primary hover:text-gold-600 transition-colors relative"
                title="Shopping Cart"
              >
                <FiShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center border border-white animate-scale-up">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Full-screen Search Bar Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gold-400 p-2 transition-colors duration-200"
            aria-label="Close search"
          >
            <FiX size={32} />
          </button>
          <div className="w-full max-w-2xl bg-white p-8 rounded-none shadow-2xl border border-gold-200 transform animate-scale-up">
            <h3 className="font-serif text-2xl font-semibold mb-6 text-center text-primary tracking-wide">
              What are you looking for?
            </h3>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search necklaces, kundan sets, jhumkas, kada..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full border-b-2 border-gold-300 focus:border-gold-500 py-3 pl-2 pr-12 outline-none font-sans text-lg text-primary placeholder-gold-300/80 transition-colors duration-300"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gold-600 hover:text-gold-800 p-2 transition-colors duration-200"
              >
                <FiSearch size={26} />
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2 justify-center items-center">
              <span className="text-xs text-secondary font-medium tracking-wide uppercase mr-2">Trending:</span>
              {["Kundan Set", "Haram", "Chandelier Earrings", "Temple Jewelry"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    navigate(`/shop?search=${encodeURIComponent(term)}`);
                    setIsSearchOpen(false);
                  }}
                  className="text-xs text-primary bg-gold-50 border border-gold-200 hover:border-gold-400 py-1.5 px-3 rounded-none transition-colors duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sliding Drawer Sidebar Menu */}
      <div
        className={`fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gold-100 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gold-100">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col">
            <span className="font-serif text-xl font-bold tracking-[0.1em] text-primary">
              SHAMBHAVI
            </span>
            <span className="text-[8px] tracking-[0.3em] font-semibold text-gold-600 -mt-1 uppercase">
              Imitation Jewelry
            </span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-primary hover:text-gold-600 p-1"
            aria-label="Close menu"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-73px)] justify-between py-6">
          <nav className="flex flex-col px-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-primary font-medium tracking-widest uppercase text-base hover:text-gold-600 transition-colors py-2 border-b border-gray-50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={isAuthenticated ? "/account" : "/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary font-medium tracking-widest uppercase text-base hover:text-gold-600 transition-colors py-2 border-b border-gray-50 flex items-center justify-between"
            >
              <span>My Account</span>
              <FiUser size={18} className="text-gold-600" />
            </Link>
          </nav>

          <div className="px-6 border-t border-gold-100 pt-6">
            <p className="text-xs text-secondary font-medium tracking-wide mb-3">Customer Support</p>
            <a
              href={`https://wa.me/${settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : '917083874227'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 bg-[#25d366] text-white font-semibold text-sm tracking-wider uppercase hover:bg-[#20ba5a] transition-colors"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>

      {/* Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/45 z-40 backdrop-blur-xs md:hidden"
        ></div>
      )}
    </>
  );
}

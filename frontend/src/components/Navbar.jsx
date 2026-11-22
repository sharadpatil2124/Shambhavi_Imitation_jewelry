import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';

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
  const { isAuthenticated } = useSelector((state) => state.auth);
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
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gold-200/30 dark:border-gold-950/60 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-16 sm:h-20">
            {/* Left: Brand Logo & Typography, followed by Nav Links for desktop */}
            <div className="flex items-center min-w-0 gap-1 sm:gap-4 lg:gap-8 xl:gap-12">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-primary hover:text-gold-600 p-2 -ml-1 lg:hidden transition-colors cursor-pointer dark:text-gray-300"
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
              >
                <FiMenu size={22} />
              </button>

              <Link to="/" className="group flex items-center gap-2 sm:gap-3 min-w-0 select-none text-left">
                <img
                  src={settings?.logoUrl || "/logo.png"}
                  alt="Shambhavi Jewelry Logo"
                  className="w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 sm:w-10 sm:h-10 shrink-0 object-contain rounded-full border border-gold-300/70 shadow-xs group-hover:rotate-6 transition-all duration-500"
                />
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="font-serif text-[13px] min-[375px]:text-base sm:text-xl font-bold tracking-widest min-[375px]:tracking-[0.15em] sm:tracking-[0.2em] text-primary group-hover:text-gold-600 transition-colors duration-300 leading-none whitespace-nowrap dark:text-white">
                    SHAMBHAVI
                  </span>
                  <span className="text-[7px] sm:text-[8px] tracking-[0.25em] min-[375px]:tracking-[0.35em] font-sans font-bold text-gold-600 uppercase mt-0.5 sm:mt-1 whitespace-nowrap">
                    Imitation Jewelry
                  </span>
                </div>
              </Link>

              {/* Inline links only from lg up: at tablet widths five tracked links plus the icons cannot fit */}
              <nav className="hidden lg:flex lg:gap-6 xl:gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className="text-primary font-bold text-[11px] xl:text-xs tracking-[0.15em] xl:tracking-[0.22em] uppercase whitespace-nowrap hover:text-gold-600 transition-all duration-300 relative group py-2 dark:text-gray-300 dark:hover:text-gold-400"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
                  </Link>
                ))}
              </nav>
            </div>
 
            {/* Right: Search, Wishlist, Cart, Profile */}
            <div className="flex items-center shrink-0 gap-0 sm:gap-2 lg:gap-3 xl:gap-5">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-primary hover:text-gold-600 transition-colors cursor-pointer dark:text-gray-300 dark:hover:text-gold-400"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
 
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-primary hover:text-gold-600 transition-colors cursor-pointer dark:text-gray-300 dark:hover:text-gold-400"
                aria-label="Search products"
              >
                <FiSearch size={20} />
              </button>
 
              {/* Profile */}
              <Link
                to={isAuthenticated ? "/account" : "/login"}
                className="p-2 text-primary hover:text-gold-600 transition-colors hidden sm:block dark:text-gray-300 dark:hover:text-gold-400"
                title="My Account"
              >
                <FiUser size={22} />
              </Link>
 
              {/* Wishlist (on phones it lives in the bottom navigation bar, which shows the same count) */}
              <Link
                to="/wishlist"
                className="p-2 text-primary hover:text-gold-600 transition-colors relative hidden sm:block dark:text-gray-300 dark:hover:text-gold-400"
                title="Wishlist"
              >
                <FiHeart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-gold-600 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center border border-white dark:border-[#100d07] animate-scale-up">
                    {wishlistCount}
                  </span>
                )}
              </Link>
 
              {/* Cart */}
              <Link
                to="/cart"
                className="p-2 text-primary hover:text-gold-600 transition-colors relative dark:text-gray-300 dark:hover:text-gold-400"
                title="Shopping Cart"
              >
                <FiShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary dark:bg-gold-600 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center border border-white dark:border-[#100d07] animate-scale-up">
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
        <div className="scroll-lock fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4 overflow-y-auto overscroll-contain animate-fade-in">
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 text-white/80 hover:text-gold-400 p-2 transition-colors duration-200 cursor-pointer"
            aria-label="Close search"
          >
            <FiX size={28} />
          </button>
          <div className="w-full max-w-2xl bg-white dark:bg-[#0a0907] p-6 sm:p-10 rounded-none shadow-2xl border border-gold-300/40 relative transform animate-scale-up">
            {/* Decorative Corner Brackets */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-gold-400/50"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-gold-400/50"></div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold mb-6 text-center text-primary dark:text-white tracking-wide">
              What are you looking for?
            </h3>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search necklaces, kundan sets, jhumkas, kada..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full border-b-2 border-gold-300/50 focus:border-gold-500 py-3 pl-2 pr-12 outline-none font-sans text-base sm:text-lg text-primary dark:text-white placeholder-gold-300/60 bg-transparent transition-colors duration-300"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gold-600 hover:text-gold-800 p-2 transition-colors duration-200 cursor-pointer"
              >
                <FiSearch size={26} />
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2 justify-center items-center">
              <span className="text-xs text-secondary dark:text-gold-300 font-bold tracking-wide uppercase mr-2">Trending:</span>
              {["Kundan Set", "Haram", "Chandelier Earrings", "Temple Jewelry"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    navigate(`/shop?search=${encodeURIComponent(term)}`);
                    setIsSearchOpen(false);
                  }}
                  className="text-xs text-primary dark:text-gray-300 bg-gold-50/50 dark:bg-gold-950/20 border border-gold-200/50 hover:border-gold-400 py-1.5 px-3 rounded-none transition-all duration-200 cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
 
      {/* Mobile Sliding Drawer Sidebar Menu.
          The wrapper clips the off-screen drawer and turns `invisible` once the slide-out
          finishes, so the hidden menu can't be tabbed into or widen the page. */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden lg:hidden transition-[visibility] duration-300 ${
          isMobileMenuOpen ? "visible scroll-lock" : "invisible pointer-events-none"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop for Mobile Menu */}
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        ></div>

      <div
        className={`absolute inset-y-0 left-0 w-[85vw] max-w-80 flex flex-col bg-white dark:bg-[#0a0907] shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gold-200/30 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gold-100/50 dark:border-gold-950/60 shrink-0">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col select-none">
            <span className="font-serif text-xl font-bold tracking-[0.1em] text-primary dark:text-white leading-none">
              SHAMBHAVI
            </span>
            <span className="text-[8px] tracking-[0.35em] font-bold text-gold-600 uppercase mt-1">
              Imitation Jewelry
            </span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-primary dark:text-gray-300 hover:text-gold-600 p-2 -mr-2 cursor-pointer"
            aria-label="Close menu"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain justify-between gap-6 py-6">
          <nav className="flex flex-col px-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-primary dark:text-gray-300 font-bold tracking-widest uppercase text-sm hover:text-gold-600 transition-colors py-2.5 border-b border-gold-50/10"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={isAuthenticated ? "/account" : "/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary dark:text-gray-300 font-bold tracking-widest uppercase text-sm hover:text-gold-600 transition-colors py-2.5 border-b border-gold-50/10 flex items-center justify-between"
            >
              <span>My Account</span>
              <FiUser size={18} className="text-gold-600" />
            </Link>
          </nav>
 
          <div className="px-6 border-t border-gold-100/40 dark:border-gold-950/60 pt-6">
            <p className="text-[10px] text-secondary dark:text-gold-300 font-bold tracking-widest uppercase mb-3">Customer Support</p>
            <a
              href={`https://wa.me/${settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : '917083874227'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 bg-[#20ba5a] hover:bg-[#1bb052] text-white font-bold text-xs tracking-widest uppercase transition-colors"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

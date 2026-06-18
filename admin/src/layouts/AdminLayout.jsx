import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import api from '../services/api';
import { 
  FiGrid, 
  FiShoppingBag, 
  FiFolder, 
  FiTruck, 
  FiUsers, 
  FiStar, 
  FiHeart, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiBell, 
  FiChevronDown, 
  FiUser,
  FiMail
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const res = await api.get('/admin/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
        setNotificationCount(res.count || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err.message);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds to fetch new items dynamically
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);


  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success("Admin session terminated securely.", { position: "bottom-center" });
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: FiGrid },
    { name: 'Products', path: '/products', icon: FiShoppingBag },
    { name: 'Categories', path: '/categories', icon: FiFolder },
    { name: 'Orders', path: '/orders', icon: FiTruck },
    { name: 'Customers', path: '/customers', icon: FiUsers },
    { name: 'Reviews', path: '/reviews', icon: FiStar },
    { name: 'Enquiries', path: '/enquiries', icon: FiMail },
    { name: 'Cart & Wishlist', path: '/cart-wishlist', icon: FiHeart },
    { name: 'Store Settings', path: '/settings', icon: FiSettings },
  ];

  // Helper to compile breadcrumbs
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return null;
    return paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      const isLast = index === paths.length - 1;
      const formattedName = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
      
      return (
        <React.Fragment key={url}>
          <span className="text-gold-400 mx-2">/</span>
          {isLast ? (
            <span className="text-secondary font-medium font-sans">{formattedName}</span>
          ) : (
            <Link to={url} className="hover:text-gold-600 transition-colors capitalize font-sans">{formattedName}</Link>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-secondary font-sans flex overflow-hidden">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gold-200/50 shadow-sm shrink-0">
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-center border-b border-gold-100 px-6">
          <Link to="/" className="text-center group">
            <span className="text-[10px] font-bold tracking-[0.4em] text-gold-600 uppercase block transition-all duration-300 group-hover:tracking-[0.45em]">
              SHAMBHAVI IMITATION
            </span>
            <span className="text-xs font-serif font-semibold tracking-widest text-primary uppercase block mt-0.5">
              Luxury Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-xs tracking-wider uppercase font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/5 text-gold-600 border-l-4 border-gold-500 shadow-[inset_1px_0_0_rgba(197,160,89,0.15)]'
                    : 'text-secondary/70 hover:text-primary hover:bg-[#faf9f5] border-l-4 border-transparent'
                }`}
              >
                <Icon className={`mr-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-gold-500' : 'text-gold-400'}`} size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-gold-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-[#FCFBF8] border border-gold-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs tracking-wider uppercase font-semibold text-secondary/80 transition-all duration-300 cursor-pointer"
          >
            <FiLogOut className="mr-3" size={16} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* 2. Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)}>
          <aside 
            className="w-72 bg-white h-full flex flex-col shadow-xl animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-20 flex items-center justify-between border-b border-gold-100 px-6">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase block">
                SHAMBHAVI IMITATION
              </span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gold-600 hover:text-primary transition-colors p-1"
              >
                <FiX size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3.5 text-xs tracking-wider uppercase font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-primary/5 text-gold-600 border-l-4 border-gold-500'
                        : 'text-secondary/70 hover:text-primary hover:bg-[#faf9f5] border-l-4 border-transparent'
                    }`}
                  >
                    <Icon className="mr-4 shrink-0 text-gold-500" size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gold-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 border border-red-200 text-xs tracking-wider uppercase font-semibold transition-all duration-300 cursor-pointer"
              >
                <FiLogOut className="mr-3" size={16} />
                Secure Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gold-200/50 flex items-center justify-between px-6 z-30 shadow-[0_1px_4px_rgba(240,235,220,0.3)] shrink-0">
          {/* Mobile Sidebar Trigger & Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gold-600 hover:text-primary transition-colors p-1"
            >
              <FiMenu size={22} />
            </button>
            <div className="hidden sm:flex items-center text-xs tracking-wider text-secondary/50 font-semibold uppercase">
              <Link to="/" className="hover:text-gold-600 transition-colors">Admin</Link>
              {getBreadcrumbs()}
            </div>
          </div>

          {/* Right Header Navigation Panel */}
          <div className="flex items-center space-x-5">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileDropdownOpen(false);
                }}
                className="relative p-2 bg-[#FAF8F2] border border-gold-200/60 rounded-full text-gold-600 hover:bg-gold-50 hover:text-gold-700 transition-all cursor-pointer shadow-sm"
              >
                <FiBell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-600 rounded-full border border-white animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gold-200 shadow-xl rounded-lg overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 bg-[#FAF8F2] border-b border-gold-100 flex justify-between items-center select-none">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-800">Notifications</span>
                    {notificationCount > 0 && (
                      <span className="text-[10px] font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded-full">
                        {notificationCount} New
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-gold-50 max-h-72 overflow-y-auto">
                    {notificationsLoading && notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-secondary/50 font-sans">
                        Loading notifications...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate(item.link);
                          }}
                          className="p-3.5 hover:bg-gold-50/15 transition-colors cursor-pointer text-left font-sans"
                        >
                          <p className="text-xs text-primary font-semibold m-0">{item.title}</p>
                          <p className="text-[11px] text-secondary/75 mt-0.5 leading-relaxed m-0">{item.message}</p>
                          <span className="text-[9px] text-secondary/50 block mt-1">
                            {new Date(item.time).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-secondary/50 font-sans">
                        No active alerts or enquiries.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center space-x-3 p-1.5 bg-[#FAF8F2] border border-gold-200/60 rounded-full hover:bg-gold-50 transition-all cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-gold-600 text-white flex items-center justify-center font-serif text-sm font-bold border border-gold-300">
                  {user && user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden md:block text-left pr-2">
                  <p className="text-xs font-bold text-primary tracking-wide leading-none">{user?.name || 'Administrator'}</p>
                  <p className="text-[9px] font-bold text-gold-600 uppercase tracking-wider mt-0.5">{user?.role || 'Admin'}</p>
                </div>
                <FiChevronDown className="text-gold-600 hidden md:block" size={14} />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-gold-200 shadow-xl rounded-lg overflow-hidden z-50 animate-fade-in">
                  <div className="p-3 border-b border-gold-100 bg-[#FAF8F2]">
                    <p className="text-xs font-bold text-primary truncate">{user?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-secondary/60 truncate">{user?.email || 'admin@shambhavi.com'}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-semibold text-secondary hover:bg-gold-50/50 hover:text-gold-600 transition-colors"
                    >
                      <FiUser className="mr-3 text-gold-500" size={14} />
                      Admin Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-semibold text-secondary hover:bg-gold-50/50 hover:text-gold-600 transition-colors"
                    >
                      <FiSettings className="mr-3 text-gold-500" size={14} />
                      Store Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <FiLogOut className="mr-3" size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Central Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

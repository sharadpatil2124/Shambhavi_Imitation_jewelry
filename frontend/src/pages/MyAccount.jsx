import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile, logoutUser } from '../store/authSlice';
import { clearCart } from '../store/cartSlice';
import { clearWishlist } from '../store/wishlistSlice';
import { FiShoppingBag, FiUser, FiMapPin, FiLogOut, FiEdit2, FiCheck, FiKey, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { generateRefundPDF } from '../utils/refundPdf';

export default function MyAccount() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Tabs state: "orders" or "profile"
  const [activeTab, setActiveTab] = useState("orders");

  // Profile Edit form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Email Change Verification States
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Real orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Sync edit states when user changes or editing opens
  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setStateName(user.state || "");
      setZipCode(user.zipCode || "");
    }
  }, [user, isEditing]);

  // Protect route
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user profile and order history on mount
  React.useEffect(() => {
    if (isAuthenticated) {
      // Fetch latest profile info from server
      api.get('/users/profile')
        .then(response => {
          if (response && response.success) {
            dispatch(updateProfile(response));
          }
        })
        .catch(err => {
          console.error("Failed to load user profile:", err);
        });

      // Fetch order history
      setOrdersLoading(true);
      api.get('/orders/my-orders')
        .then(response => {
          setOrders(response.orders || []);
        })
        .catch(err => {
          console.error("Failed to load orders:", err);
          toast.error(err.message || "Could not retrieve order history.");
        })
        .finally(() => {
          setOrdersLoading(false);
        });
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated || !user) return null;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/users/profile', {
        name,
        email,
        phone,
        address,
        city,
        state: stateName,
        zipCode
      });
      if (response && response.success) {
        dispatch(updateProfile(response));
        if (response.emailChangePending) {
          setPendingEmail(response.pendingEmail || email);
          setIsVerifyingEmail(true);
          toast.info(response.message || "A verification OTP has been sent to your new email address.", { position: "bottom-center" });
        } else {
          setIsEditing(false);
          toast.success("Profile details successfully updated!", { position: "bottom-center" });
        }
      } else {
        toast.error("Failed to update profile details.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile details.");
    }
  };

  const handleVerifyEmailChangeOtp = async (e) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.length !== 6) {
      toast.warning("Please enter a valid 6-digit OTP code.");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await api.post('/users/verify-email-change', { otp: emailOtp });
      if (response && response.success) {
        dispatch(updateProfile(response));
        setIsVerifyingEmail(false);
        setIsEditing(false);
        setEmailOtp("");
        toast.success(response.message || "Email address updated and verified successfully!", { position: "bottom-center" });
      } else {
        toast.error("Failed to verify the verification code.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error(err.message || "Invalid or expired verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(clearCart());
    dispatch(clearWishlist());
    toast.info("Logged out successfully.", { position: "bottom-center" });
    navigate('/login');
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt("Please state the reason for your cancellation request (required for Admin review):", "");
    if (reason === null) return;
    
    if (!reason.trim()) {
      toast.warning("Please provide a reason for cancelling your order.", { position: "bottom-center" });
      return;
    }

    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason: reason.trim() });
      if (response && response.success) {
        toast.success("Cancellation request submitted successfully! Pending admin approval.", { position: "bottom-center" });
        // Update order status in local state
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: 'Cancellation Requested', cancellationReason: reason.trim() } : o));
      } else {
        toast.error(response.message || "Failed to submit cancellation request.");
      }
    } catch (err) {
      console.error("Order cancellation error:", err);
      toast.error(err.message || "Failed to submit cancellation request.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="border-b border-gold-100 dark:border-gold-950/60 pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between select-none">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-primary dark:text-white m-0">
          My Account
        </h1>
        <span className="text-sm text-secondary dark:text-gray-300 font-medium mt-1 sm:mt-0">
          Welcome back, <strong className="text-gold-700 dark:text-gold-400 font-semibold">{user.name}</strong>
        </span>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Navigation Tabs Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-[#0c0a06] border border-gold-200/50 dark:border-gold-900/40 p-4 shadow-sm select-none">
          <div className="flex flex-col space-y-1">
            {/* Orders Tab */}
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center space-x-3 text-sm py-3.5 px-4 transition-all duration-200 text-left rounded-none cursor-pointer ${
                activeTab === "orders"
                  ? 'bg-gold-50 dark:bg-gold-950/20 border-l-2 border-gold-500 font-semibold text-gold-800 dark:text-gold-300'
                  : 'text-secondary dark:text-gray-300 hover:text-primary dark:hover:text-gold-400 hover:bg-gold-50/20 dark:hover:bg-gold-950/10'
              }`}
            >
              <FiShoppingBag size={16} className="text-gold-600" />
              <span>Order History</span>
            </button>

            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center space-x-3 text-sm py-3.5 px-4 transition-all duration-200 text-left rounded-none cursor-pointer ${
                activeTab === "profile"
                  ? 'bg-gold-50 dark:bg-gold-950/20 border-l-2 border-gold-500 font-semibold text-gold-800 dark:text-gold-300'
                  : 'text-secondary dark:text-gray-300 hover:text-primary dark:hover:text-gold-400 hover:bg-gold-50/20 dark:hover:bg-gold-950/10'
              }`}
            >
              <FiUser size={16} className="text-gold-600" />
              <span>Billing & Profile Settings</span>
            </button>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 text-sm py-3 px-4 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/25 transition-all duration-200 text-left rounded-none cursor-pointer border-t border-gray-100 dark:border-gold-950/60"
            >
              <FiLogOut size={16} />
              <span>Logout Account</span>
            </button>
          </div>
        </aside>

        {/* Right Side: Tab Contents Panel */}
        <div className="flex-grow w-full min-w-0 bg-white dark:bg-[#0c0a06] border border-gold-200/50 dark:border-gold-900/40 p-4 sm:p-8 shadow-sm relative">
          {/* Luxury Gold Corner Frames */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-gold-400/50 pointer-events-none z-10"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-gold-400/50 pointer-events-none z-10"></div>
          
          {/* Tab 1: Orders History */}
          {activeTab === "orders" && (
            <div className="relative z-20">
              <h3 className="font-serif text-lg font-bold text-primary dark:text-white tracking-wide mb-6 pb-2 border-b border-gold-100 dark:border-gold-950/60">
                Purchase Order History
              </h3>

              {ordersLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-secondary/60 dark:text-gray-400">Loading your purchase history...</p>
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-gold-200/50 dark:border-gold-900/40 bg-white dark:bg-[#100d07] p-4 sm:p-5 relative hover:border-gold-400 transition-colors shadow-xs"
                    >
                      {/* Order status headers */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gold-950/60 text-xs font-sans text-secondary dark:text-gray-300 font-medium">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span>Order Date: <strong>{new Date(order.createdAt).toLocaleDateString('en-IN')}</strong></span>
                          <span className="break-all">Order ID: <strong className="font-mono text-primary dark:text-gold-250">{order._id.substring(18).toUpperCase()}</strong></span>
                          <span>Method: <strong>{order.paymentMethod}</strong></span>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <span className={`inline-block font-semibold uppercase tracking-wider px-2.5 py-1 text-[9px] ${
                            order.orderStatus === "Delivered"
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/45 dark:text-green-400'
                              : order.orderStatus === "Shipped" || order.orderStatus === "Dispatched"
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-450'
                              : order.orderStatus === "Refunded"
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/45 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : order.orderStatus === "Cancelled"
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-400'
                              : order.orderStatus === "Cancellation Requested"
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-300 border border-amber-300'
                              : 'bg-gold-100 text-gold-700 dark:bg-gold-950/45 dark:text-gold-300'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Items Row inside Order */}
                      <div className="space-y-3.5 mb-4">
                        {order.orderItems?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center space-x-3 min-w-0">
                              <img src={item.image} alt={item.name} className="w-12 h-12 shrink-0 object-cover border border-gold-100 dark:border-gold-900/40" />
                              <div className="text-left min-w-0">
                                <span className="font-serif font-bold text-primary dark:text-white line-clamp-1">{item.name}</span>
                                <span className="text-xs text-secondary dark:text-gray-400 font-medium">Quantity: {item.quantity} | Price: ₹{item.price.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <span className="font-bold text-primary dark:text-white font-sans shrink-0">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order totals & Track link */}
                      <div className="border-t border-gray-100 dark:border-gold-950/60 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 text-xs min-w-0">
                          <span className="text-secondary dark:text-gray-450 font-medium shrink-0">SF Tracking:</span>
                          <span className="font-mono text-primary dark:text-white font-bold break-all">{order.trackingNumber || order.trackingId || 'Pending'}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                          <span className="text-sm font-sans font-medium text-secondary dark:text-gray-300 w-full sm:w-auto">
                            Total: <strong className="text-gold-700 dark:text-gold-400 font-bold text-base">₹{order.totalPrice.toLocaleString('en-IN')}</strong>
                          </span>
                          {(order.orderStatus === 'Refunded' || order.isRefunded) && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-xs border border-purple-200 dark:border-purple-800">
                                Refund: ₹{(order.refundAmount || order.totalPrice).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => generateRefundPDF(order)}
                                className="inline-flex items-center space-x-1 text-purple-700 dark:text-purple-300 hover:text-white hover:bg-purple-700 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                title="Download Official Refund Receipt PDF"
                              >
                                <FiPrinter size={11} />
                                <span>Refund PDF</span>
                              </button>
                            </div>
                          )}
                          {order.orderStatus !== 'Delivered' && 
                           order.orderStatus !== 'Dispatched' && 
                           order.orderStatus !== 'Shipped' && 
                           order.orderStatus !== 'Cancelled' && 
                           order.orderStatus !== 'Refunded' && 
                           order.orderStatus !== 'Cancellation Requested' && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="border border-red-300 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 hover:text-red-750 font-bold py-2.5 px-4 text-[10px] tracking-widest uppercase transition-colors cursor-pointer animate-fade-in"
                            >
                              Cancel Order
                            </button>
                          )}
                          <Link
                            to={`/tracking?orderId=${order._id}`}
                            className="bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-2.5 px-4 text-[10px] tracking-widest uppercase transition-colors border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
                          >
                            Track Shipment
                          </Link>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center select-none">
                  <p className="text-secondary dark:text-gray-300 text-sm font-sans mb-6">You haven't placed any luxury orders yet.</p>
                  <Link
                    to="/shop"
                    className="inline-block bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
                  >
                    Start Shopping Catalog
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Profile Settings */}
          {activeTab === "profile" && (
            <div className="relative z-20">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-2 mb-6 border-b border-gold-100 dark:border-gold-950/60">
                <h3 className="font-serif text-lg font-bold text-primary dark:text-white tracking-wide">
                  Billing & Profile Settings
                </h3>
                
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gold-600 hover:text-gold-550 dark:text-gold-400 font-bold uppercase tracking-wider flex items-center space-x-1.5 py-1.5 cursor-pointer"
                  >
                    <FiEdit2 size={12} />
                    <span>Edit Profile Details</span>
                  </button>
                )}
              </div>

              {isVerifyingEmail ? (
                <form onSubmit={handleVerifyEmailChangeOtp} className="space-y-5">
                  <div className="bg-gold-50/10 dark:bg-gold-950/10 border border-gold-200/50 dark:border-gold-900/40 p-4 sm:p-6 relative">
                    <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-gold-400/50 pointer-events-none z-10"></div>
                    <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-gold-400/50 pointer-events-none z-10"></div>
                    
                    <h4 className="font-serif text-base font-bold text-primary dark:text-white mb-2 relative z-20">Verify Your New Email</h4>
                    <p className="text-sm text-secondary dark:text-gray-300 mb-6 leading-relaxed relative z-20">
                      We have sent a 6-digit verification code to <strong className="text-primary dark:text-gold-200 font-semibold break-all">{pendingEmail}</strong>.
                      Please enter it below to complete your email address update.
                    </p>

                    <div className="space-y-2 relative z-20">
                      <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider">Verification OTP</label>
                      <div className="relative w-full max-w-[220px]">
                        <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 pl-12 pr-4 text-sm font-sans tracking-[0.2em] font-mono focus:border-gold-500 text-primary dark:text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 select-none">
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center space-x-1.5 border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
                    >
                      {otpLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Verify & Update Email"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerifyingEmail(false);
                        setEmailOtp("");
                      }}
                      className="border border-gold-200 dark:border-gold-900 hover:bg-gray-50 dark:hover:bg-[#100d07] text-secondary dark:text-gold-300 font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </form>
              ) : isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Customer Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter Email Address"
                        className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Mobile Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Billing / Shipping Address</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">State</label>
                          <input
                            type="text"
                            required
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-3 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Pincode</label>
                          <input
                            type="text"
                            required
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-3 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 select-none">
                    <button
                      type="submit"
                      className="bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center space-x-1.5 border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
                    >
                      <FiCheck size={14} />
                      <span>Save Profile Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="border border-gold-200 dark:border-gold-900 hover:bg-gray-50 dark:hover:bg-[#100d07] text-secondary dark:text-gold-300 font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-sm font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-[#faf9f6]/45 dark:bg-[#100d07]/40 p-4 sm:p-5 border border-gold-100/30 dark:border-gold-900/30">
                    <div>
                      <span className="text-[10px] text-secondary dark:text-gray-400 font-bold uppercase tracking-wider block mb-1">Full Name</span>
                      <strong className="text-primary dark:text-white font-semibold text-base block">{user.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary dark:text-gray-400 font-bold uppercase tracking-wider block mb-1">Email Address</span>
                      <strong className="text-primary dark:text-white font-semibold text-base block break-all">{user.email}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary dark:text-gray-400 font-bold uppercase tracking-wider block mb-1">Phone Number</span>
                      <strong className="text-primary dark:text-white font-semibold text-base block">{user.phone || "Not provided"}</strong>
                    </div>
                  </div>

                  <div className="border-t border-gold-100 dark:border-gold-950/60 pt-6">
                    <h4 className="font-serif text-sm font-bold text-primary dark:text-white mb-3 flex items-center space-x-2">
                      <FiMapPin className="text-gold-600" />
                      <span>Billing & Delivery Address</span>
                    </h4>
                    {user.address ? (
                      <p className="text-secondary dark:text-gray-300 font-medium leading-relaxed bg-[#faf9f6]/40 dark:bg-[#100d07]/30 p-4 border border-gold-100/30 dark:border-gold-900/30">
                        {user.address}, {user.city}, {user.state} - {user.zipCode}, India
                      </p>
                    ) : (
                      <p className="text-secondary italic dark:text-gray-400">No address set yet. Edit profile to save delivery coordinates.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

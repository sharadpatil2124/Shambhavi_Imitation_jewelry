import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile, logoutUser } from '../store/authSlice';
import { clearCart } from '../store/cartSlice';
import { clearWishlist } from '../store/wishlistSlice';
import { FiShoppingBag, FiUser, FiMapPin, FiLogOut, FiEdit2, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

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
        setIsEditing(false);
        toast.success("Profile details successfully updated!", { position: "bottom-center" });
      } else {
        toast.error("Failed to update profile details.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile details.");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(clearCart());
    dispatch(clearWishlist());
    toast.info("Logged out successfully.", { position: "bottom-center" });
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="border-b border-gold-100 pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between select-none">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0">
          My Account
        </h1>
        <span className="text-sm text-secondary font-medium mt-1 sm:mt-0">
          Welcome back, <strong className="text-gold-700 font-semibold">{user.name}</strong>
        </span>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Navigation Tabs Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white border border-gold-200/60 p-4 shadow-sm select-none">
          <div className="flex flex-col space-y-1">
            {/* Orders Tab */}
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center space-x-3 text-sm py-3 px-4 transition-all duration-200 text-left rounded-none cursor-pointer ${
                activeTab === "orders"
                  ? 'bg-gold-50 border-l-2 border-gold-500 font-semibold text-gold-800'
                  : 'text-secondary hover:text-primary hover:bg-gold-50/20'
              }`}
            >
              <FiShoppingBag size={16} className="text-gold-600" />
              <span>Order History</span>
            </button>

            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center space-x-3 text-sm py-3 px-4 transition-all duration-200 text-left rounded-none cursor-pointer ${
                activeTab === "profile"
                  ? 'bg-gold-50 border-l-2 border-gold-500 font-semibold text-gold-800'
                  : 'text-secondary hover:text-primary hover:bg-gold-50/20'
              }`}
            >
              <FiUser size={16} className="text-gold-600" />
              <span>Billing & Profile Settings</span>
            </button>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 text-sm py-3 px-4 text-red-600 hover:bg-red-50 transition-all duration-200 text-left rounded-none cursor-pointer border-t border-gray-100"
            >
              <FiLogOut size={16} />
              <span>Logout Account</span>
            </button>
          </div>
        </aside>

        {/* Right Side: Tab Contents Panel */}
        <div className="flex-grow w-full bg-white border border-gold-200/60 p-6 sm:p-8 shadow-sm">
          
          {/* Tab 1: Orders History */}
          {activeTab === "orders" && (
            <div>
              <h3 className="font-serif text-lg font-bold text-primary tracking-wide mb-6 pb-2 border-b border-gold-100">
                Purchase Order History
              </h3>

              {ordersLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-secondary/60">Loading your purchase history...</p>
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-gold-200/50 p-4 sm:p-5 relative hover:border-gold-400 transition-colors shadow-xs"
                    >
                      {/* Order status headers */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-100 text-xs font-sans text-secondary font-medium">
                        <div className="flex flex-wrap gap-4">
                          <span>Order Date: <strong>{new Date(order.createdAt).toLocaleDateString('en-IN')}</strong></span>
                          <span>Order ID: <strong className="font-mono text-primary">{order._id.substring(18).toUpperCase()}</strong></span>
                          <span>Method: <strong>{order.paymentMethod}</strong></span>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <span className={`inline-block font-semibold uppercase tracking-wider px-2.5 py-1 text-[9px] ${
                            order.orderStatus === "Delivered"
                              ? 'bg-green-100 text-green-700'
                              : order.orderStatus === "Shipped" || order.orderStatus === "Dispatched"
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gold-100 text-gold-700'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Items Row inside Order */}
                      <div className="space-y-3.5 mb-4">
                        {order.orderItems?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-3 max-w-[80%]">
                              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover border border-gold-100" />
                              <div className="text-left">
                                <span className="font-serif font-bold text-primary line-clamp-1">{item.name}</span>
                                <span className="text-xs text-secondary font-medium">Quantity: {item.quantity} | Price: ₹{item.price.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <span className="font-bold text-primary font-sans">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order totals & Track link */}
                      <div className="border-t border-gray-100 pt-3.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-secondary font-medium">SF Tracking:</span>
                          <span className="font-mono text-primary font-bold">{order.trackingNumber || order.trackingId || 'Pending'}</span>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-sans font-medium text-secondary">
                            Total: <strong className="text-gold-700 font-bold text-base">₹{order.totalPrice.toLocaleString('en-IN')}</strong>
                          </span>
                          <Link
                            to={`/tracking?orderId=${order._id}`}
                            className="bg-primary hover:bg-gold-500 text-white font-bold py-2 px-4 text-[10px] tracking-widest uppercase transition-colors"
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
                  <p className="text-secondary text-sm font-sans mb-6">You haven't placed any luxury orders yet.</p>
                  <Link
                    to="/shop"
                    className="inline-block bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors"
                  >
                    Start Shopping Catalog
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Profile Settings */}
          {activeTab === "profile" && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-6 border-b border-gold-100">
                <h3 className="font-serif text-lg font-bold text-primary tracking-wide">
                  Billing & Profile Settings
                </h3>
                
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gold-600 hover:text-gold-700 font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FiEdit2 size={12} />
                    <span>Edit Profile Details</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Customer Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Mobile Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Billing / Shipping Address</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                      />
                    </div>

                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">State</label>
                          <input
                            type="text"
                            required
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-3 text-sm font-sans focus:border-gold-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Pincode</label>
                          <input
                            type="text"
                            required
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-3 text-sm font-sans focus:border-gold-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 select-none">
                    <button
                      type="submit"
                      className="bg-primary hover:bg-gold-500 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <FiCheck size={14} />
                      <span>Save Profile Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="border border-gray-200 hover:bg-gray-50 text-secondary font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-sm font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#faf9f6]/40 p-5 border border-gold-100/30">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-1">Full Name</span>
                      <strong className="text-primary font-semibold text-base block">{user.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-1">Email Address</span>
                      <strong className="text-primary font-semibold text-base block">{user.email}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-1">Phone Number</span>
                      <strong className="text-primary font-semibold text-base block">{user.phone || "Not provided"}</strong>
                    </div>
                  </div>

                  <div className="border-t border-gold-100 pt-6">
                    <h4 className="font-serif text-sm font-bold text-primary mb-3 flex items-center space-x-2">
                      <FiMapPin className="text-gold-600" />
                      <span>Billing & Delivery Address</span>
                    </h4>
                    {user.address ? (
                      <p className="text-secondary font-medium leading-relaxed bg-[#faf9f6]/40 p-4 border border-gold-100/30">
                        {user.address}, {user.city}, {user.state} - {user.zipCode}, India
                      </p>
                    ) : (
                      <p className="text-secondary italic">No address set yet. Edit profile to save delivery coordinates.</p>
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

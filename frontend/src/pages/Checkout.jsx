import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiChevronRight, FiCreditCard, FiTruck, FiMapPin, FiPhone } from 'react-icons/fi';
import { clearCart } from '../store/cartSlice';
import { addOrder } from '../store/authSlice';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getImageUrl } from '../utils/image';


export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartState = useSelector((state) => state.cart);
  const cartItems = cartState.items;
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // Set initial payment method based on settings
  useEffect(() => {
    if (settings) {
      if (settings.onlinePaymentEnabled !== false) {
        setPaymentMethod("UPI");
      } else if (settings.codEnabled !== false) {
        setPaymentMethod("COD");
      }
    }
  }, [settings]);

  // Success screen state
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState(null);

  // Autofill if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setStateName(user.state || "");
      setZipCode(user.zipCode || "");
    }
  }, [isAuthenticated, user]);

  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState("");

  // Load and calculate discount dynamically
  useEffect(() => {
    const storedCode = localStorage.getItem("appliedPromoCode");
    const activeCoupon = settings?.specialOfferCouponCode || "SHAMBHAVI10";
    const discountPct = settings?.specialOfferDiscountPercentage || 10;
    
    if (storedCode && storedCode.toUpperCase() === activeCoupon.toUpperCase()) {
      setAppliedPromoCode(storedCode);
      const discountVal = Math.round(cartState.subtotal * (discountPct / 100));
      setAppliedDiscount(discountVal);
    } else {
      setAppliedPromoCode("");
      setAppliedDiscount(0);
    }
  }, [cartState.subtotal, settings]);

  const handleApplyPromoCode = (e) => {
    e.preventDefault();
    const activeCoupon = settings?.specialOfferCouponCode || "SHAMBHAVI10";
    const discountPct = settings?.specialOfferDiscountPercentage || 10;

    if (!promoCodeInput.trim()) {
      toast.warning("Please enter a promo code.", { position: "bottom-center" });
      return;
    }

    if (promoCodeInput.trim().toUpperCase() === activeCoupon.toUpperCase()) {
      localStorage.setItem("appliedPromoCode", promoCodeInput.trim().toUpperCase());
      setAppliedPromoCode(promoCodeInput.trim().toUpperCase());
      const discountVal = Math.round(cartState.subtotal * (discountPct / 100));
      setAppliedDiscount(discountVal);
      toast.success(`✨ Coupon code "${promoCodeInput.trim().toUpperCase()}" applied successfully! You got a ${discountPct}% discount.`, { position: "bottom-center" });
      setPromoCodeInput("");
    } else {
      toast.error(`Invalid coupon code. Try '${activeCoupon}' for ${discountPct}% off!`, { position: "bottom-center" });
    }
  };

  const handleRemovePromoCode = () => {
    localStorage.removeItem("appliedPromoCode");
    setAppliedPromoCode("");
    setAppliedDiscount(0);
    toast.info("Promo code removed.", { position: "bottom-center" });
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to place an order.");
      navigate('/login?redirect=checkout');
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty. Cannot place order.");
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim() || !stateName.trim() || !zipCode.trim()) {
      toast.warning("Please complete all shipping address fields.");
      return;
    }

    // 1. Recipient Name Validation (Only letters and spaces, min 3 characters)
    if (name.trim().length < 3) {
      toast.warning("Recipient's Full Name must be at least 3 characters long.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      toast.warning("Recipient's Full Name can only contain letters and spaces.");
      return;
    }

    // 2. Email Address Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.warning("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    // 3. Mobile Phone Number Validation (Standard 10-digit format)
    const cleanPhone = phone.replace(/\D/g, '');
    const isValidPhone = cleanPhone.length === 10 || (cleanPhone.length === 12 && cleanPhone.startsWith('91'));
    if (!isValidPhone) {
      toast.warning("Please enter a valid 10-digit mobile phone number (e.g. 7083874227).");
      return;
    }

    // 4. Street Address Validation (Min 6 characters to prevent dummy data)
    if (address.trim().length < 6) {
      toast.warning("Please enter a descriptive Street Address (minimum 6 characters).");
      return;
    }

    // 5. City Validation (Only letters and spaces, min 2 characters)
    if (city.trim().length < 2) {
      toast.warning("Please enter a valid City name (minimum 2 characters).");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(city.trim())) {
      toast.warning("City name can only contain letters and spaces.");
      return;
    }

    // 6. State Validation (Only letters and spaces, min 2 characters)
    if (stateName.trim().length < 2) {
      toast.warning("Please enter a valid State name (minimum 2 characters).");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(stateName.trim())) {
      toast.warning("State name can only contain letters and spaces.");
      return;
    }

    // 7. Zip/Pincode Validation (Indian standard 6-digit code)
    if (!/^\d{6}$/.test(zipCode.trim())) {
      toast.warning("Please enter a valid 6-digit PIN/Zip code (e.g. 500033).");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const orderTotal = cartState.subtotal + cartState.shipping - appliedDiscount;
    const orderItems = cartItems.map(item => ({
      product: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      color: item.selectedColor,
      size: item.selectedSize
    }));

    const itemsPrice = cartState.subtotal;
    const shippingPrice = cartState.shipping;
    const taxPrice = Math.round(cartState.subtotal * ((cartState.taxRate || 3) / 100));
    const totalPrice = orderTotal;

    const shippingAddress = {
      street: address,
      city,
      state: stateName,
      pincode: zipCode,
      phone,
      email
    };

    // --- COD Flow (direct order) ---
    if (paymentMethod === 'COD') {
      try {
        const response = await api.post('/orders', {
          orderItems,
          shippingAddress,
          paymentMethod: 'COD',
          itemsPrice: itemsPrice - taxPrice,
          taxPrice,
          shippingPrice,
          discountPrice: appliedDiscount,
          totalPrice
        });
        const order = response.order;
        handleOrderSuccess(order);
      } catch (err) {
        toast.error(err.message || "Failed to place order. Please try again.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // --- Razorpay Flow (UPI / Card) ---
    try {
      // 1. Fetch Razorpay public key
      const keyRes = await api.get('/payments/key');
      const razorpayKey = keyRes.key;

      // 2. Create a Razorpay order on the backend
      const razorpayOrderRes = await api.post('/payments/order', { amount: totalPrice });
      const { id: razorpayOrderId, amount: razorpayAmount, currency } = razorpayOrderRes;

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: razorpayKey,
        amount: razorpayAmount,
        currency: currency,
        name: 'Shambhavi Imitation Jewelry',
        description: `Order Payment - ${orderItems.length} item(s)`,
        order_id: razorpayOrderId,
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: '#8B7355'
        },
        handler: async function (paymentResponse) {
          // Payment successful — now create the order in our backend
          try {
            const orderRes = await api.post('/orders', {
              orderItems,
              shippingAddress,
              paymentMethod: 'Razorpay',
              itemsPrice: itemsPrice - taxPrice,
              taxPrice,
              shippingPrice,
              discountPrice: appliedDiscount,
              totalPrice,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
              isPaid: true
            });
            const order = orderRes.order;

            // Verify the payment signature on backend
            await api.post('/payments/verify', {
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
              orderId: order._id
            });

            handleOrderSuccess(order);
          } catch (err) {
            toast.error(err.message || "Order creation failed after payment. Contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.info("Payment cancelled. You can try again.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setIsProcessing(false);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err) {
      setIsProcessing(false);
      toast.error(err.message || "Failed to initiate payment. Please try again.");
    }
  };

  const handleOrderSuccess = (order) => {
    setCreatedOrderDetails({
      id: order._id,
      trackingId: order.trackingNumber || order.trackingId || 'Pending Allocation',
      total: order.totalPrice,
      name: order.shippingAddress.name || name,
      address: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      paymentMethod: order.paymentMethod,
      estDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString()
    });
    
    // Clear cart in Redux
    dispatch(clearCart());
    localStorage.removeItem("appliedPromoCode");

    toast.success("🎉 Order successfully placed! Thank you for shopping with Shambhavi.", { position: "bottom-center" });
    setIsOrderCompleted(true);
  };


  if (isOrderCompleted && createdOrderDetails) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center select-none animate-fade-in text-left">
        <div className="bg-white border border-gold-200 p-8 sm:p-12 shadow-md">
          <div className="flex flex-col items-center text-center mb-8 border-b border-gold-100 pb-8">
            <FiCheckCircle className="text-green-600 mb-4" size={60} />
            <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-2">ORDER PLACED SUCCESSFULLY</span>
            <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0 mb-3">
              Thank You for Your Order!
            </h1>
            <p className="text-secondary text-sm font-sans max-w-sm leading-relaxed">
              We are now preparing your handcrafted luxury jewelry masterpiece. A confirmation invoice has been sent to your email.
            </p>
          </div>

          <div className="space-y-6 text-sm font-sans">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-gray-50 pb-2">Order Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">Order ID</span>
                <strong className="text-primary font-mono text-base font-bold">{createdOrderDetails.id}</strong>
              </div>
              <div>
                <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">SF Express Tracking ID</span>
                <strong className="text-primary font-mono text-base font-bold">{createdOrderDetails.trackingId}</strong>
              </div>
              <div>
                <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">Estimated Delivery</span>
                <strong className="text-gold-700 font-bold">{createdOrderDetails.estDelivery}</strong>
              </div>
              <div>
                <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">Grand Total Paid</span>
                <strong className="text-primary font-bold">₹{createdOrderDetails.total.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="border-t border-gold-100 pt-6">
              <span className="text-xs text-secondary font-semibold uppercase tracking-wider block mb-1">Shipping Destination Address</span>
              <p className="text-primary font-medium leading-relaxed">{createdOrderDetails.name}, {createdOrderDetails.address}</p>
            </div>

            <div className="border-t border-gold-100 pt-6">
              <span className="text-xs text-secondary font-semibold uppercase tracking-wider block mb-1">Chosen Payment Channel</span>
              <p className="text-primary font-semibold flex items-center"><FiCreditCard className="mr-2 text-gold-600" /> {createdOrderDetails.paymentMethod} (Authorized Securely)</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
            <Link
              to="/tracking"
              className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-4 px-6 text-xs tracking-widest uppercase transition-colors text-center"
            >
              Track Order Progress
            </Link>
            <Link
              to="/shop"
              className="w-full bg-white hover:bg-gold-50 border border-gold-300 text-gold-700 font-bold py-4 px-6 text-xs tracking-widest uppercase transition-colors text-center"
            >
              Continue Jewelry Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left">
      {/* Page Header */}
      <div className="border-b border-gold-100 pb-4 mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0">Secure Checkout</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white border border-gold-200/50 p-12 sm:p-20 text-center select-none">
          <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-3 text-primary">No Items to Check Out</h3>
          <p className="text-secondary text-sm font-sans mb-8 max-w-sm mx-auto">
            Your shopping cart is currently empty. Add luxury jewelry pieces before proceeding to payment.
          </p>
          <Link
            to="/shop"
            className="bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-colors"
          >
            Start Shopping Catalog
          </Link>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side: Shipping & Billing Forms */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* Panel 1: Shipping Destination Address */}
            <div className="bg-white border border-gold-200/60 p-6 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-primary tracking-wide mb-6 pb-2 border-b border-gold-100 flex items-center space-x-2">
                <FiMapPin className="text-gold-600" />
                <span>Shipping Address</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Recipient's Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
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
                    placeholder="Enter email address"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Mobile Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 outline-none"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Street Address & Apartment</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat 402, Golden Heights, Jubilee Hills Rd No. 36"
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
                    placeholder="Hyderabad"
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
                        placeholder="Telangana"
                        className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-3 text-sm font-sans focus:border-gold-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Zip/Pincode</label>
                      <input
                        type="text"
                        required
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="500033"
                        className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-3 text-sm font-sans focus:border-gold-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Secure Payment Channel Selection */}
            <div className="bg-white border border-gold-200/60 p-6 shadow-sm select-none">
              <h3 className="font-serif text-lg font-bold text-primary tracking-wide mb-6 pb-2 border-b border-gold-100 flex items-center space-x-2">
                <FiCreditCard className="text-gold-600" />
                <span>Payment Method</span>
              </h3>

              <div className="space-y-3">
                {[
                  { id: "UPI", title: "Instant UPI (GPay/PhonePe)", desc: "Quick and secure checkout via UPI QR code or mobile VPA.", enabled: settings?.onlinePaymentEnabled !== false },
                  { id: "CARD", title: "Credit / Debit Card", desc: "Pay securely via Visa, Mastercard, RuPay, or Amex gateways.", enabled: settings?.onlinePaymentEnabled !== false },
                  { id: "COD", title: "Cash on Delivery (COD)", desc: "Pay securely in cash at the time of courier hand-delivery.", enabled: settings?.codEnabled !== false }
                ].filter(pm => pm.enabled).map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-start p-4 border transition-all duration-200 cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'border-gold-500 bg-gold-50/20'
                        : 'border-gray-200 hover:border-gold-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.id}
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="mt-1 mr-4 accent-gold-600 cursor-pointer"
                    />
                    <div className="text-left">
                      <span className="font-serif text-sm font-bold text-primary block">{pm.title}</span>
                      <span className="text-xs text-secondary font-medium leading-relaxed mt-0.5 block">{pm.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Right Side: Order Review Panel */}
          <aside className="w-full lg:w-1/3 bg-white border border-gold-200/60 p-6 shadow-sm sticky top-28 select-none">
            <h3 className="font-serif text-lg font-bold text-primary tracking-wide mb-6 pb-3 border-b border-gold-100">
              Order Review
            </h3>

            {/* List items mini-grid */}
            <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto pr-2 mb-6">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="py-3 flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center space-x-3 max-w-[70%]">
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-10 h-10 border border-gold-100 object-cover flex-shrink-0" />
                    <div className="text-left">
                      <span className="font-serif font-bold text-primary line-clamp-1">{item.name}</span>
                      <span className="text-secondary text-[10px] font-medium">Qty: {item.quantity} | {item.selectedColor}</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* Promo Code Application */}
            <div className="border-t border-gold-100 pt-4 mb-5">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Promo Code</label>
              {!appliedPromoCode ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder={`Try '${settings?.specialOfferCouponCode || "SHAMBHAVI10"}'`}
                    className="flex-grow bg-[#faf9f6] border border-gold-300 py-2.5 px-3 text-xs tracking-wider outline-none uppercase font-mono focus:border-gold-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    className="bg-primary hover:bg-gold-500 text-white font-bold py-2.5 px-4 text-xs tracking-widest uppercase transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50/40 border border-green-100 p-2.5">
                  <span className="text-xs text-green-700 font-semibold uppercase tracking-wider">
                    ✓ Code Applied: {appliedPromoCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemovePromoCode}
                    className="text-red-600 hover:text-red-800 text-[10px] font-bold tracking-wider uppercase"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Financial breakdown */}
            <div className="space-y-3.5 text-xs font-sans text-secondary font-medium border-t border-gold-100 pt-4 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-primary font-bold">₹{cartState.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                {cartState.shipping === 0 ? (
                  <span className="text-green-600 font-bold uppercase tracking-wider">Free Shipping</span>
                ) : (
                  <span className="text-primary font-bold">₹{cartState.shipping.toLocaleString('en-IN')}</span>
                )}
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold items-center bg-green-50/50 p-1.5">
                  <span className="flex items-center">Promo Discount ({appliedPromoCode})</span>
                  <span>-₹{appliedDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-gold-100 pt-3.5 flex justify-between text-sm text-primary font-bold">
                <span>Grand Total</span>
                <span className="text-gold-700 font-extrabold text-base">₹{(cartState.subtotal + cartState.shipping - appliedDiscount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full font-bold py-4 px-6 text-xs tracking-widest uppercase transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-gold-600 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <FiTruck size={15} />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>

            <div className="mt-6 flex flex-col items-center space-y-2 text-center">
              <span className="text-[10px] text-secondary font-medium tracking-wide">
                🔒 256-bit Secure Encrypted Connection.
              </span>
              <span className="text-[9px] text-gold-600 font-semibold tracking-wide uppercase">
                Free standard courier dispatch within 24 hours.
              </span>
            </div>

          </aside>

        </form>
      )}
    </div>
  );
}

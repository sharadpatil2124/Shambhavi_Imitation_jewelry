import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiArrowLeft, FiTag } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { getImageUrl } from '../utils/image';
import { updateQuantity, removeFromCart, clearCart } from '../store/cartSlice';
import { toast } from 'react-toastify';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartState = useSelector((state) => state.cart);
  const { settings } = useSelector((state) => state.settings);
  const cartItems = cartState.items;

  // Coupon state
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in Rupees
  const [appliedPromoCode, setAppliedPromoCode] = useState("");

  // Dynamically load/recalculate discount when subtotal or settings changes
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

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const activeCoupon = settings?.specialOfferCouponCode || "SHAMBHAVI10";
    const discountPct = settings?.specialOfferDiscountPercentage || 10;

    if (promoCode.trim().toUpperCase() === activeCoupon.toUpperCase()) {
      const discountVal = Math.round(cartState.subtotal * (discountPct / 100));
      setAppliedDiscount(discountVal);
      setAppliedPromoCode(activeCoupon);
      localStorage.setItem("appliedPromoCode", activeCoupon);
      setPromoCode("");
      toast.success(`✨ Promo code '${activeCoupon}' successfully applied! ${discountPct}% discount added.`, { position: "bottom-center" });
    } else if (promoCode.trim() === "") {
      toast.warning("Please enter a valid coupon code.", { position: "bottom-center" });
    } else {
      toast.error(`Invalid coupon code. Try '${activeCoupon}' for ${discountPct}% off!`, { position: "bottom-center" });
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(0);
    setAppliedPromoCode("");
    localStorage.removeItem("appliedPromoCode");
    toast.info("Promo code removed.", { position: "bottom-center" });
  };

  const handleCheckoutOnWhatsApp = () => {
    const whatsappNumber = settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : "917083874227";
    let cartListText = "";
    cartItems.forEach((item, index) => {
      cartListText += `${index + 1}. *${item.name}* (Color: ${item.selectedColor}, Size: ${item.selectedSize}) - Qty: ${item.quantity} x ₹${item.price.toLocaleString('en-IN')}\n`;
    });

    const finalValue = cartState.subtotal + cartState.shipping - appliedDiscount;
    const text = `Hello Shambhavi Imitation! I would like to order the following items from my cart:\n\n${cartListText}\n*Subtotal:* ₹${cartState.subtotal.toLocaleString('en-IN')}\n*Shipping:* ${cartState.shipping === 0 ? 'FREE' : `₹${cartState.shipping}`}\n${appliedPromoCode ? `*Discount (Code: ${appliedPromoCode}):* -₹${appliedDiscount.toLocaleString('en-IN')}\n` : ''}*Total Payable:* ₹${finalValue.toLocaleString('en-IN')}\n\nPlease help me complete this order. Thank you!`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedText}`, '_blank');
  };

  const grandTotal = cartState.subtotal + cartState.shipping - appliedDiscount;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center select-none animate-fade-in">
        <div className="flex flex-col items-center max-w-sm mx-auto">
          <div className="w-20 h-20 bg-gold-50 border border-gold-200/50 rounded-full flex items-center justify-center text-gold-600 mb-6">
            <FiShoppingBag size={32} />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary mb-3">Your Cart is Empty</h2>
          <p className="text-secondary text-sm font-sans mb-8 leading-relaxed">
            Your shopping cart is currently blank. Explore our collections and add beautiful handmade items to start your luxury journey.
          </p>
          <Link
            to="/shop"
            className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-4 px-6 text-xs tracking-widest uppercase transition-colors"
          >
            Start Shopping Catalog
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
          Shopping Cart ({cartItems.length} items)
        </h1>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Cart Items List */}
        <div className="w-full lg:w-2/3 space-y-4">
          {cartItems.map((item) => (
            <div
              key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
              className="flex flex-col sm:flex-row items-center border border-gold-200/60 bg-white p-4 sm:p-5 gap-4 relative shadow-xs"
            >
              
              {/* Product Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#faf9f6] border border-gold-100 flex-shrink-0">
                <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
              </div>

              {/* Product Info */}
              <div className="flex-grow text-center sm:text-left space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gold-600">
                  {item.category}
                </span>
                <Link
                  to={`/product/${item.id}`}
                  className="font-serif text-sm sm:text-base font-bold text-primary hover:text-gold-600 transition-colors block line-clamp-1"
                >
                  {item.name}
                </Link>
                <div className="flex flex-wrap gap-x-4 justify-center sm:justify-start text-xs text-secondary font-medium">
                  <span>Color: <strong className="text-primary font-semibold">{item.selectedColor}</strong></span>
                  <span>Size: <strong className="text-primary font-semibold">{item.selectedSize}</strong></span>
                </div>
              </div>

              {/* Quantity Changer */}
              <div className="flex items-center border border-gold-300 bg-white select-none">
                <button
                  onClick={() => dispatch(updateQuantity({ ...item, quantity: item.quantity - 1 }))}
                  className="px-2.5 py-1.5 text-secondary hover:text-gold-600 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <FiMinus size={12} />
                </button>
                <span className="w-8 text-center font-sans font-bold text-xs text-primary">
                  {item.quantity}
                </span>
                <button
                  onClick={() => dispatch(updateQuantity({ ...item, quantity: item.quantity + 1 }))}
                  className="px-2.5 py-1.5 text-secondary hover:text-gold-600 transition-colors"
                  aria-label="Increase quantity"
                >
                  <FiPlus size={12} />
                </button>
              </div>

              {/* Price & Trash */}
              <div className="flex flex-col sm:items-end justify-center text-center sm:text-right min-w-[100px]">
                <span className="font-sans text-sm sm:text-base font-bold text-primary">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-secondary font-medium mt-0.5">
                  (₹{item.price.toLocaleString('en-IN')} each)
                </span>
              </div>

              {/* Trash Button */}
              <button
                onClick={() => {
                  dispatch(removeFromCart(item));
                  toast.info(`Removed from cart: ${item.name}`, { position: "bottom-right", autoClose: 2000 });
                }}
                className="absolute top-3 right-3 text-secondary hover:text-red-500 p-1.5 transition-colors cursor-pointer"
                aria-label="Remove item"
              >
                <FiTrash2 size={16} />
              </button>

            </div>
          ))}

          {/* Action Buttons below list */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4 select-none">
            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-gold-400 hover:bg-gold-50 text-gold-700 hover:text-gold-800 font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors"
            >
              <FiArrowLeft size={14} />
              <span>Continue Shopping</span>
            </Link>
            
            <button
              onClick={() => {
                dispatch(clearCart());
                toast.info("Cart cleared successfully.", { position: "bottom-right" });
              }}
              className="w-full sm:w-auto text-secondary hover:text-red-500 font-bold text-xs tracking-widest uppercase py-3 px-6 transition-colors border border-gray-200 bg-white"
            >
              Clear Entire Cart
            </button>
          </div>
        </div>

        {/* Right Side: Order Summary Panel */}
        <aside className="w-full lg:w-1/3 sticky top-28 bg-white border border-gold-200/60 p-6 shadow-sm select-none">
          <h3 className="font-serif text-lg font-bold text-primary tracking-wide mb-6 pb-3 border-b border-gold-100">
            Order Summary
          </h3>

          {/* Billing Values */}
          <div className="space-y-4 text-sm font-sans text-secondary font-medium">
            <div className="flex justify-between">
              <span>Cart Subtotal</span>
              <span className="text-primary font-bold">₹{cartState.subtotal.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Estimated Delivery</span>
              {cartState.shipping === 0 ? (
                <span className="text-green-600 font-bold uppercase tracking-wider text-xs">Free Shipping</span>
              ) : (
                <span className="text-primary font-bold">₹{cartState.shipping.toLocaleString('en-IN')}</span>
              )}
            </div>

            {/* Threshold shipping prompt */}
            {cartState.subtotal < cartState.freeShippingThreshold && (
              <div className="bg-gold-50/50 p-2.5 border border-gold-100/30 text-xs text-gold-800 leading-normal">
                Add <strong>₹{(cartState.freeShippingThreshold - cartState.subtotal).toLocaleString('en-IN')}</strong> more to claim <strong>FREE SHIPPING</strong>!
              </div>
            )}

            {/* Promo discount display */}
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold items-center bg-green-50 p-2">
                <span className="flex items-center"><FiTag className="mr-1.5" /> Code: {appliedPromoCode}</span>
                <span>-₹{appliedDiscount.toLocaleString('en-IN')}</span>
                <button onClick={handleRemovePromo} className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider ml-1">Remove</button>
              </div>
            )}

            <div className="border-t border-gold-100 pt-4 flex justify-between text-base text-primary font-bold">
              <span>Total Payable</span>
              <span className="text-gold-700 font-extrabold text-lg">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Promo code Form */}
          <form onSubmit={handleApplyPromo} className="mt-8 pt-6 border-t border-gold-100">
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Apply Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Try '${settings?.specialOfferCouponCode || "SHAMBHAVI10"}'`}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-grow bg-[#faf9f6] border border-gold-300 py-2.5 px-3 text-xs tracking-widest outline-none uppercase font-mono focus:border-gold-500"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-gold-500 text-white font-bold py-2.5 px-4 text-xs tracking-widest uppercase transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Primary Checkout Actions */}
          <div className="mt-8 space-y-3">
            {/* Standard Checkout Link */}
            <Link
              to="/checkout"
              className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-4 px-6 text-xs tracking-widest uppercase transition-colors flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <FiArrowRight size={14} />
            </Link>

            {/* WhatsApp checkout channel */}
            <button
              onClick={handleCheckoutOnWhatsApp}
              className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FaWhatsapp size={16} />
              <span>Checkout on WhatsApp</span>
            </button>
          </div>

          <div className="mt-6 text-center select-none">
            <span className="text-[10px] text-secondary font-medium tracking-wide">
              🔒 256-bit Secure Encrypted Checkout Connection.
            </span>
          </div>

        </aside>

      </div>
    </div>
  );
}

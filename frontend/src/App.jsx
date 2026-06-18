import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchCartThunk, setCartSettings } from './store/cartSlice';
import { fetchWishlistThunk } from './store/wishlistSlice';
import { fetchPublicSettings } from './store/settingsSlice';

// Reusable Global Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import MobileNavigation from './components/MobileNavigation';
import ScrollToTop from './components/ScrollToTop';

// Page Components
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Wishlist from './pages/Wishlist';
import MyAccount from './pages/MyAccount';
import OrderTracking from './pages/OrderTracking';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import ReturnRefundPolicy from './pages/ReturnRefundPolicy';

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  // Fetch settings unconditionally on load
  useEffect(() => {
    dispatch(fetchPublicSettings());
  }, [dispatch]);

  // Sync settings with cart calculator once fetched
  useEffect(() => {
    if (settings) {
      dispatch(setCartSettings(settings));
    }
  }, [settings, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCartThunk());
      dispatch(fetchWishlistThunk());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-[#121212] pb-16 md:pb-0 font-sans antialiased">
      
      {/* Global Premium Luxury Header for customer facing pages */}
      <Navbar />

      {/* Dynamic Route Content */}
      <main className="flex-grow">
        <Routes>
          {/* Customer Facing Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<MyAccount />} />
          <Route path="/tracking" element={<OrderTracking />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/return-refund" element={<ReturnRefundPolicy />} />
        </Routes>
      </main>

      {/* Global Luxury Footer for customer facing pages */}
      <Footer />

      {/* Float Channel Trigger: WhatsApp concierge */}
      <WhatsAppButton />

      {/* Thumb-friendly mobile navigation bottom bar */}
      <MobileNavigation />

      {/* Luxury Micro-Feedback toast container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="border border-gold-200 shadow-xl rounded-none font-sans text-xs tracking-wide"
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      {/* Resets scroll position on route shifts */}
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

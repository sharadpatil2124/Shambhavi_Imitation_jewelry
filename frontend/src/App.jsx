import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { mergeCartThunk, setCartSettings } from './store/cartSlice';
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

// Other pages load on demand, so the first visit downloads less JavaScript.
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Categories = lazy(() => import('./pages/Categories'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const ReturnRefundPolicy = lazy(() => import('./pages/ReturnRefundPolicy'));

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
      dispatch(mergeCartThunk());
      dispatch(fetchWishlistThunk());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-[#121212] pb-16 md:pb-0 font-sans antialiased">
      
      {/* Global Premium Luxury Header for customer facing pages */}
      <Navbar />

      {/* Dynamic Route Content */}
      <main className="flex-grow">
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-xs tracking-widest uppercase text-gold-600">Loading…</div>}>
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
        </Suspense>
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

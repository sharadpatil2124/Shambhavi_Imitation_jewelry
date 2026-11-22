import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminProtectedRoute from './routes/AdminProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

import AdminLogin from './pages/AdminLogin';

// Other pages load on demand, so signing in downloads less JavaScript (the dashboard charts are large).
const AdminForgotPassword = lazy(() => import('./pages/AdminForgotPassword'));
const AdminResetPassword = lazy(() => import('./pages/AdminResetPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/AdminCustomers'));
const AdminReviews = lazy(() => import('./pages/AdminReviews'));
const AdminCartWishlist = lazy(() => import('./pages/AdminCartWishlist'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const AdminEnquiries = lazy(() => import('./pages/AdminEnquiries'));

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#FDFCF7] font-sans antialiased">
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-xs tracking-widest uppercase text-gold-600">Loading…</div>}>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/reset-password" element={<AdminResetPassword />} />

          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/products" element={<AdminProducts />} />
              <Route path="/categories" element={<AdminCategories />} />
              <Route path="/orders" element={<AdminOrders />} />
              <Route path="/customers" element={<AdminCustomers />} />
              <Route path="/reviews" element={<AdminReviews />} />
              <Route path="/cart-wishlist" element={<AdminCartWishlist />} />
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="/profile" element={<AdminProfile />} />
              <Route path="/enquiries" element={<AdminEnquiries />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
        </Suspense>

        <ToastContainer 
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Route Guards & Layouts
import AdminProtectedRoute from './routes/AdminProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

// Admin Page Components
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminCustomers from './pages/AdminCustomers';
import AdminReviews from './pages/AdminReviews';
import AdminCartWishlist from './pages/AdminCartWishlist';
import AdminSettings from './pages/AdminSettings';
import AdminProfile from './pages/AdminProfile';
import AdminEnquiries from './pages/AdminEnquiries';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#FDFCF7] font-sans antialiased">
        <Routes>
          {/* Public Auth Endpoint */}
          <Route path="/login" element={<AdminLogin />} />

          {/* Secure Administrative Console Workspace */}
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
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>

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

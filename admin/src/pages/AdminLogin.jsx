import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../store/authSlice';
import adminService from '../services/adminService';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // Connect to MERN auth login endpoint
      const response = await adminService.adminLogin(email, password);
      
      if (response.success) {
        if (response.role !== 'admin' && !response.isAdmin) {
          toast.error("Access denied: Customer accounts cannot access the administrator area.");
          setLoading(false);
          return;
        }

        dispatch(loginUser(response));
        toast.success(`Welcome back, Admin ${response.name}!`, { position: "bottom-center" });
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message || "Invalid administrative email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Decorative luxury abstract circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold-100/30 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gold-200/20 blur-3xl"></div>
      
      <div className="w-full max-w-md bg-white border border-gold-200/60 p-8 shadow-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 pb-4 border-b border-gold-100">
          <span className="text-[10px] font-bold tracking-[0.4em] text-gold-600 uppercase mb-1.5 block">
            SHAMBHAVI IMITATION
          </span>
          <h2 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">
            Administrative Portal
          </h2>
          <p className="text-xs text-secondary/60 font-sans mt-1">
            Access secure management controls & analytics
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="text-left">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shambhavi.com"
                className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Password */}
          <div className="text-left">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Secret Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-12 text-sm font-sans focus:border-gold-500 outline-none transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-gold-600 transition-colors"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Admin notice */}
          <div className="bg-[#FAF8F2] border border-gold-200/50 p-3 text-[11px] font-sans text-secondary/70 leading-relaxed text-left flex justify-between items-start">
            <span>
              <strong>Note:</strong> Authorized administrator access only. Credentials must be registered in the database.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Enter Portal Securely"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

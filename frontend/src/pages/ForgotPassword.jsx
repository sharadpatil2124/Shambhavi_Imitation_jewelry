import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/forgot-password', { email });
      if (response.success) {
        toast.success(response.message || "Reset OTP sent successfully to your email.", { position: "bottom-center" });
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to process forgot password request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 select-none animate-fade-in text-left">
      <div className="bg-white border border-gold-200/60 p-8 shadow-md">
        
        {/* Header */}
        <div className="text-center mb-8 pb-4 border-b border-gold-100">
          <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-1 block">SHAMBHAVI CIRCLE</span>
          <h2 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Recover Password</h2>
          <p className="text-xs text-secondary/60 font-sans mt-2">
            Enter your email to receive a secure 6-digit OTP verification code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="devi.sharan@example.com"
                className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 outline-none"
              />
            </div>
          </div>

          {/* Send OTP Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Send Reset OTP"
            )}
          </button>
        </form>

        {/* Footer info link */}
        <div className="mt-8 pt-6 border-t border-gold-100 text-center text-xs font-sans text-secondary font-medium flex justify-between items-center">
          <Link to="/login" className="text-secondary hover:text-gold-600 font-semibold flex items-center gap-1.5 transition-colors">
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
          <Link to="/register" className="text-gold-600 font-bold hover:underline">Create Account</Link>
        </div>

      </div>
    </div>
  );
}

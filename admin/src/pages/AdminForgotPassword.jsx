import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';

export default function AdminForgotPassword() {
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
      const response = await adminService.forgotPassword(email);
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
    <div className="min-h-dvh bg-[#FDFCF7] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Decorative luxury abstract circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold-100/30 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gold-200/20 blur-3xl"></div>
      
      <div className="w-full max-w-md bg-white border border-gold-200/60 p-6 sm:p-8 shadow-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 pb-4 border-b border-gold-100">
          <span className="text-[10px] font-bold tracking-[0.4em] text-gold-600 uppercase mb-1.5 block">
            SHAMBHAVI IMITATION
          </span>
          <h2 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">
            Recover Password
          </h2>
          <p className="text-xs text-secondary/60 font-sans mt-1 leading-relaxed">
            Enter your email to receive a secure 6-digit OTP verification code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="text-left">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Administrative Email
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
                "Send Reset OTP"
              )}
            </button>
          </div>
        </form>

        {/* Back to Sign In Link */}
        <div className="mt-6 pt-5 border-t border-gold-100 text-center">
          <Link 
            to="/login" 
            className="text-xs font-sans text-secondary/70 hover:text-gold-600 font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

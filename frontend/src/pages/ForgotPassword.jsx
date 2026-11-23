import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // Set when the entered email has no account; shows the "create an account" notice.
  const [accountNotFound, setAccountNotFound] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.warning("Please enter your email address.");
      return;
    }

    setLoading(true);
    setAccountNotFound("");
    try {
      const response = await api.post('/users/forgot-password', { email: trimmedEmail });
      if (response.success) {
        toast.success(response.message || "Reset OTP sent successfully to your email.", { position: "bottom-center" });
        navigate(`/reset-password?email=${encodeURIComponent(response.email || trimmedEmail)}`);
      }
    } catch (error) {
      if (error.code === 'ACCOUNT_NOT_FOUND') {
        setAccountNotFound(error.message);
      } else {
        toast.error(error.message || "Failed to process forgot password request.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-16 px-4 select-none animate-fade-in text-left">
      <div className="bg-white dark:bg-[#0c0a06] border border-gold-200/50 dark:border-gold-900/40 p-6 sm:p-8 shadow-md relative">
        {/* Luxury Gold Corner Frames */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-gold-400/50 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-gold-400/50 pointer-events-none z-10"></div>
        
        {/* Header */}
        <div className="text-center mb-8 pb-4 border-b border-gold-100 dark:border-gold-950/60 relative z-20">
          <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-1 block">SHAMBHAVI CIRCLE</span>
          <h2 className="font-serif text-2xl font-bold tracking-wide text-primary dark:text-white m-0">Recover Password</h2>
          <p className="text-xs text-secondary dark:text-gray-300 font-sans mt-2">
            Enter your email to receive a secure 6-digit OTP verification code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-20">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (accountNotFound) setAccountNotFound("");
                }}
                placeholder="Enter Email Address"
                className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
              />
            </div>
          </div>

          {/* No account for this email: ask the user to register first */}
          {accountNotFound && (
            <div role="alert" className="border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 text-left">
              <p className="text-xs font-sans text-red-700 dark:text-red-300 m-0">{accountNotFound}</p>
              <Link
                to="/register"
                className="mt-3 inline-block text-[11px] font-bold tracking-widest uppercase text-gold-700 dark:text-gold-400 hover:underline"
              >
                Create a New Account
              </Link>
            </div>
          )}

          {/* Send OTP Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center flex items-center justify-center border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Send Reset OTP"
            )}
          </button>
        </form>

        {/* Footer info link */}
        <div className="mt-8 pt-6 border-t border-gold-100 dark:border-gold-950/60 text-center text-xs font-sans text-secondary dark:text-gray-400 font-medium flex flex-wrap justify-between items-center gap-3 relative z-20">
          <Link to="/login" className="text-secondary dark:text-gold-300 hover:text-gold-600 font-semibold flex items-center gap-1.5 transition-colors">
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
          <Link to="/register" className="text-gold-600 dark:text-gold-400 font-bold hover:underline">Create Account</Link>
        </div>

      </div>
    </div>
  );
}

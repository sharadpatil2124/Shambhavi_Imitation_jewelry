import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiKey, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Extract email from query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !password || !confirmPassword) {
      toast.warning("Please complete all required fields.");
      return;
    }

    if (otp.length !== 6) {
      toast.warning("Verification OTP must contain exactly 6 digits.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("New passwords do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/reset-password', { email, otp, password });
      if (response.success) {
        toast.success(response.message || "Your password has been reset successfully. Please log in.", { position: "bottom-center" });
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.message || "Failed to reset password. Please verify the code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.warning("Please enter your email address first.");
      return;
    }

    setResendLoading(true);
    try {
      const response = await api.post('/users/resend-otp', { email, type: 'reset' });
      if (response.success) {
        toast.success(response.message || "A new password reset OTP has been sent.", { position: "bottom-center" });
        setTimer(60); // 60 seconds throttle
      }
    } catch (error) {
      toast.error(error.message || "Failed to resend reset OTP.");
    } finally {
      setResendLoading(false);
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
          <h2 className="font-serif text-2xl font-bold tracking-wide text-primary dark:text-white m-0">Reset Password</h2>
          <p className="text-xs text-secondary dark:text-gray-300 font-sans mt-2">
            Establish a new secure password for your account using the OTP received.
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email Address"
                className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
              />
            </div>
          </div>

          {/* OTP Code */}
          <div>
            <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 mb-2">
              <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider">6-Digit Reset OTP</label>
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || resendLoading}
                className={`text-xs font-sans font-semibold transition-colors ${
                  timer > 0 ? 'text-secondary/40 cursor-not-allowed' : 'text-gold-600 hover:text-gold-700 hover:underline cursor-pointer'
                }`}
              >
                {resendLoading ? 'Sending...' : timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </button>
            </div>
            <div className="relative">
              <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 pl-12 pr-4 text-sm font-sans tracking-[0.2em] font-mono focus:border-gold-500 text-primary dark:text-white outline-none"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 pl-12 pr-12 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-secondary hover:text-gold-600 transition-colors"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Reset Password Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center flex items-center justify-center border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>

        {/* Footer info link */}
        <div className="mt-8 pt-6 border-t border-gold-100 dark:border-gold-950/60 text-center text-xs font-sans text-secondary dark:text-gray-400 font-medium relative z-20">
          <Link to="/login" className="text-secondary dark:text-gold-300 hover:text-gold-600 font-semibold flex items-center justify-center gap-1.5 transition-colors">
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

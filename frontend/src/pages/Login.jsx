import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../store/authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff, FiKey, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [step, setStep] = useState("login"); // "login" or "verify"
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/account');
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for OTP resend
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
    if (!email || !password) {
      toast.warning("Please complete both email and password fields.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/users/login', { email, password });
      if (response.success) {
        if (response.requiresVerification) {
          toast.info(response.message || "Email verification required. An OTP has been sent.", { position: "bottom-center" });
          setStep("verify");
          setTimer(60);
        } else {
          dispatch(loginUser(response));
          toast.success(response.message || "Welcome back! Logged in successfully.", { position: "bottom-center" });
          navigate('/account');
        }
      }
    } catch (error) {
      toast.error(error.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.warning("Please enter the verification code.");
      return;
    }

    if (otp.length !== 6) {
      toast.warning("OTP must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/verify-otp', { email, otp });
      if (response.success) {
        dispatch(loginUser(response));
        toast.success(response.message || "Verified and logged in successfully!", { position: "bottom-center" });
        navigate('/account');
      }
    } catch (error) {
      toast.error(error.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await api.post('/users/resend-otp', { email });
      if (response.success) {
        toast.success(response.message || "A new verification code has been sent.", { position: "bottom-center" });
        setTimer(60);
      }
    } catch (error) {
      toast.error(error.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 select-none animate-fade-in text-left">
      <div className="bg-white border border-gold-200/60 p-8 shadow-md">
        
        {step === "login" ? (
          <>
            {/* Header */}
            <div className="text-center mb-8 pb-4 border-b border-gold-100">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-1 block">SHAMBHAVI CIRCLE</span>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Sign In to Account</h2>
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
                    placeholder="Enter Valid Mail"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-12 text-sm font-sans focus:border-gold-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-gold-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs font-sans text-secondary font-medium">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="mr-2 accent-gold-600 cursor-pointer" />
                  <span>Keep me signed in</span>
                </label>
                <Link to="/forgot-password" className="hover:text-gold-600 font-semibold transition-colors">Forgot Password?</Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Sign In Securely"
                )}
              </button>
            </form>

            {/* Footer info link */}
            <div className="mt-8 pt-6 border-t border-gold-100 text-center text-xs font-sans text-secondary font-medium">
              <span>New to Shambhavi Imitation? </span>
              <Link to="/register" className="text-gold-600 font-bold hover:underline">Create an Account</Link>
            </div>
          </>
        ) : (
          <>
            {/* OTP Verification Header */}
            <div className="text-center mb-8 pb-4 border-b border-gold-100">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-1 block">SHAMBHAVI CIRCLE</span>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Verify Your Email</h2>
              <p className="text-xs text-secondary/60 font-sans mt-2">
                Your email is not verified. We've sent a 6-digit OTP code to <strong className="text-secondary">{email}</strong>.
              </p>
            </div>

            {/* OTP Verification Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Verification OTP</label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0 || loading}
                    className={`text-xs font-sans font-semibold transition-colors ${
                      timer > 0 ? 'text-secondary/40 cursor-not-allowed' : 'text-gold-600 hover:text-gold-700 hover:underline cursor-pointer'
                    }`}
                  >
                    {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
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
                    className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans tracking-[0.2em] font-mono focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Verify & Sign In"
                )}
              </button>
            </form>

            {/* Back to Sign In link */}
            <div className="mt-8 pt-6 border-t border-gold-100 text-center text-xs font-sans text-secondary font-medium">
              <button
                type="button"
                onClick={() => setStep("login")}
                className="text-secondary hover:text-gold-600 font-semibold flex items-center justify-center gap-1.5 transition-colors mx-auto cursor-pointer"
              >
                <FiArrowLeft size={14} /> Back to Sign In Form
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

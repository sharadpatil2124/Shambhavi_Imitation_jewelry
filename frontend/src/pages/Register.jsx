import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../store/authSlice';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiKey, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [step, setStep] = useState("register"); // "register" or "verify"
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

    if (!name || !email || !phone || !password || !confirmPassword) {
      toast.warning("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    if (!agreeTerms) {
      toast.warning("You must accept our Terms of Service & Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/register', { name, email, phone, password });
      if (response.success) {
        if (response.requiresVerification) {
          toast.success(response.message || "An OTP has been sent to your email address.", { position: "bottom-center" });
          setStep("verify");
          setTimer(60);
        } else {
          dispatch(registerUser(response));
          toast.success(response.message || "Account successfully created! Welcome to Shambhavi.", { position: "bottom-center" });
          navigate('/account');
        }
      }
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
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
        dispatch(registerUser(response));
        toast.success(response.message || "Email verified! Welcome to Shambhavi Imitation.", { position: "bottom-center" });
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
        
        {step === "register" ? (
          <>
            {/* Header */}
            <div className="text-center mb-8 pb-4 border-b border-gold-100">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-1 block">SHAMBHAVI CIRCLE</span>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Create an Account</h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

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

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Create Password</label>
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-3 pl-12 pr-4 text-sm font-sans focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              {/* Agree terms */}
              <div className="flex items-start text-xs font-sans text-secondary font-medium">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 mr-2.5 accent-gold-600 cursor-pointer"
                  />
                  <span className="leading-normal">
                    I agree to the <Link to="/terms-conditions" className="text-gold-600 hover:underline font-semibold">Terms & Conditions</Link> and <Link to="/privacy-policy" className="text-gold-600 hover:underline font-semibold">Privacy Policy</Link>.
                  </span>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer text-center flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Footer info link */}
            <div className="mt-8 pt-6 border-t border-gold-100 text-center text-xs font-sans text-secondary font-medium">
              <span>Already have an account? </span>
              <Link to="/login" className="text-gold-600 font-bold hover:underline">Sign In Here</Link>
            </div>
          </>
        ) : (
          <>
            {/* OTP Verification Header */}
            <div className="text-center mb-8 pb-4 border-b border-gold-100">
              <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-1 block">SHAMBHAVI CIRCLE</span>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Verify Your Email</h2>
              <p className="text-xs text-secondary/60 font-sans mt-2">
                We've sent a 6-digit OTP code to <strong className="text-secondary">{email}</strong>. Please verify it below to complete registration.
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
                  "Verify & Activate"
                )}
              </button>
            </form>

            {/* Back to Register link */}
            <div className="mt-8 pt-6 border-t border-gold-100 text-center text-xs font-sans text-secondary font-medium">
              <button
                type="button"
                onClick={() => setStep("register")}
                className="text-secondary hover:text-gold-600 font-semibold flex items-center justify-center gap-1.5 transition-colors mx-auto cursor-pointer"
              >
                <FiArrowLeft size={14} /> Back to Registration
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

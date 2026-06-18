import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../store/authSlice';
import adminService from '../services/adminService';
import { FiUser, FiMail, FiPhone, FiLock, FiKey, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (formData.password && !formData.currentPassword) {
      toast.warning("Please enter your current password to modify security details.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.currentPassword = formData.currentPassword;
      }

      const response = await adminService.updateProfile(payload);

      if (response.success) {
        if (response.emailChangePending) {
          setPendingEmail(response.pendingEmail);
          setShowOtpModal(true);
          toast.info("Verification code dispatched to your new email address.");
        } else {
          dispatch(updateProfile({
            name: response.name,
            email: response.email,
            phone: response.phone
          }));
          toast.success("Profile saved and synced successfully.", { position: "bottom-center" });
          setFormData((prev) => ({
            ...prev,
            currentPassword: '',
            password: '',
            confirmPassword: ''
          }));
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile details.");
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

    setOtpLoading(true);
    try {
      const response = await adminService.verifyEmailChange(otp);
      if (response.success) {
        dispatch(updateProfile({
          name: response.name,
          email: response.email,
          phone: response.phone
        }));
        toast.success("Email address updated and verified successfully!", { position: "bottom-center" });
        setShowOtpModal(false);
        setOtp('');
        setFormData((prev) => ({
          ...prev,
          email: response.email,
          currentPassword: '',
          password: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      toast.error(error.message || "Verification failed. Please check your code.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="border-b border-gold-100 pb-5">
        <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Admin Profile Settings</h1>
        <p className="text-xs text-secondary/60 font-sans mt-1">
          Manage your personal administrative access credentials and login security.
        </p>
      </div>

      <div className="max-w-2xl bg-white border border-gold-200/40 shadow-sm p-6 sm:p-8 space-y-6 font-sans text-xs">
        <div>
          <h3 className="font-serif text-base font-bold text-primary tracking-wide mb-1">Account Credentials</h3>
          <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-semibold">Verify email changes through live SMTP verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-600" size={14} />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-10 pr-4 text-xs focus:border-gold-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Phone Line</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-600" size={14} />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-10 pr-4 text-xs focus:border-gold-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left md:col-span-2">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                Email Address * <span className="text-gold-600 normal-case font-semibold font-sans ml-1">(Requires verification if modified)</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-600" size={14} />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-10 pr-4 text-xs focus:border-gold-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gold-100 pt-6">
            <h3 className="font-serif text-sm font-bold text-primary tracking-wide mb-4 text-left">Access Security</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 text-left md:col-span-2">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Current Secret Password <span className="text-gold-600 normal-case font-semibold font-sans ml-1">(Required only if setting a new password)</span>
                </label>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-600" size={14} />
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-10 pr-4 text-xs focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-600" size={14} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-10 pr-4 text-xs focus:border-gold-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-600" size={14} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-10 pr-4 text-xs focus:border-gold-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-gold-600 text-white font-bold py-3 px-8 text-xs tracking-wider uppercase flex items-center transition-colors cursor-pointer"
            >
              <FiSave className="mr-2" size={14} />
              {loading ? 'Saving Changes...' : 'Save Profile Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
          <div className="bg-white border border-gold-200 shadow-2xl p-6 sm:p-8 max-w-sm w-full relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute right-4 top-4 text-secondary/60 hover:text-primary transition-colors p-1"
            >
              <FiX size={18} />
            </button>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto text-gold-600">
                <FiMail size={22} />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-primary m-0">Confirm Email Change</h3>
                <p className="text-[11px] text-secondary/70">
                  Please enter the 6-digit OTP code sent to your pending email address:
                </p>
                <strong className="block text-xs font-mono text-gold-600 mt-1 select-all">{pendingEmail}</strong>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-center text-sm font-semibold tracking-[0.25em] focus:border-gold-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-3 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer"
                >
                  {otpLoading ? 'Verifying OTP...' : 'Verify & Complete Update'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

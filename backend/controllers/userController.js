import crypto from 'crypto';
import User from '../models/userModel.js';
import Wishlist from '../models/Wishlist.js';
import Cart from '../models/Cart.js';
import generateToken from '../utils/generateToken.js';
import { sendOtpEmail } from '../utils/sendEmail.js';
// Helper to validate email format strictly
const isValidEmailFormat = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Helper to check for disposable or temporary domains
const isDisposableEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const domain = email.trim().split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  const disposableDomains = [
    'yopmail.com', 'mailinator.com', 'tempmail.com', 'dispostable.com', 
    'guerrillamail.com', '10minutemail.com', 'trashmail.com', 'getairmail.com', 
    'sharklasers.com', 'guerrillamailblock.com', 'guerrillamail.net', 
    'guerrillamail.org', 'guerrillamail.biz', 'grr.la', 'temp-mail.org', 
    'maildrop.cc', 'generator.email', 'fakeinbox.com', 'throwawaymail.com', 
    'tempmailaddress.com', 'mohmal.com', 'inboxkitten.com', 'tempmail.net'
  ];
  return disposableDomains.includes(domain);
};

// @desc    Register new user
// @route   POST /api/users/register (or /api/auth/register)
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate email format
    if (!email || !isValidEmailFormat(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    // Block temporary/disposable emails
    if (isDisposableEmail(email)) {
      res.status(400);
      throw new Error('Disposable or temporary email addresses are not allowed');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (userExists) {
      if (userExists.isVerified) {
        res.status(400);
        throw new Error('A user with this email address already exists');
      } else {
        // If the user exists but is unverified, update their details and resend OTP
        userExists.name = name;
        userExists.phone = phone;
        userExists.password = password; // pre-save hook will hash it
        userExists.otp = otp;
        userExists.otpExpires = otpExpires;
        await userExists.save();

        await sendOtpEmail(email, otp, 'register');

        return res.status(200).json({
          success: true,
          message: 'Verification OTP has been sent to your email address.',
          email,
          requiresVerification: true
        });
      }
    }

    // Create user (unverified by default)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      otp,
      otpExpires,
      isVerified: false
    });

    if (user) {
      await sendOtpEmail(email, otp, 'register');

      res.status(201).json({
        success: true,
        message: 'Verification OTP has been sent to your email address.',
        email,
        requiresVerification: true
      });
    } else {
      res.status(400);
      throw new Error('Invalid user details provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login (or /api/auth/login)
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password');
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400);
      throw new Error('Email and password must be string values');
    }

    if (!isValidEmailFormat(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check verification state
      if (!user.isVerified) {
        const otp = crypto.randomInt(100000, 1000000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendOtpEmail(email, otp, 'register');

        return res.status(200).json({
          success: true,
          requiresVerification: true,
          email: user.email,
          message: 'Your email is not verified. An OTP has been sent to your email address.'
        });
      }

      res.json({
        success: true,
        message: 'Logged in successfully',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        phone: user.phone || '',
        addresses: user.addresses || [],
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client-side discard notification)
// @route   POST /api/users/logout (or /api/auth/logout)
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully. Secure JWT cleared.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP for registration or login
// @route   POST /api/users/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and verification code');
    }

    if (typeof email !== 'string' || !isValidEmailFormat(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    const otpStr = String(otp).trim();

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User account not found');
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Account is already verified. Please sign in.',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        phone: user.phone || '',
        addresses: user.addresses || [],
        token: generateToken(user._id)
      });
    }

    // Check OTP match and expiry
    if (user.otp !== otpStr || user.otpExpires < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Mark verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Synchronize database: Initialize empty Cart and Wishlist for new user if they don't exist
    const cartExists = await Cart.findOne({ user: user._id });
    if (!cartExists) {
      await Cart.create({ user: user._id, items: [] });
    }

    const wishlistExists = await Wishlist.findOne({ user: user._id });
    if (!wishlistExists) {
      await Wishlist.create({ user: user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Shambhavi.',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      phone: user.phone || '',
      addresses: user.addresses || [],
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP verification code
// @route   POST /api/users/resend-otp
// @access  Public
export const resendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body; // type can be 'register' or 'reset'

    if (!email) {
      res.status(400);
      throw new Error('Please provide email address');
    }

    if (typeof email !== 'string' || !isValidEmailFormat(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('No user account associated with this email address');
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    if (type === 'reset') {
      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpires = otpExpires;
      await user.save();

      await sendOtpEmail(email, otp, 'reset');
    } else {
      if (user.isVerified) {
        res.status(400);
        throw new Error('This account is already verified');
      }

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      await sendOtpEmail(email, otp, 'register');
    }

    res.json({
      success: true,
      message: `A new verification OTP has been sent to ${email}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password OTP generation
// @route   POST /api/users/forgot-password (or /api/auth/forgot-password)
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string' || !isValidEmailFormat(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('No user account associated with this email address');
    }

    // Generate 6-digit OTP code
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Set to database fields with expiry of 10 minutes
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    await sendOtpEmail(email, otp, 'reset');

    res.json({
      success: true,
      message: 'Password reset OTP has been sent to your email address.',
      email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using OTP
// @route   POST /api/users/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      res.status(400);
      throw new Error('Please provide email, verification code, and new password');
    }

    if (typeof email !== 'string' || !isValidEmailFormat(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400);
      throw new Error('Password must be a string and contain at least 6 characters');
    }

    const otpStr = String(otp).trim();

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('No user account associated with this email address');
    }

    // Look up user and check verification code & expiry date
    if (user.resetPasswordOtp !== otpStr || user.resetPasswordOtpExpires < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Set new password
    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    // Ensure that password reset also marks user verified if they weren't
    user.isVerified = true;

    await user.save();

    res.json({
      success: true,
      message: 'Your password has been reset successfully. Please login with your new credentials.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile details
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        phone: user.phone || '',
        addresses: user.addresses || []
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

    let emailChangePending = false;
    let pendingEmail = '';

    if (req.body.email) {
      if (typeof req.body.email !== 'string') {
        res.status(400);
        throw new Error('Email address must be a string value');
      }
      
      const emailVal = req.body.email.toLowerCase().trim();
      
      if (emailVal !== user.email.toLowerCase()) {
        const newEmail = emailVal;

        // Validate email format
        if (!isValidEmailFormat(newEmail)) {
          res.status(400);
          throw new Error('Please provide a valid email address');
        }

        // Block temporary/disposable emails
        if (isDisposableEmail(newEmail)) {
          res.status(400);
          throw new Error('Disposable or temporary email addresses are not allowed');
        }

        // Check if email already registered to someone else
        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) {
          res.status(400);
          throw new Error('Email address is already in use by another account');
        }

        // Instead of changing email immediately, set pendingEmail and trigger verification
        user.pendingEmail = newEmail;
        
        const otp = crypto.randomInt(100000, 1000000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await sendOtpEmail(newEmail, otp, 'register');
        
        emailChangePending = true;
        pendingEmail = newEmail;
      }
    }

    if (req.body.password) {
      // If updating password, verify current password
      if (!req.body.currentPassword) {
        res.status(400);
        throw new Error('Please provide your current password to set a new password');
      }
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect current password');
      }
      user.password = req.body.password;
    }

    // Map address flat fields from frontend to backend nested schema
    if (req.body.address || req.body.city || req.body.state || req.body.zipCode) {
      const addressObj = {
        street: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || '',
        pincode: req.body.zipCode || '',
        country: 'India'
      };

      if (user.addresses && user.addresses.length > 0) {
        user.addresses[0] = {
          ...user.addresses[0],
          ...addressObj
        };
      } else {
        user.addresses = [addressObj];
      }
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: emailChangePending 
        ? 'Profile details updated. A verification OTP has been dispatched to your new email.'
        : 'Profile updated successfully',
      emailChangePending,
      pendingEmail,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      phone: updatedUser.phone || '',
      addresses: updatedUser.addresses || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address change using OTP
// @route   POST /api/users/verify-email-change
// @access  Private
export const verifyEmailChange = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      res.status(400);
      throw new Error('Please provide the 6-digit verification code');
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User account not found');
    }

    if (!user.pendingEmail) {
      res.status(400);
      throw new Error('No email update is currently pending for this account');
    }

    // Verify OTP and check expiration
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Update the email address and clear pending fields
    const updatedEmail = user.pendingEmail;
    user.email = updatedEmail;
    user.pendingEmail = undefined;
    user.otp = undefined;
    user.otpExpires = undefined;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Your email address has been updated and verified successfully!',
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      phone: updatedUser.phone || '',
      addresses: updatedUser.addresses || []
    });
  } catch (error) {
    next(error);
  }
};

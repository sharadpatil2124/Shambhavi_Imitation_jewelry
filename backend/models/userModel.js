import bcrypt from 'bcryptjs';
import validator from 'validator';
import { Model } from '../db/model.js';

// Table: users. Saved addresses are in the child table user_addresses.
const User = Model.define('User', {
  table: 'users',
  fields: {
    name: { type: 'string', required: 'Please provide your full name', trim: true },
    email: {
      type: 'string',
      required: 'Please provide your email address',
      lowercase: true,
      trim: true,
      // Accepts all valid addresses, including plus-aliases (name+shop@gmail.com) and longer
      // domain endings (.info, .store); the old pattern rejected both.
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Please provide a valid email address'
      }
    },
    password: {
      type: 'string',
      required: 'Please provide a secure login password',
      minlength: [6, 'Password must contain at least 6 characters'],
      select: false // never loaded unless asked for with .select('+password')
    },
    phone: { type: 'string', trim: true },
    role: { type: 'string', enum: ['customer', 'admin'], default: 'customer' },
    isAdmin: { type: 'boolean', required: true, default: false },
    resetPasswordToken: 'string',
    resetPasswordExpires: 'date',
    isVerified: { type: 'boolean', required: true, default: false },
    otp: 'string',
    otpExpires: 'date',
    otpAttempts: { type: 'number', default: 0 },
    resetPasswordOtp: 'string',
    resetPasswordOtpExpires: 'date',
    resetPasswordOtpAttempts: { type: 'number', default: 0 },
    pendingEmail: 'string'
  },
  children: {
    addresses: {
      table: 'user_addresses',
      foreignKey: 'user_id',
      fields: {
        street: { type: 'string', trim: true },
        city: { type: 'string', trim: true },
        state: { type: 'string', trim: true },
        pincode: { type: 'string', trim: true },
        country: { type: 'string', trim: true, default: 'India' }
      }
    }
  },
  async preSave() {
    if (this.isAdmin) {
      this.role = 'admin';
    } else if (this.role === 'admin') {
      this.isAdmin = true;
    }

    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
}, {
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
});

export default User;

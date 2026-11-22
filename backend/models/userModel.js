import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'India' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email address'],
    unique: true,
    index: true,
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
    type: String,
    required: [true, 'Please provide a secure login password'],
    minlength: [6, 'Password must contain at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  },
  addresses: [addressSchema],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  otp: String,
  otpExpires: Date,
  otpAttempts: { type: Number, default: 0 },
  resetPasswordOtp: String,
  resetPasswordOtpExpires: Date,
  resetPasswordOtpAttempts: { type: Number, default: 0 },
  pendingEmail: String
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (this.isAdmin) {
    this.role = 'admin';
  } else if (this.role === 'admin') {
    this.isAdmin = true;
  }

  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

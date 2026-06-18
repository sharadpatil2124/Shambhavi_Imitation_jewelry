import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'Shambhavi Imitation'
  },
  contactEmail: {
    type: String,
    default: 'contact@shambhaviimitation.com'
  },
  contactPhone: {
    type: String,
    default: '+91 70838 74227'
  },
  address: {
    type: String,
    default: 'Mumbai, Maharashtra, India'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  taxRate: {
    type: Number,
    default: 3 // 3% GST standard for jewelry
  },
  shippingCharge: {
    type: Number,
    default: 100
  },
  freeShippingThreshold: {
    type: Number,
    default: 1500
  },
  socialInstagram: {
    type: String,
    default: ''
  },
  socialFacebook: {
    type: String,
    default: ''
  },
  socialPinterest: {
    type: String,
    default: ''
  },
  codEnabled: {
    type: Boolean,
    default: true
  },
  onlinePaymentEnabled: {
    type: Boolean,
    default: true
  },
  logoUrl: {
    type: String,
    default: ''
  },
  showSpecialOffer: {
    type: Boolean,
    default: true
  },
  specialOfferTagline: {
    type: String,
    default: 'FESTIVAL SPECIAL OFFER'
  },
  specialOfferTitle: {
    type: String,
    default: 'Enjoy Extra 10% Off on All Prepaid Orders'
  },
  specialOfferSubtitle: {
    type: String,
    default: 'Save on jewelry sets for upcoming festivals! Apply our coupon code at checkout to claim additional discounts.'
  },
  specialOfferCouponCode: {
    type: String,
    default: 'SHAMBHAVI10'
  },
  specialOfferDiscountPercentage: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;

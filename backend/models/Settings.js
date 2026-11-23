import { Model } from '../db/model.js';

// Table: settings (a single row with the store configuration).
const Settings = Model.define('Settings', {
  table: 'settings',
  fields: {
    storeName: { type: 'string', default: 'Shambhavi Imitation' },
    contactEmail: { type: 'string', default: 'kadamshambhavi1@gmail.com' },
    contactPhone: { type: 'string', default: '+91 70838 74227' },
    address: { type: 'string', default: 'Mumbai, Maharashtra, India' },
    currency: { type: 'string', default: 'INR' },
    taxRate: { type: 'number', default: 3 }, // 3% GST standard for jewelry
    shippingCharge: { type: 'number', default: 100 },
    freeShippingThreshold: { type: 'number', default: 1500 },
    socialInstagram: { type: 'string', default: '' },
    socialFacebook: { type: 'string', default: '' },
    socialPinterest: { type: 'string', default: '' },
    codEnabled: { type: 'boolean', default: true },
    onlinePaymentEnabled: { type: 'boolean', default: true },
    logoUrl: { type: 'string', default: '' },
    showSpecialOffer: { type: 'boolean', default: true },
    specialOfferTagline: { type: 'string', default: 'FESTIVAL SPECIAL OFFER' },
    specialOfferTitle: { type: 'string', default: 'Enjoy Extra 10% Off on All Prepaid Orders' },
    specialOfferSubtitle: {
      type: 'string',
      default: 'Save on jewelry sets for upcoming festivals! Apply our coupon code at checkout to claim additional discounts.'
    },
    specialOfferCouponCode: { type: 'string', default: 'SHAMBHAVI10' },
    specialOfferDiscountPercentage: { type: 'number', default: 10 }
  }
});

export default Settings;

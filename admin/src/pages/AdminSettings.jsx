import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettingsThunk } from '../store/adminSlice';
import { 
  FiSettings, 
  FiBriefcase, 
  FiDollarSign, 
  FiTruck, 
  FiShare2, 
  FiCreditCard, 
  FiSave,
  FiUploadCloud,
  FiGift
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminSettings() {
  const dispatch = useDispatch();
  const { settings, loading } = useSelector((state) => state.admin);

  const [formData, setFormData] = useState({
    storeName: 'Shambhavi Imitation',
    contactEmail: 'contact@shambhaviimitation.com',
    contactPhone: '+91 98765 43210',
    address: 'Mumbai, Maharashtra, India',
    currency: 'INR',
    taxRate: 3,
    shippingCharge: 100,
    freeShippingThreshold: 1500,
    socialInstagram: '',
    socialFacebook: '',
    socialPinterest: '',
    codEnabled: true,
    onlinePaymentEnabled: true,
    logoUrl: '',
    showSpecialOffer: true,
    specialOfferTagline: 'FESTIVAL SPECIAL OFFER',
    specialOfferTitle: 'Enjoy Extra 10% Off on All Prepaid Orders',
    specialOfferSubtitle: 'Save on jewelry sets for upcoming festivals! Apply our coupon code at checkout to claim additional discounts.',
    specialOfferCouponCode: 'SHAMBHAVI10',
    specialOfferDiscountPercentage: 10
  });

  const [activeSection, setActiveSection] = useState("general"); // 'general', 'financials', 'payments', 'socials'

  useEffect(() => {
    dispatch(fetchSettings())
      .unwrap()
      .then((data) => {
        if (data) {
          setFormData({
            storeName: data.storeName || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            address: data.address || '',
            currency: data.currency || 'INR',
            taxRate: data.taxRate ?? 3,
            shippingCharge: data.shippingCharge ?? 100,
            freeShippingThreshold: data.freeShippingThreshold ?? 1500,
            socialInstagram: data.socialInstagram || '',
            socialFacebook: data.socialFacebook || '',
            socialPinterest: data.socialPinterest || '',
            codEnabled: data.codEnabled ?? true,
            onlinePaymentEnabled: data.onlinePaymentEnabled ?? true,
            logoUrl: data.logoUrl || '',
            showSpecialOffer: data.showSpecialOffer ?? true,
            specialOfferTagline: data.specialOfferTagline ?? 'FESTIVAL SPECIAL OFFER',
            specialOfferTitle: data.specialOfferTitle ?? 'Enjoy Extra 10% Off on All Prepaid Orders',
            specialOfferSubtitle: data.specialOfferSubtitle ?? 'Save on jewelry sets for upcoming festivals! Apply our coupon code at checkout to claim additional discounts.',
            specialOfferCouponCode: data.specialOfferCouponCode ?? 'SHAMBHAVI10',
            specialOfferDiscountPercentage: data.specialOfferDiscountPercentage ?? 10
          });
        }
      })
      .catch((err) => {
        toast.error(err || "Failed to load store settings.");
      });
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggle = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateSettingsThunk(formData))
      .unwrap()
      .then(() => {
        toast.success("Boutique settings saved and synced with live catalog endpoints.", { position: "bottom-center" });
      })
      .catch((err) => {
        toast.error(err || "Failed to save settings configurations.");
      });
  };

  const sections = [
    { id: 'general', label: 'Boutique Profile', icon: FiBriefcase },
    { id: 'financials', label: 'Financials & Delivery', icon: FiTruck },
    { id: 'payments', label: 'Payment Channels', icon: FiCreditCard },
    { id: 'promo', label: 'Promo Banner', icon: FiGift },
    { id: 'socials', label: 'Social Coordinates', icon: FiShare2 }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 border-b border-gold-100 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Store Settings</h1>
          <p className="text-xs text-secondary/60 font-sans mt-1">Configure operational taxes, delivery policies, payment checkouts, and brand profiles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Panel */}
        <div className="space-y-2 lg:col-span-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center px-4 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 border-l-4 cursor-pointer text-left ${
                  isActive
                    ? 'bg-primary/5 text-gold-600 border-gold-500 shadow-[inset_1px_0_0_rgba(197,160,89,0.1)]'
                    : 'text-secondary/70 border-transparent hover:bg-gold-50/20 hover:text-primary'
                }`}
              >
                <Icon className={`mr-3 shrink-0 ${isActive ? 'text-gold-500' : 'text-gold-400'}`} size={16} />
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Configurations Form Panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white border border-gold-200/40 shadow-sm p-6 sm:p-8 space-y-8 font-sans text-xs">
          
          {/* GENERAL: Boutique Profile */}
          {activeSection === "general" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-base font-bold text-primary tracking-wide mb-1">Boutique Profile Details</h3>
                <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-semibold">Store identity metadata settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Boutique Brand Name *</label>
                  <input
                    type="text"
                    required
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="Shambhavi Imitation"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Official Logo URL</label>
                  <input
                    type="url"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    placeholder="https://ik.imagekit.io/your_id/logo.png"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Customer Support Email *</label>
                  <input
                    type="email"
                    required
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Contact Phone Line *</label>
                  <input
                    type="text"
                    required
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Boutique Physical Address</label>
                  <textarea
                    rows="3"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FINANCIALS: Tax & Delivery charges */}
          {activeSection === "financials" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-base font-bold text-primary tracking-wide mb-1">Financial & Delivery Thresholds</h3>
                <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-semibold">Taxes, freight rates, and thresholds</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Standard Currency</label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹) Indian Rupee"
                    className="w-full bg-[#FAF9F5] border border-gold-200/50 p-2.5 text-secondary/60 cursor-not-allowed outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Standard GST / Tax Rate (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Standard Delivery Freight Fee (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    name="shippingCharge"
                    value={formData.shippingCharge}
                    onChange={handleChange}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Minimum Spend for Free Delivery (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    name="freeShippingThreshold"
                    value={formData.freeShippingThreshold}
                    onChange={handleChange}
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAYMENTS: Payment Methods Config */}
          {activeSection === "payments" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-base font-bold text-primary tracking-wide mb-1">Payment Method Configurations</h3>
                <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-semibold">Enable/disable boutique checkout gateways</p>
              </div>

              <div className="divide-y divide-gold-100 border border-gold-100 bg-[#FAF9F5]/40 text-left">
                {/* Cash on delivery */}
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-1 pr-6">
                    <h5 className="font-semibold text-primary text-xs m-0">Cash on Delivery (COD)</h5>
                    <p className="text-[10px] text-secondary/60">Allow clients to pay in cash upon receiving their luxury parcel.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('codEnabled')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
                      formData.codEnabled ? 'bg-gold-500' : 'bg-gold-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                        formData.codEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Credit card/Online options */}
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-1 pr-6">
                    <h5 className="font-semibold text-primary text-xs m-0">Online Payment Gateways</h5>
                    <p className="text-[10px] text-secondary/60">Accept credit cards, debit cards, UPI payments, and netbanking (via Razorpay integration).</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('onlinePaymentEnabled')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
                      formData.onlinePaymentEnabled ? 'bg-gold-500' : 'bg-gold-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                        formData.onlinePaymentEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROMO: Campaign Promo Banner settings */}
          {activeSection === "promo" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-base font-bold text-primary tracking-wide mb-1">Promo Banner & Campaigns</h3>
                <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-semibold">Manage homepage special offer banner and discount codes</p>
              </div>

              <div className="space-y-5 text-left">
                {/* Enable/Disable Toggle */}
                <div className="bg-[#faf9f6] border border-gold-200/50 p-4 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-sm font-bold text-primary block">Display Special Offer Banner</span>
                    <span className="text-[10px] text-secondary/60 leading-normal block mt-0.5">Toggle whether the promotional discount banner is visible to customers on the homepage.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('showSpecialOffer')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.showSpecialOffer ? 'bg-gold-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.showSpecialOffer ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Tagline *</label>
                    <input
                      type="text"
                      required
                      name="specialOfferTagline"
                      value={formData.specialOfferTagline}
                      onChange={handleChange}
                      placeholder="e.g. FESTIVAL SPECIAL OFFER"
                      className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Promo Coupon Code *</label>
                    <input
                      type="text"
                      required
                      name="specialOfferCouponCode"
                      value={formData.specialOfferCouponCode}
                      onChange={handleChange}
                      placeholder="e.g. SHAMBHAVI10"
                      className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Main Banner Title *</label>
                    <input
                      type="text"
                      required
                      name="specialOfferTitle"
                      value={formData.specialOfferTitle}
                      onChange={handleChange}
                      placeholder="e.g. Enjoy Extra 10% Off on All Prepaid Orders"
                      className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Discount Percentage (%) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      name="specialOfferDiscountPercentage"
                      value={formData.specialOfferDiscountPercentage}
                      onChange={handleChange}
                      placeholder="e.g. 10"
                      className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Description Subtitle *</label>
                  <textarea
                    required
                    rows="3"
                    name="specialOfferSubtitle"
                    value={formData.specialOfferSubtitle}
                    onChange={handleChange}
                    placeholder="Provide details about the coupon scope, terms, and where to apply it."
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SOCIALS: Social media settings */}
          {activeSection === "socials" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-base font-bold text-primary tracking-wide mb-1">Social Media Coordinates</h3>
                <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-semibold">Boutique social presence configurations</p>
              </div>

              <div className="grid grid-cols-1 gap-5 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Instagram Page URL</label>
                  <input
                    type="url"
                    name="socialInstagram"
                    value={formData.socialInstagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/shambhavi_imitation"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Facebook Page URL</label>
                  <input
                    type="url"
                    name="socialFacebook"
                    value={formData.socialFacebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/shambhaviimitation"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Pinterest Board URL</label>
                  <input
                    type="url"
                    name="socialPinterest"
                    value={formData.socialPinterest}
                    onChange={handleChange}
                    placeholder="https://pinterest.com/shambhaviimitation"
                    className="w-full bg-[#faf9f6] border border-gold-300 p-2.5 focus:border-gold-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-6 border-t border-gold-100 flex justify-end space-x-3.5">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-gold-600 text-white font-bold py-2.5 px-6 uppercase tracking-wider flex items-center transition-colors cursor-pointer"
            >
              <FiSave className="mr-2" size={16} />
              {loading ? "Saving Settings..." : "Save Boutique Configurations"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

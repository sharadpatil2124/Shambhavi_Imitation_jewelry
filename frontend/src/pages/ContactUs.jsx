import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend, FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ContactUs() {
  const { settings } = useSelector((state) => state.settings);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.warning("Please complete all required fields (Name, Email, Message).");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/enquiries', {
        name,
        email,
        phone,
        subject,
        message
      });
      toast.success(response.message || "✨ Your query has been successfully transmitted to our luxury concierge. We will respond within 12 hours!", { position: "bottom-center" });
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="text-center mb-16 select-none">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">
          CLIENT CONCIERGE
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-primary m-0 mb-3">
          Contact Customer Care
        </h1>
        <p className="text-secondary text-xs sm:text-sm font-sans max-w-lg mx-auto leading-relaxed">
          We are here to assist you with order placements, custom bridal designs, sizing lookups, or shipment progress queries.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row border border-gold-200/60 shadow-lg bg-white overflow-hidden">
        
        {/* Left Side: Contact Information Cards */}
        <div className="w-full lg:w-5/12 bg-gold-50/20 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-gold-100/50 flex flex-col justify-between">
          <div className="space-y-8">
            <h3 className="font-serif text-xl font-bold tracking-wide text-primary border-b border-gold-100 pb-2">
              Concierge Desk
            </h3>

            <ul className="space-y-6">
              <li className="flex items-start">
                <FiMapPin className="text-gold-600 mt-1 mr-4 flex-shrink-0" size={20} />
                <div className="text-left">
                  <strong className="block text-xs font-bold uppercase tracking-wider text-primary mb-1">Corporate Boutique</strong>
                  <span className="text-secondary text-sm leading-relaxed block">
                    {settings?.address || 'Shambhavi Imitation, Jubilee Hills Road No. 36, Hyderabad, Telangana, 500033'}
                  </span>
                </div>
              </li>

              <li className="flex items-start">
                <FiPhone className="text-gold-600 mt-1 mr-4 flex-shrink-0" size={20} />
                <div className="text-left">
                  <strong className="block text-xs font-bold uppercase tracking-wider text-primary mb-1">Boutique Telephones</strong>
                  <a href={`tel:${settings?.contactPhone || '+91 70838 74227'}`} className="text-secondary hover:text-gold-600 text-sm transition-colors block">
                    {settings?.contactPhone || '+91 70838 74227'}
                  </a>
                </div>
              </li>

              <li className="flex items-start">
                <FiMail className="text-gold-600 mt-1 mr-4 flex-shrink-0" size={20} />
                <div className="text-left">
                  <strong className="block text-xs font-bold uppercase tracking-wider text-primary mb-1">Email Queries</strong>
                  <a href={`mailto:${settings?.contactEmail || 'support@shambhaviimitation.com'}`} className="text-secondary hover:text-gold-600 text-sm transition-colors block">
                    {settings?.contactEmail || 'support@shambhaviimitation.com'}
                  </a>
                </div>
              </li>

              <li className="flex items-start">
                <FiClock className="text-gold-600 mt-1 mr-4 flex-shrink-0" size={20} />
                <div className="text-left">
                  <strong className="block text-xs font-bold uppercase tracking-wider text-primary mb-1">Operational Hours</strong>
                  <span className="text-secondary text-sm block">
                    Monday to Saturday: 10:00 AM – 7:00 PM IST
                  </span>
                  <span className="text-xs text-gold-600 font-semibold block mt-1 uppercase tracking-wide">
                    Sundays: Closed
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-8 border-t border-gold-100 mt-8 select-none">
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block mb-3">Connect on Social</span>
            <div className="flex space-x-3">
              <a href={settings?.socialInstagram || "#"} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-gold-200 text-gold-600 hover:text-white hover:bg-gold-500 hover:border-gold-500 transition-all rounded-none">
                <FiInstagram size={18} />
              </a>
              <a href={settings?.socialFacebook || "#"} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-gold-200 text-gold-600 hover:text-white hover:bg-gold-500 hover:border-gold-500 transition-all rounded-none">
                <FiFacebook size={18} />
              </a>
              <a href={settings?.socialPinterest || "#"} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-gold-200 text-gold-600 hover:text-white hover:bg-gold-500 hover:border-gold-500 transition-all rounded-none">
                <FiYoutube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Query Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12">
          <h3 className="font-serif text-xl font-bold tracking-wide text-primary border-b border-gold-100 pb-2 mb-6">
            Send an Enquiry
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Bridal Set Customization"
                  className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Detailed Message *</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your design, sizing query, or order customization request..."
                className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-primary hover:bg-gold-600 text-white font-bold py-4 px-8 text-xs tracking-widest uppercase transition-colors flex items-center justify-center space-x-2 shadow-xs ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <FiSend />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

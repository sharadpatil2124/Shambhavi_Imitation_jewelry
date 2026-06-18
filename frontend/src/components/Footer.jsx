import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiPhone, FiMail, FiMapPin, FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi';

export default function Footer() {
  const { settings } = useSelector((state) => state.settings);
  return (
    <footer className="bg-white border-t border-gold-200/80 pt-16 pb-8 text-primary relative">
      {/* Decorative Top Gold Border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Brand & Bio */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={settings?.logoUrl || "/logo.png"} 
                alt="Shambhavi Jewelry Logo" 
                className="w-10 h-10 object-contain rounded-full border border-gold-300 shadow-xs"
              />
              <div className="flex flex-col items-start text-left">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.18em] text-primary leading-none">
                  SHAMBHAVI
                </span>
                <span className="text-[8px] tracking-[0.3em] font-semibold text-gold-600 uppercase mt-0.5">
                  Imitation Jewelry
                </span>
              </div>
            </div>
            <p className="text-secondary text-sm font-sans leading-relaxed mb-6 max-w-xs">
              Shambhavi Imitation embodies modern elegance fused with rich Indian tradition. We bring you handcrafted, premium-quality bridal sets, heritage necklaces, and contemporary designs plated in 22k gold and studded with the finest Kundan and AD stones.
            </p>
            <div className="flex space-x-4">
              <a href={settings?.socialInstagram || "#"} target="_blank" rel="noopener noreferrer" className="p-2 border border-gold-200 text-gold-600 hover:text-white hover:bg-gold-500 hover:border-gold-500 transition-all duration-300 rounded-none">
                <FiInstagram size={18} />
              </a>
              <a href={settings?.socialFacebook || "#"} target="_blank" rel="noopener noreferrer" className="p-2 border border-gold-200 text-gold-600 hover:text-white hover:bg-gold-500 hover:border-gold-500 transition-all duration-300 rounded-none">
                <FiFacebook size={18} />
              </a>
              <a href={settings?.socialPinterest || "#"} target="_blank" rel="noopener noreferrer" className="p-2 border border-gold-200 text-gold-600 hover:text-white hover:bg-gold-500 hover:border-gold-500 transition-all duration-300 rounded-none">
                <FiYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-serif text-base font-semibold tracking-wider text-primary uppercase mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-[1px] after:bg-gold-500">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Home Page", path: "/" },
                { label: "Shop All Collections", path: "/shop" },
                { label: "Explore Categories", path: "/categories" },
                { label: "About Our Craft", path: "/about" },
                { label: "Contact Customer Care", path: "/contact" },
                { label: "Order Tracking", path: "/tracking" }
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-secondary hover:text-gold-600 text-sm font-sans tracking-wide transition-colors duration-200 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div>
            <h4 className="font-serif text-base font-semibold tracking-wider text-primary uppercase mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-[1px] after:bg-gold-500">
              Policies
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", path: "/privacy-policy" },
                { label: "Terms & Conditions", path: "/terms-conditions" },
                { label: "Return & Refund Policy", path: "/return-refund" }
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-secondary hover:text-gold-600 text-sm font-sans tracking-wide transition-colors duration-200 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-gold-100 pt-6">
              <h5 className="text-xs text-primary font-semibold tracking-wider uppercase mb-2">Customer Hours</h5>
              <p className="text-xs text-secondary font-medium">Mon - Sat: 10:00 AM - 7:00 PM</p>
              <p className="text-xs text-secondary font-medium mt-1">Sunday: Closed</p>
            </div>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="font-serif text-base font-semibold tracking-wider text-primary uppercase mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-[1px] after:bg-gold-500">
              Get in Touch
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start">
                <FiMapPin className="text-gold-600 mt-1 mr-3 flex-shrink-0" size={18} />
                <span className="text-secondary text-sm leading-relaxed">
                  {settings?.address || 'Shambhavi Imitation, Main Road, Kurani, Kagal, Kolhapur, 416219, Maharashtra, India.'}
                </span>
              </li>
              <li className="flex items-center">
                <FiPhone className="text-gold-600 mr-3 flex-shrink-0" size={18} />
                <a href={`tel:${settings?.contactPhone || '+91 70589 15328'}`} className="text-secondary hover:text-gold-600 text-sm transition-colors duration-200">
                  {settings?.contactPhone || '+91 70589 15328'}
                </a>
              </li>
              <li className="flex items-center">
                <FiMail className="text-gold-600 mr-3 flex-shrink-0" size={18} />
                <a href={`mailto:${settings?.contactEmail || 'support@shambhaviimitation.com'}`} className="text-secondary hover:text-gold-600 text-sm transition-colors duration-200">
                  {settings?.contactEmail || 'support@shambhaviimitation.com'}
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Payment Security icons */}
        <div className="border-t border-gold-100 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-secondary font-medium tracking-wide text-center md:text-left mb-4 md:mb-0">
            © {new Date().getFullYear()} Shambhavi Imitation Jewelry. All Rights Reserved. Crafted for premium luxury.
          </p>
          <div className="flex items-center space-x-3 opacity-80 select-none">
            <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider mr-2">Secure checkout via</span>
            <div className="bg-gold-50 border border-gold-200/50 px-2 py-1 text-[9px] font-bold text-primary tracking-wide">VISA</div>
            <div className="bg-gold-50 border border-gold-200/50 px-2 py-1 text-[9px] font-bold text-primary tracking-wide">MASTERCARD</div>
            <div className="bg-gold-50 border border-gold-200/50 px-2 py-1 text-[9px] font-bold text-primary tracking-wide">UPI</div>
            <div className="bg-gold-50 border border-gold-200/50 px-2 py-1 text-[9px] font-bold text-primary tracking-wide">COD</div>
          </div>
        </div>

      </div>
    </footer>
  );
}

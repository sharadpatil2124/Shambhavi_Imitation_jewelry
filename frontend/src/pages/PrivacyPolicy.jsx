import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in text-left">
      
      {/* Header */}
      <div className="border-b border-gold-100 pb-4 mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0">
          Privacy Policy
        </h1>
        <span className="text-xs text-secondary font-medium mt-2 block">
          Last Updated: May 18, 2026
        </span>
      </div>

      {/* Content */}
      <div className="bg-white border border-gold-200/60 p-6 sm:p-8 shadow-sm font-sans text-secondary text-sm space-y-6 leading-relaxed">
        
        <p className="text-primary font-medium">
          At Shambhavi Imitation, we hold our client relationships in the highest regard. This Privacy Policy documents how we securely collect, use, and protect your personal identification coordinates when browsing and placing orders through our online boutique.
        </p>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            1. Information We Securely Collect
          </h3>
          <p>
            When you register an account, place an order, or contact our customer concierge, we collect the necessary personal data you provide, including:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
            <li>Your name and contact phone number.</li>
            <li>Your billing and shipping destination addresses.</li>
            <li>Your email address for transaction invoicing.</li>
            <li>Secure tokenized payment details (we never store raw credit card numbers or UPI PINs on our servers).</li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            2. How We Utilize Your Data
          </h3>
          <p>
            We process your coordinates solely to complete your luxury orders and elevate your shopping experience. Specifically, this includes:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
            <li>Processing payments and shipping your handcrafted pieces.</li>
            <li>Providing order tracking notifications (via email and SMS).</li>
            <li>Offering quick customer care consultation via our concierge desks and WhatsApp channels.</li>
            <li>Sending curated styling tips and coupon discounts (only if explicitly subscribed to our newsletter list).</li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            3. Payment Encryption and Security
          </h3>
          <p>
            Your online security is paramount. Our e-commerce portal utilizes 256-bit Secure Socket Layer (SSL) encryption to safeguard all checkout transactions. We work with leading tokenized payment gateways that conform to PCI-DSS Level 1 specifications, guaranteeing your financial details are processed securely and privately.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            4. Cookie and Analytics Usage
          </h3>
          <p>
            Our website uses subtle browser cookies to remember the contents of your shopping cart, preserve your active wishlist items, and analyze traffic patterns to optimize performance. You can disable cookies inside your browser settings, though doing so might restrict certain dynamic cart functionalities.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            5. Legal Disclosures
          </h3>
          <p>
            Shambhavi Imitation will never sell, lease, or distribute your private client information to third-party marketing brokers. Your data is only shared with authorized logistics partners (e.g. SF Express courier networks) to complete the physical delivery of your order. Secure payment tokenization prevents any raw credit card numbers or UPI credentials from storing on our local servers.
          </p>
        </div>

        <div className="border-t border-gold-100 pt-6">
          <p className="font-medium text-primary">
            If you have questions regarding our data collection policies or wish to request the deletion of your account history, please connect directly with our legal officer at <a href="mailto:privacy@shambhaviimitation.com" className="text-gold-600 font-semibold hover:underline">privacy@shambhaviimitation.com</a>.
          </p>
        </div>

      </div>

    </div>
  );
}

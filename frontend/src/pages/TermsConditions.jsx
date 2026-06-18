import React from 'react';

export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in text-left">
      
      {/* Header */}
      <div className="border-b border-gold-100 pb-4 mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0">
          Terms & Conditions
        </h1>
        <span className="text-xs text-secondary font-medium mt-2 block">
          Last Updated: May 18, 2026
        </span>
      </div>

      {/* Content */}
      <div className="bg-white border border-gold-200/60 p-6 sm:p-8 shadow-sm font-sans text-secondary text-sm space-y-6 leading-relaxed">
        
        <p className="text-primary font-medium">
          Welcome to the digital boutique of Shambhavi Imitation. By accessing, browsing, or buying from our e-commerce portal, you explicitly agree to comply with and be bound by the following Terms & Conditions. Please review them carefully before placing orders.
        </p>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            1. Intellectual Property Protection
          </h3>
          <p>
            All custom jewelry designs, catalog photography, brand logos, layouts, and copy text displayed on this website are the exclusive intellectual property of Shambhavi Imitation. Any unauthorized reproduction, commercial distribution, or imitation of our handcrafted masterpieces will be subject to strict legal recourse under Indian Intellectual Property laws.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            2. Product Descriptions & Visual Variation
          </h3>
          <p>
            Every piece in our catalog is handcrafted by traditional jewelry artisans. Because of this artisanal nature, slight variations in enamel chasing, Kundan glass positioning, or pearl bead shading may occur. We make every effort to display product colors and textures with absolute realism. However, slight screen calibration variations might impact display tones.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            3. Pricing and Invoicing Updates
          </h3>
          <p>
            Shambhavi Imitation reserves the right to revise product prices, launch seasonal promotional discounts, or update shipping terms at any time without prior announcement. While we strive to ensure zero pricing errors, if a pricing mistake occurs on a confirmed order, we will notify you immediately and give you the choice of reconfirming at the correct value or receiving a full refund.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            4. Secure Client Accounts
          </h3>
          <p>
            When registering an account in the Shambhavi Circle, you are responsible for maintaining the confidentiality of your login passwords. You agree to take full responsibility for all activities, shopping cart orders, and address updates executed under your authenticated account dashboard.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            5. Purchase Contract & Delivery
          </h3>
          <p>
            Your order submission constitutes a purchase request. A binding contract is finalized only once our operations team confirms product availability and dispatches the shipment tracking number. Shambhavi Imitation is not liable for logistics delays arising from severe weather, customs inspections, or incorrect shipping addresses provided by the buyer.
          </p>
        </div>

        <div className="border-t border-gold-100 pt-6">
          <p className="font-medium text-primary">
            If you have questions regarding our e-commerce terms or want to query commercial usage licences, please write to our legal team at <a href="mailto:legal@shambhaviimitation.com" className="text-gold-600 font-semibold hover:underline">legal@shambhaviimitation.com</a>.
          </p>
        </div>

      </div>

    </div>
  );
}

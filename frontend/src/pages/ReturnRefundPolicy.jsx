import React from 'react';
import { useSelector } from 'react-redux';

export default function ReturnRefundPolicy() {
  const { settings } = useSelector((state) => state.settings);
  const formattedPhone = settings?.contactPhone || '+91 70838 74227';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in text-left">
      
      {/* Header */}
      <div className="border-b border-gold-100 pb-4 mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0">
          Return & Refund Policy
        </h1>
        <span className="text-xs text-secondary font-medium mt-2 block">
          Last Updated: May 18, 2026
        </span>
      </div>

      {/* Content */}
      <div className="bg-white border border-gold-200/60 p-6 sm:p-8 shadow-sm font-sans text-secondary text-sm space-y-6 leading-relaxed">
        
        <p className="text-primary font-medium">
          At Shambhavi Imitation, we stand firmly behind the superior craftsmanship of our luxury jewelry. If your order does not meet your expectations, we offer a seamless, client-first Return and Refund window.
        </p>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            1. Our 7-Day Replacement Policy
          </h3>
          <p>
            We provide a <strong>7-Day Replacement / Return window</strong> starting from the day the logistics courier marks your order as "Delivered". If you receive a piece with transit damage, stone dislodgement, or manufacturing defects, we will gladly arrange a swift doorstep exchange or issue a full store credit.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            2. Return Eligibility Criteria
          </h3>
          <p>
            To ensure secure return processing, the jewelry pieces must conform to the following standards:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
            <li>The jewelry piece must be entirely unworn and free of cosmetic perfume sprays or water damage.</li>
            <li>All items must be returned inside their original protective velvet-lined jewelry cases and bubble wraps.</li>
            <li>The security authenticity tag affixed to the necklace or earring loop must remain intact.</li>
            <li>Customized bridal sets or bespoke items made to custom sizing measurements are ineligible for standard change-of-mind returns.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            3. Step-by-Step Return Process
          </h3>
          <div className="space-y-3 mt-2 pl-2">
            <p>
              <strong>Step 1: File Your Claim</strong><br />
              Email our concierge desk at <a href="mailto:returns@shambhaviimitation.com" className="text-gold-600 font-semibold hover:underline">returns@shambhaviimitation.com</a> or message us on WhatsApp ({formattedPhone}) within 48 hours of delivery, attaching 2-3 clear photographs of the defect or jewelry condition.
            </p>
            <p>
              <strong>Step 2: Courier Collection Setup</strong><br />
              Once our QC desk authorizes the claim, we will schedule a secure reverse pickup at our cost. Our logistics partner will collect the boxed shipment from your doorstep.
            </p>
            <p>
              <strong>Step 3: Quality Review</strong><br />
              Upon arrival at our corporate Hyderabad boutique, our senior silversmiths will verify the tags and condition of the pieces.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-base font-bold text-primary mb-2 uppercase tracking-wide">
            4. Refund Timelines
          </h3>
          <p>
            Once our silversmiths authorize the return:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
            <li><strong>Prepaid Transactions:</strong> The refund will be credited directly to your original payment account (UPI, Credit Card, Bank Account) within <strong>5-7 business days</strong>.</li>
            <li><strong>Cash on Delivery (COD) Transactions:</strong> Our accounts desk will contact you to request secure UPI coordinates or bank account details, and issue the transfer within <strong>5 working days</strong>.</li>
          </ul>
        </div>

        <div className="border-t border-gold-100 pt-6">
          <p className="font-medium text-primary">
            If you need immediate support with a pending exchange request, please connect directly with our returns concierge on WhatsApp or email <a href="mailto:returns@shambhaviimitation.com" className="text-gold-600 font-semibold hover:underline">returns@shambhaviimitation.com</a>.
          </p>
        </div>

      </div>

    </div>
  );
}

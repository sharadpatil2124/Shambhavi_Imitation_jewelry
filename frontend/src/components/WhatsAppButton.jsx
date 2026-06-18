import React from 'react';
import { useSelector } from 'react-redux';
import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppButton() {
  const { settings } = useSelector((state) => state.settings);
  const whatsappNumber = settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : "917083874227";
  const message = "Hi Shambhavi Imitation! I am browsing your gorgeous online jewelry boutique and would love to ask a question or place an order.";
  const encodedMessage = encodeURIComponent(message);
  
  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${encodedMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 sm:bottom-6 sm:right-6 z-40 bg-[#25d366] text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group flex items-center justify-center animate-bounce"
      style={{ animationDuration: '3s' }}
      title="Chat on WhatsApp"
    >
      {/* Tooltip */}
      <span className="absolute right-full mr-3 bg-white text-primary text-xs font-semibold py-1.5 px-3 shadow-md border border-gold-200/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none tracking-wide select-none">
        Order on WhatsApp ✨
      </span>
      <FaWhatsapp size={24} className="sm:w-7 sm:h-7" />
    </a>
  );
}

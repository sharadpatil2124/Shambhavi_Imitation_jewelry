import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiTruck, FiBox, FiCheckCircle, FiPackage, FiAlertCircle, FiRotateCcw, FiPrinter, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getImageUrl } from '../utils/image';
import { generateRefundPDF } from '../utils/refundPdf';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  const [orderIdInput, setOrderIdInput] = useState("");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [queriedOrder, setQueriedOrder] = useState(null);
  const [isSearched, setIsSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-sync logged-in user email
  useEffect(() => {
    if (user?.email && !emailInput) {
      setEmailInput(user.email);
    }
  }, [user]);

  // Execute tracking query against backend
  const fetchTracking = async (orderId, identifier) => {
    const cleanId = (orderId || "").trim();
    if (!cleanId) {
      toast.warning("Please enter your Order ID.");
      return;
    }

    setLoading(true);
    setIsSearched(true);

    try {
      const response = await api.post('/orders/track', {
        orderId: cleanId,
        identifier: (identifier || "").trim()
      });

      if (response && response.success && response.order) {
        const o = response.order;
        setQueriedOrder({
          id: o._id,
          date: new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: o.orderStatus,
          total: o.totalPrice,
          paymentMethod: o.paymentMethod,
          isPaid: o.isPaid,
          isRefunded: o.isRefunded,
          refundAmount: o.refundAmount,
          refundReason: o.refundReason,
          refundedAt: o.refundedAt,
          refundTransactionId: o.refundTransactionId,
          courierName: o.courierName || 'Standard Express',
          trackingId: o.trackingNumber || o.trackingId || '',
          deliveredAt: o.deliveredAt,
          destination: o.shippingAddress ? `${o.shippingAddress.city || ''}, ${o.shippingAddress.state || ''}` : '',
          items: (o.orderItems || []).map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            color: item.color,
            size: item.size
          }))
        });
      } else {
        setQueriedOrder(null);
      }
    } catch (err) {
      setQueriedOrder(null);
      toast.error(err.message || "Order not found. Please verify the Order ID and Email/Phone.");
    } finally {
      setLoading(false);
    }
  };

  // Check URL query parameters on mount
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      setOrderIdInput(orderIdParam);
      fetchTracking(orderIdParam, emailInput);
    }
  }, [searchParams]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    fetchTracking(orderIdInput, emailInput);
  };

  // Get active step index for stepper progress bar
  const getActiveStep = (status) => {
    switch (status) {
      case "Pending":
      case "Confirmed":
        return 0;
      case "Processing":
        return 1;
      case "Dispatched":
      case "Shipped":
      case "OutForDelivery":
      case "In Transit":
        return 2;
      case "Delivered":
        return 3;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="border-b border-gold-100 dark:border-gold-950/60 pb-4 mb-8 text-center select-none">
        <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-2 block font-sans">
          REAL-TIME SHIPMENTS
        </span>
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary dark:text-white m-0">
          Track Your Order
        </h1>
        <p className="text-secondary dark:text-gray-300 text-xs sm:text-sm max-w-md mx-auto leading-normal mt-2">
          Monitor your luxury jewelry shipment. Enter your 24-digit Order ID and registered Email or Phone below.
        </p>
      </div>

      {/* Query Search Form */}
      <div className="bg-white dark:bg-[#0c0a06] border border-gold-200/50 dark:border-gold-900/40 p-6 shadow-sm mb-10 relative">
        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-gold-400/50 pointer-events-none z-10"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-gold-400/50 pointer-events-none z-10"></div>

        <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-20">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">
              Order ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 64b1f2e9a5d3c800..."
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-4 text-xs font-mono focus:border-gold-500 text-primary dark:text-white outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2">
              Email or Phone
            </label>
            <input
              type="text"
              placeholder="Registered Email or Phone"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-[#faf9f6] dark:bg-[#100d07] border border-gold-300 dark:border-gold-900/60 py-3 px-4 text-xs font-sans focus:border-gold-500 text-primary dark:text-white outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center space-x-2 border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white disabled:opacity-50"
          >
            <FiSearch />
            <span>{loading ? "Searching..." : "Track Progress"}</span>
          </button>
        </form>
      </div>

      {/* Query Search Results */}
      {isSearched && (
        queriedOrder ? (
          <div className="bg-white dark:bg-[#0c0a06] border border-gold-200/50 dark:border-gold-900/40 p-6 sm:p-8 shadow-sm space-y-8 relative">
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-gold-400/50 pointer-events-none z-10"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-gold-400/50 pointer-events-none z-10"></div>

            {/* Order status card headers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gold-100 dark:border-gold-950/60 font-sans text-xs text-secondary dark:text-gray-300 font-medium relative z-20">
              <div className="space-y-1 text-left">
                <div>
                  Order Status:{' '}
                  <span className={`inline-block px-2 py-0.5 rounded-xs font-bold uppercase text-[10px] tracking-wider ml-1 ${
                    queriedOrder.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                    queriedOrder.status === 'Refunded' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                    queriedOrder.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' :
                    queriedOrder.status === 'Shipped' || queriedOrder.status === 'Dispatched' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}>
                    {queriedOrder.status}
                  </span>
                </div>
                <div className="font-mono text-secondary/70 dark:text-gray-400">Order ID: #{queriedOrder.id}</div>
              </div>
              <div className="mt-2 sm:mt-0 text-left sm:text-right">
                <span>Placed Date: <strong>{queriedOrder.date}</strong></span>
                <span className="block">Grand Total: <strong className="text-primary dark:text-white font-bold">₹{queriedOrder.total.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            {/* Dispatch / Courier Card if Shipped */}
            {queriedOrder.trackingId && (
              <div className="bg-[#FAF8F2] dark:bg-[#13100a] border border-gold-300/70 dark:border-gold-900/50 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-20">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 block">Courier Dispatch Details</span>
                  <p className="text-xs text-primary dark:text-white font-semibold m-0">
                    Partner: <span className="font-bold">{queriedOrder.courierName}</span>
                  </p>
                  <p className="text-xs text-secondary dark:text-gray-300 font-mono m-0">
                    AWB Tracking: <span className="font-bold text-gold-800 dark:text-gold-300">{queriedOrder.trackingId}</span>
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-white dark:bg-gold-950/40 border border-gold-200 dark:border-gold-900/60 rounded-xs text-[10px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-300">
                  Carrier Status: Dispatched
                </div>
              </div>
            )}

            {/* Stepper Progress Bar or Cancelled/Refunded Banners */}
            {queriedOrder.status === 'Refunded' ? (
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 p-4 rounded-sm text-center relative z-20 space-y-2">
                <p className="text-purple-800 dark:text-purple-300 font-bold text-xs uppercase tracking-wider m-0 flex items-center justify-center space-x-1.5">
                  <FiRotateCcw className="text-purple-600 dark:text-purple-400" />
                  <span>This order has been Refunded (₹{(queriedOrder.refundAmount || queriedOrder.total).toLocaleString('en-IN')})</span>
                </p>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-350 font-sans m-0">
                  {queriedOrder.refundReason ? `Reason: "${queriedOrder.refundReason}". ` : ''}The refund payment has been returned to your original payment method and inventory restocked.
                </p>
                {queriedOrder.refundTransactionId && (
                  <p className="text-[10px] font-mono text-purple-600 dark:text-purple-400/80 m-0">
                    Refund Transaction Reference: {queriedOrder.refundTransactionId}
                  </p>
                )}
                <div className="pt-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => generateRefundPDF(queriedOrder)}
                    className="inline-flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-sm transition-colors"
                  >
                    <FiPrinter size={13} />
                    <span>Download Refund Receipt (PDF)</span>
                  </button>
                </div>
              </div>
            ) : queriedOrder.status === 'Cancelled' ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-sm text-center relative z-20">
                <p className="text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider m-0">
                  This order was cancelled. Items have been restocked in inventory.
                </p>
              </div>
            ) : (
              <div className="py-6 select-none relative z-20">
                <div className="relative flex items-center justify-between w-full">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 dark:bg-gold-950/40 z-0"></div>
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gold-500 z-0 transition-all duration-500"
                    style={{ width: `${(getActiveStep(queriedOrder.status) / 3) * 100}%` }}
                  ></div>

                  {[
                    { icon: <FiPackage />, label: "Confirmed", desc: "Order booked" },
                    { icon: <FiBox />, label: "Processing", desc: "Handcrafted & packed" },
                    { icon: <FiTruck />, label: "In Transit", desc: "Handed to courier" },
                    { icon: <FiCheckCircle />, label: "Delivered", desc: "Package handed over" }
                  ].map((step, idx) => {
                    const isActive = getActiveStep(queriedOrder.status) >= idx;
                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isActive 
                            ? 'bg-gold-500 border-gold-500 text-white shadow-md' 
                            : 'bg-white dark:bg-[#100d07] border-gray-200 dark:border-gold-900/40 text-secondary dark:text-gray-400'
                        }`}>
                          {step.icon}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold mt-2.5 ${isActive ? 'text-primary dark:text-gold-200' : 'text-secondary dark:text-gray-400'}`}>
                          {step.label}
                        </span>
                        <span className="text-[8px] sm:text-[9px] text-secondary dark:text-gray-500 font-medium mt-0.5 hidden sm:block">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shipment Items Table */}
            <div className="border-t border-gold-100 dark:border-gold-950/60 pt-6 relative z-20">
              <h4 className="font-serif text-sm font-bold text-primary dark:text-white mb-4">Shipment Contents</h4>
              <div className="space-y-4">
                {queriedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center space-x-3 max-w-[75%]">
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-12 h-12 object-cover border border-gold-100 dark:border-gold-900/40" />
                      <div className="text-left">
                        <span className="font-serif font-bold text-primary dark:text-white line-clamp-1">{item.name}</span>
                        <span className="text-xs text-secondary dark:text-gray-400 font-medium">
                          Quantity: {item.quantity} {item.color ? `| Color: ${item.color}` : ''} {item.size ? `| Size: ${item.size}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {(queriedOrder.status === 'Refunded' || queriedOrder.isRefunded) && (
                        <button
                          type="button"
                          onClick={() => generateRefundPDF(queriedOrder, item)}
                          className="inline-flex items-center space-x-1 text-purple-700 dark:text-purple-300 hover:text-white hover:bg-purple-700 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-1 rounded-xs text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                          title={`Download refund receipt PDF for ${item.name}`}
                        >
                          <FiFileText size={11} />
                          <span>Product Refund PDF</span>
                        </button>
                      )}
                      <span className="font-bold text-primary dark:text-white font-sans">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support section */}
            <div className="border-t border-gold-100 dark:border-gold-950/60 pt-6 bg-gold-50/20 dark:bg-gold-950/10 p-4 border border-gold-100/30 dark:border-gold-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 select-none relative z-20">
              <div className="text-left">
                <span className="text-xs font-bold text-primary dark:text-white uppercase block">Need instant logistics assistance?</span>
                <span className="text-[11px] text-secondary dark:text-gray-400 font-medium">Connect directly with our concierge team on WhatsApp with your Order ID.</span>
              </div>
              <a
                href={`https://wa.me/${settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : '917083874227'}?text=Hi%20Shambhavi%20Imitation!%20I%20would%20like%20updates%20on%20my%20order%20ID%20${queriedOrder.id}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#20ba5a] hover:bg-[#1bb052] text-white font-bold py-2.5 px-5 text-[10px] tracking-widest uppercase transition-colors cursor-pointer shrink-0"
              >
                Query via WhatsApp
              </a>
            </div>

          </div>
        ) : (
          <div className="bg-white dark:bg-[#0c0a06] border border-gold-200/50 dark:border-gold-900/40 p-12 text-center select-none relative">
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-gold-400/50 pointer-events-none z-10"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-gold-400/50 pointer-events-none z-10"></div>
            
            <FiAlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
            <h3 className="font-serif text-lg font-bold text-primary dark:text-white mb-2 relative z-20">Order Not Located</h3>
            <p className="text-secondary dark:text-gray-300 text-xs font-sans max-w-md mx-auto mb-0 relative z-20">
              We couldn't locate any records matching Order ID <strong className="text-primary dark:text-gold-300 font-mono">"{orderIdInput}"</strong>. Please ensure the 24-digit Order ID and matching Email/Phone are accurate.
            </p>
          </div>
        )
      )}

    </div>
  );
}

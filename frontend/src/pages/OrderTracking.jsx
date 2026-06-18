import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiTruck, FiBox, FiCheckCircle, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getImageUrl } from '../utils/image';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  const [orderIdInput, setOrderIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [queriedOrder, setQueriedOrder] = useState(null);
  const [isSearched, setIsSearched] = useState(false);

  // Check URL query parameters on mount
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      setOrderIdInput(orderIdParam);
      setIsSearched(true);

      if (!/^[0-9a-fA-F]{24}$/.test(orderIdParam)) {
        if (orderIdParam.toUpperCase() === "ORD-99120") {
          setQueriedOrder({
            id: "ORD-99120",
            date: "2026-05-15",
            status: "In Transit",
            total: 11848,
            paymentMethod: "Credit Card",
            trackingId: "SF987654321IN",
            items: [
              { name: "Exquisite Temple Work Kasu Mala", quantity: 1, price: 8499, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop" }
            ]
          });
        } else if (orderIdParam.toUpperCase() === "ORD-99827") {
          setQueriedOrder({
            id: "ORD-99827",
            date: "2026-05-10",
            status: "Delivered",
            total: 4599,
            paymentMethod: "UPI",
            trackingId: "SF123456789IN",
            items: [
              { name: "Classic 22k Gold Plated Kada Bangles (Set of 2)", quantity: 1, price: 4599, image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600&auto=format&fit=crop" }
            ]
          });
        } else {
          setQueriedOrder(null);
        }
        return;
      }

      api.get(`/orders/${orderIdParam}`)
        .then(response => {
          const order = response.order;
          setQueriedOrder({
            id: order._id,
            date: new Date(order.createdAt).toLocaleDateString('en-IN'),
            status: order.orderStatus,
            total: order.totalPrice,
            paymentMethod: order.paymentMethod,
            trackingId: order.trackingNumber || order.trackingId || 'Pending',
            items: order.orderItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image
            }))
          });
        })
        .catch(err => {
          console.error("Tracking lookup failed:", err);
          setQueriedOrder(null);
          toast.error(err.message || "Could not retrieve order details.");
        });
    }
  }, [searchParams, isAuthenticated]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    setIsSearched(true);

    const queryId = orderIdInput.trim();
    if (!queryId) {
      toast.warning("Please enter a valid Order ID.");
      return;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(queryId)) {
      // fallback simulation for generic orders (e.g. if the user isn't logged in but wants to check demo ORD-99120)
      if (queryId.toUpperCase() === "ORD-99120") {
        setQueriedOrder({
          id: "ORD-99120",
          date: "2026-05-15",
          status: "In Transit",
          total: 11848,
          paymentMethod: "Credit Card",
          trackingId: "SF987654321IN",
          items: [
            { name: "Exquisite Temple Work Kasu Mala", quantity: 1, price: 8499, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop" }
          ]
        });
      } else if (queryId.toUpperCase() === "ORD-99827") {
        setQueriedOrder({
          id: "ORD-99827",
          date: "2026-05-10",
          status: "Delivered",
          total: 4599,
          paymentMethod: "UPI",
          trackingId: "SF123456789IN",
          items: [
            { name: "Classic 22k Gold Plated Kada Bangles (Set of 2)", quantity: 1, price: 4599, image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600&auto=format&fit=crop" }
          ]
        });
      } else {
        setQueriedOrder(null);
        toast.error("Order ID not found in system. Please verify details.");
      }
      return;
    }

    api.get(`/orders/${queryId}`)
      .then(response => {
        const order = response.order;
        setQueriedOrder({
          id: order._id,
          date: new Date(order.createdAt).toLocaleDateString('en-IN'),
          status: order.orderStatus,
          total: order.totalPrice,
          paymentMethod: order.paymentMethod,
          trackingId: order.trackingNumber || order.trackingId || 'Pending',
          items: order.orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image
          }))
        });
      })
      .catch(err => {
        setQueriedOrder(null);
        toast.error(err.message || "Order not found in database.");
      });
  };

  // Get active step index for stepper progress bar
  const getActiveStep = (status) => {
    switch (status) {
      case "Confirmed":
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
      <div className="border-b border-gold-100 pb-4 mb-8 text-center select-none">
        <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-2 block font-sans">
          REAL-TIME SHIPMENTS
        </span>
        <h1 className="font-serif text-3xl font-bold tracking-wide text-primary m-0">
          Track Your Order
        </h1>
        <p className="text-secondary text-xs sm:text-sm max-w-md mx-auto leading-normal mt-2">
          Monitor your jewelry shipment. Enter your unique order code below to track delivery updates.
        </p>
      </div>

      {/* Query Search Form */}
      <div className="bg-white border border-gold-200/60 p-6 shadow-sm mb-10">
        <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Order ID</label>
            <input
              type="text"
              required
              placeholder="e.g. ORD-99120"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-mono focus:border-gold-500 outline-none uppercase"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Customer Email</label>
            <input
              type="email"
              placeholder="devi.sharan@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-[#faf9f6] border border-gold-300 py-3 px-4 text-sm font-sans focus:border-gold-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            <FiSearch />
            <span>Track Progress</span>
          </button>
        </form>
        <div className="mt-3 text-center sm:text-left select-none">
          <span className="text-[10px] text-secondary font-medium">
            Demo Tip: Try searching for pre-populated code <strong className="text-gold-700 font-mono">ORD-99120</strong> (In Transit) or <strong className="text-gold-700 font-mono">ORD-99827</strong> (Delivered).
          </span>
        </div>
      </div>

      {/* Query Search Results */}
      {isSearched && (
        queriedOrder ? (
          <div className="bg-white border border-gold-200 p-6 sm:p-8 shadow-sm space-y-8">
            
            {/* Order status card headers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gold-100 font-sans text-xs text-secondary font-medium">
              <div className="space-y-1 text-left">
                <span>Order Status: <strong className="text-gold-700 font-bold uppercase">{queriedOrder.status}</strong></span>
                <span className="block">SF Tracking ID: <strong className="text-primary font-mono">{queriedOrder.trackingId}</strong></span>
              </div>
              <div className="mt-2 sm:mt-0 text-left sm:text-right">
                <span>Placed Date: <strong>{queriedOrder.date}</strong></span>
                <span className="block">Grand Total: <strong className="text-primary font-bold">₹{queriedOrder.total.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="py-6 select-none">
              <div className="relative flex items-center justify-between w-full">
                
                {/* Horizontal progress bar backgrounds */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0"></div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gold-500 z-0 transition-all duration-500"
                  style={{ width: `${(getActiveStep(queriedOrder.status) / 3) * 100}%` }}
                ></div>

                {/* Steps mapping */}
                {[
                  { icon: <FiPackage />, label: "Confirmed", desc: "Order verified" },
                  { icon: <FiBox />, label: "Quality Check", desc: "Handcraft review" },
                  { icon: <FiTruck />, label: "In Transit", desc: "On courier way" },
                  { icon: <FiCheckCircle />, label: "Delivered", desc: "Package signed" }
                ].map((step, idx) => {
                  const isActive = getActiveStep(queriedOrder.status) >= idx;
                  return (
                    <div key={idx} className="relative z-10 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isActive 
                          ? 'bg-gold-500 border-gold-500 text-white shadow-md' 
                          : 'bg-white border-gray-200 text-secondary'
                      }`}>
                        {step.icon}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-bold mt-2.5 ${isActive ? 'text-primary' : 'text-secondary'}`}>
                        {step.label}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-secondary font-medium mt-0.5 hidden sm:block">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Shipment Items Table */}
            <div className="border-t border-gold-100 pt-6">
              <h4 className="font-serif text-sm font-bold text-primary mb-4">Shipment Manifest</h4>
              <div className="space-y-4">
                {queriedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center space-x-3 max-w-[80%]">
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-12 h-12 object-cover border border-gold-100" />
                      <div className="text-left">
                        <span className="font-serif font-bold text-primary line-clamp-1">{item.name}</span>
                        <span className="text-xs text-secondary font-medium">Quantity: {item.quantity} | Price: ₹{item.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <span className="font-bold text-primary font-sans">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support section */}
            <div className="border-t border-gold-100 pt-6 bg-gold-50/20 p-4 border border-gold-100/30 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              <div className="text-left">
                <span className="text-xs font-bold text-primary uppercase block">Need instant logistics help?</span>
                <span className="text-[11px] text-secondary font-medium">Connect directly with our courier liaison team on WhatsApp.</span>
              </div>
              <a
                href={`https://wa.me/${settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : '917083874227'}?text=Hi%20Shambhavi%20Imitation!%20I%20would%20like%20updates%20on%20my%20order%20ID%20${queriedOrder.id}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-2.5 px-5 text-[10px] tracking-widest uppercase transition-colors"
              >
                Query via WhatsApp
              </a>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-gold-200 p-12 text-center select-none">
            <h3 className="font-serif text-lg font-bold text-primary mb-2">Order Not Located</h3>
            <p className="text-secondary text-sm font-sans mb-0">
              We couldn't locate any records matching Order ID <strong className="text-primary font-mono">"{orderIdInput}"</strong>. Please ensure the code is correct and try again.
            </p>
          </div>
        )
      )}

    </div>
  );
}

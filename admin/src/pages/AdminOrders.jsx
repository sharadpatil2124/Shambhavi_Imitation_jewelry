import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOrdersThunk, 
  updateOrderStatusThunk, 
  refundOrderThunk 
} from '../store/adminSlice';
import adminService from '../services/adminService';
import { 
  FiSearch, 
  FiEye, 
  FiPrinter, 
  FiTruck, 
  FiCreditCard, 
  FiX, 
  FiRotateCcw, 
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { orders, ordersPage, ordersPages, totalOrdersCount, loading } = useSelector((state) => state.admin);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Update state form
  const [statusForm, setStatusForm] = useState("");
  const [trackingIdForm, setTrackingIdForm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = () => {
    const params = {
      page,
      limit: 10,
      search,
      status: statusFilter
    };
    dispatch(fetchOrdersThunk(params));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setStatusForm(order.orderStatus);
    setTrackingIdForm(order.trackingId || "");
    setIsDetailOpen(true);
    
    // Fetch fresh details from database
    try {
      const response = await adminService.getOrderDetails(order._id);
      if (response.success) {
        setSelectedOrder(response.order);
      }
    } catch (error) {
      console.warn("Could not fetch fresh order detail logs:", error.message);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setActionLoading(true);
    try {
      const result = await dispatch(updateOrderStatusThunk({
        id: selectedOrder._id,
        status: statusForm,
        trackingId: trackingIdForm
      })).unwrap();

      setSelectedOrder(result);
      toast.success(`Order status updated to ${statusForm} successfully.`);
      loadOrders();
    } catch (error) {
      toast.error(error || "Failed to update order status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to trigger a refund for this order? The payment status will be marked as refunded in database logs.")) return;

    setActionLoading(true);
    try {
      const result = await dispatch(refundOrderThunk(selectedOrder._id)).unwrap();
      setSelectedOrder(result);
      toast.success("Order marked as REFUNDED successfully.");
      loadOrders();
    } catch (error) {
      toast.error(error || "Failed to process refund logs.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to cancel this order? This action is permanent.")) return;

    setActionLoading(true);
    try {
      const result = await dispatch(updateOrderStatusThunk({
        id: selectedOrder._id,
        status: "Cancelled"
      })).unwrap();
      setSelectedOrder(result);
      toast.success("Order CANCELLED successfully.");
      loadOrders();
    } catch (error) {
      toast.error(error || "Failed to cancel order.");
    } finally {
      setActionLoading(false);
    }
  };

  const printInvoice = () => {
    if (!selectedOrder) return;
    
    const printContent = document.getElementById("invoice-print-area").innerHTML;
    const originalContent = document.body.innerHTML;
    
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Invoice - Shambhavi Imitation</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: 'Inter', sans-serif; color: #333; padding: 40px; line-height: 1.5; }
      .brand-title { font-family: 'Poppins', serif; font-size: 24px; color: #1e293b; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
      .brand-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #d97706; font-weight: 600; margin-bottom: 25px; }
      .section-divider { border-bottom: 1px solid #e2e8f0; margin: 20px 0; }
      .invoice-meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; }
      .invoice-meta-col { display: flex; flex-direction: column; }
      .invoice-meta-label { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #64748b; margin-bottom: 5px; }
      .addr-text { font-size: 12px; color: #334155; }
      table { width: 100%; border-collapse: collapse; margin-top: 30px; }
      th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; padding: 10px; text-align: left; }
      td { border-bottom: 1px solid #f1f5f9; padding: 12px 10px; font-size: 12px; color: #334155; }
      .text-right { text-align: right; }
      .totals-row { font-size: 13px; font-weight: 600; }
      .totals-final { font-size: 16px; font-weight: bold; color: #d97706; border-top: 2px solid #e2e8f0; }
      .footer-note { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; font-style: italic; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FiClock className="text-amber-500" />;
      case 'Confirmed': return <FiCheckCircle className="text-indigo-500" />;
      case 'Processing': return <FiClock className="text-blue-500" />;
      case 'Shipped': return <FiTruck className="text-sky-500" />;
      case 'Delivered': return <FiCheckCircle className="text-emerald-500" />;
      case 'Cancelled': return <FiX className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Order Operations</h1>
        <p className="text-xs text-secondary/60 font-sans mt-1">Review active pipeline requests, print invoices, and update delivery tracking logs.</p>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-gold-200/50 p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID database code or client name..."
              className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-12 pr-4 text-xs font-sans outline-none focus:border-gold-500"
            />
          </div>

          {/* Status filter selection */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 px-4 text-xs font-sans outline-none focus:border-gold-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex space-x-2">
            {/* Search Button */}
            <button
              type="submit"
              className="flex-1 bg-gold-600 hover:bg-primary text-white font-bold py-2.5 px-4 text-xs tracking-wider uppercase transition-colors text-center cursor-pointer"
            >
              Apply Filter
            </button>
            
            {/* Reset Filters */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-transparent hover:bg-gold-50 border border-gold-300 text-gold-700 font-bold py-2.5 px-3 text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gold-200/40 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-secondary/60">Loading order registry...</p>
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#FAF8F2] border-b border-gold-150 text-secondary/60 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer details</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Payment</th>
                  <th className="p-4 text-center">Courier</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Operational Step</th>
                  <th className="p-4 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50">
                {orders.map((order) => {
                  const itemsCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  
                  return (
                    <tr key={order._id} className="hover:bg-gold-50/10 transition-colors">
                      <td className="p-4 font-mono font-bold text-gold-700">
                        {order._id.substring(18).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-primary">{order.shippingAddress?.name || order.user?.name || 'Guest User'}</p>
                        <p className="text-[10px] text-secondary/50">{order.user?.email || order.shippingAddress?.phone || 'No Email'}</p>
                      </td>
                      <td className="p-4 text-secondary/70">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                          order.isPaid 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {order.isPaid ? 'PAID' : 'PENDING'}
                        </span>
                        {order.paymentInfo?.refunded && (
                          <span className="block text-[8px] font-bold text-red-500 uppercase mt-0.5">Refunded</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {order.trackingId ? (
                          <div className="font-sans text-[10px]">
                            <p className="font-semibold text-primary">{order.trackingId}</p>
                            <p className="text-secondary/50">In Transit</p>
                          </div>
                        ) : (
                          <span className="text-secondary/40 font-mono">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-primary">₹{order.totalPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-secondary/50">{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {getStatusIcon(order.orderStatus)}
                          <span>{order.orderStatus}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="flex items-center justify-center mx-auto text-secondary hover:text-gold-600 font-semibold py-1 px-2.5 bg-[#FAF8F2] border border-gold-200/50 rounded-sm cursor-pointer"
                        >
                          <FiEye className="mr-1.5" size={13} /> Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-secondary/50">
            <p className="text-sm">No client orders recorded in database collections.</p>
          </div>
        )}

        {/* Pagination bar */}
        {ordersPages > 1 && (
          <div className="bg-[#FAF8F2] border-t border-gold-200/50 px-6 py-4 flex items-center justify-between font-sans text-xs">
            <span className="text-secondary/60 font-semibold">
              Showing page <strong className="text-primary">{ordersPage}</strong> of <strong className="text-primary">{ordersPages}</strong>
            </span>
            <div className="flex space-x-1.5">
              <button
                disabled={ordersPage === 1}
                onClick={() => setPage(ordersPage - 1)}
                className="bg-white border border-gold-250 p-2 text-gold-600 disabled:opacity-40 hover:bg-gold-50 cursor-pointer rounded-sm"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                disabled={ordersPage === ordersPages}
                onClick={() => setPage(ordersPage + 1)}
                className="bg-white border border-gold-250 p-2 text-gold-600 disabled:opacity-40 hover:bg-gold-50 cursor-pointer rounded-sm"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ORDER DETAILS & MODERATION DRAWER / MODAL */}
      {/* ========================================================================= */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-gold-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-none animate-scale-up">
            
            {/* Header */}
            <div className="bg-[#FAF8F2] border-b border-gold-200/55 p-4 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary tracking-wide">
                  Order Management Panel
                </h3>
                <p className="text-[10px] font-mono text-secondary/60 mt-0.5">Database ID: {selectedOrder._id}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left font-sans text-xs">
              {/* Left Column: Info & Action Controllers */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Pipeline Timeline Status */}
                <div className="bg-white border border-gold-150 p-5">
                  <h4 className="font-serif text-xs font-bold text-primary uppercase tracking-wider mb-3">Order Status Steps</h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-secondary/40 font-mono">
                    <div className={`p-1.5 border-b-2 ${selectedOrder.orderStatus !== 'Cancelled' ? 'border-emerald-500 text-emerald-600 font-sans' : 'border-gold-100'}`}>Pending</div>
                    <div className={`p-1.5 border-b-2 ${['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(selectedOrder.orderStatus) ? 'border-emerald-500 text-emerald-600 font-sans' : 'border-gold-100'}`}>Confirmed</div>
                    <div className={`p-1.5 border-b-2 ${['Processing', 'Shipped', 'Delivered'].includes(selectedOrder.orderStatus) ? 'border-emerald-500 text-emerald-600 font-sans' : 'border-gold-100'}`}>Processing</div>
                    <div className={`p-1.5 border-b-2 ${['Shipped', 'Delivered'].includes(selectedOrder.orderStatus) ? 'border-emerald-500 text-emerald-600 font-sans' : 'border-gold-100'}`}>Shipped</div>
                    <div className={`p-1.5 border-b-2 ${selectedOrder.orderStatus === 'Delivered' ? 'border-emerald-500 text-emerald-600 font-sans' : 'border-gold-100'}`}>Delivered</div>
                  </div>
                  {selectedOrder.orderStatus === 'Cancelled' && (
                    <div className="bg-red-50 border border-red-100 p-2 text-center text-red-600 font-bold tracking-wide uppercase mt-3">
                      Order Cancelled / Rejected
                    </div>
                  )}
                </div>

                {/* 2. Order Items */}
                <div className="bg-white border border-gold-150 p-5">
                  <h4 className="font-serif text-xs font-bold text-primary uppercase tracking-wider mb-3">Purchase Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans border-collapse">
                      <thead>
                        <tr className="border-b border-gold-100 text-secondary/50 font-semibold text-[10px] uppercase">
                          <th className="pb-2 w-16">Image</th>
                          <th className="pb-2">Jewelry item</th>
                          <th className="pb-2 text-center">Color/Size</th>
                          <th className="pb-2 text-right">Price</th>
                          <th className="pb-2 text-center">Qty</th>
                          <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold-50">
                        {selectedOrder.orderItems?.map((item, index) => {
                          const p = item.product;
                          const image = p?.images?.[0] || 'https://via.placeholder.com/60?text=No+Image';
                          return (
                            <tr key={index}>
                              <td className="py-2.5">
                                <img src={image} alt="jewelry" className="w-10 h-10 object-cover border border-gold-100" />
                              </td>
                              <td className="py-2.5">
                                <p className="font-semibold text-primary">{item.name}</p>
                                <p className="text-[9px] font-mono text-secondary/50">SKU: {p?.sku || 'N/A'}</p>
                              </td>
                              <td className="py-2.5 text-center font-bold text-secondary/70">
                                {item.color || '-'}/{item.size || '-'}
                              </td>
                              <td className="py-2.5 text-right font-semibold">₹{item.price.toLocaleString()}</td>
                              <td className="py-2.5 text-center font-semibold">{item.quantity}</td>
                              <td className="py-2.5 text-right font-bold text-primary">₹{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Shipping address & client profile */}
                <div className="bg-white border border-gold-150 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-serif text-xs font-bold text-primary uppercase tracking-wider mb-2">Shipping Destination</h4>
                    <p className="font-semibold text-primary">{selectedOrder.shippingAddress?.name}</p>
                    <p className="text-secondary/70 mt-1 leading-relaxed text-[11px]">
                      {selectedOrder.shippingAddress?.street}, <br />
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode} <br />
                      Country: {selectedOrder.shippingAddress?.country || 'India'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-serif text-xs font-bold text-primary uppercase tracking-wider mb-2">Customer Profile</h4>
                    <p className="font-semibold text-primary">{selectedOrder.user?.name || 'Guest User'}</p>
                    <p className="text-secondary/70 font-sans mt-0.5">Email: {selectedOrder.user?.email || 'N/A'}</p>
                    <p className="text-secondary/70 font-sans mt-0.5">Phone: {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || 'N/A'}</p>
                    <p className="text-secondary/50 text-[10px] mt-2">Database user ID: {selectedOrder.user?._id || 'N/A'}</p>
                  </div>
                </div>

              </div>

              {/* Right Column: Modifier forms & Invoicing */}
              <div className="space-y-6">
                
                {/* 1. Status modifier control */}
                <div className="bg-white border border-gold-200/60 p-5 shadow-sm">
                  <h4 className="font-serif text-xs font-bold text-primary uppercase tracking-wider mb-4 border-b border-gold-100 pb-2">Operational Controls</h4>
                  
                  <form onSubmit={handleStatusChange} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1.5">Change Delivery Status</label>
                      <select
                        value={statusForm}
                        onChange={(e) => setStatusForm(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-gold-300 p-2 text-xs font-sans outline-none focus:border-gold-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {statusForm === 'Shipped' && (
                      <div>
                        <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1.5">Courier Tracking ID</label>
                        <input
                          type="text"
                          required
                          value={trackingIdForm}
                          onChange={(e) => setTrackingIdForm(e.target.value)}
                          placeholder="e.g. BLUEDART-12345"
                          className="w-full bg-[#faf9f6] border border-gold-300 p-2 text-xs font-sans outline-none focus:border-gold-500"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-gold-600 hover:bg-primary text-white font-bold py-2 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      {actionLoading ? "Updating..." : "Commit status update"}
                    </button>
                  </form>

                  <div className="border-t border-gold-100 mt-4 pt-4 space-y-2">
                    {selectedOrder.isPaid && !selectedOrder.paymentInfo?.refunded && (
                      <button
                        onClick={handleRefund}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center bg-red-50 text-red-650 border border-red-200/50 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <FiRotateCcw className="mr-2" /> Refund Order
                      </button>
                    )}
                    
                    {selectedOrder.orderStatus !== 'Delivered' && selectedOrder.orderStatus !== 'Cancelled' && (
                      <button
                        onClick={handleCancelOrder}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center bg-transparent border border-red-250 py-2 text-xs font-bold text-red-650 hover:bg-red-55 transition-colors cursor-pointer"
                      >
                        <FiX className="mr-2" /> Cancel Purchase
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Mini invoice layout with printing */}
                <div className="bg-[#FAF8F2] border border-gold-200 p-5 text-secondary">
                  <h4 className="font-serif text-xs font-bold text-primary uppercase tracking-wider mb-3">Invoice Details</h4>
                  
                  <div className="space-y-2 pb-3 border-b border-gold-200/55 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span>Items subtotal:</span>
                      <span>₹{(selectedOrder.totalPrice - selectedOrder.shippingPrice - selectedOrder.taxPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (3% Jewelry):</span>
                      <span>₹{selectedOrder.taxPrice?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Charge:</span>
                      <span>₹{selectedOrder.shippingPrice?.toLocaleString() || '0'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 font-serif text-sm font-bold text-primary">
                    <span>Final Amount:</span>
                    <span>₹{selectedOrder.totalPrice.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={printInvoice}
                    className="w-full flex items-center justify-center bg-primary hover:bg-gold-650 text-white font-bold py-2.5 text-xs uppercase tracking-wider cursor-pointer mt-2"
                  >
                    <FiPrinter className="mr-2" /> Print PDF Invoice
                  </button>
                </div>

              </div>
            </div>

            {/* Hidden invoice content used for printing */}
            <div id="invoice-print-area" className="hidden">
              {selectedOrder && (
                <div>
                  <div className="brand-title">Shambhavi Imitation Jewelry</div>
                  <div className="brand-sub">Luxury Jewelry eCommerce</div>
                  
                  <div className="section-divider"></div>
                  
                  <div className="invoice-meta">
                    <div className="invoice-meta-col">
                      <span className="invoice-meta-label">Invoice Number</span>
                      <span>INV-{selectedOrder._id.substring(12).toUpperCase()}</span>
                    </div>
                    <div className="invoice-meta-col">
                      <span className="invoice-meta-label">Date of Issue</span>
                      <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="invoice-meta-col">
                      <span className="invoice-meta-label">Payment Method</span>
                      <span>{selectedOrder.paymentMethod || 'UPI/Card'}</span>
                    </div>
                    <div className="invoice-meta-col">
                      <span className="invoice-meta-label">Payment Status</span>
                      <span>{selectedOrder.isPaid ? 'PAID' : 'PENDING'}</span>
                    </div>
                  </div>
                  
                  <div className="section-divider"></div>
                  
                  <div className="invoice-meta">
                    <div className="invoice-meta-col" style={{ width: '48%' }}>
                      <span className="invoice-meta-label">Customer / Ship-to</span>
                      <span className="addr-text">
                        <strong>{selectedOrder.shippingAddress?.name}</strong> <br />
                        {selectedOrder.shippingAddress?.street}, <br />
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode} <br />
                        Phone: {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || 'N/A'}
                      </span>
                    </div>
                    <div className="invoice-meta-col" style={{ width: '48%' }}>
                      <span className="invoice-meta-label">Shipped From / Seller</span>
                      <span className="addr-text">
                        <strong>Shambhavi Imitation Inc.</strong> <br />
                        Jubilee Hills Complex, Gold Bazaar St, <br />
                        Mumbai, Maharashtra, 400001 <br />
                        GSTIN: 27AAAAA1111A1Z1
                      </span>
                    </div>
                  </div>
                  
                  <table>
                    <thead>
                      <tr>
                        <th>Jewelry piece description</th>
                        <th className="text-right">Unit Price</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th className="text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.orderItems?.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{item.name}</strong> <br />
                            <span style={{ fontSize: '10px', color: '#64748b' }}>Attributes: Color - {item.color || 'Gold'}, Size - {item.size || 'Standard'}</span>
                          </td>
                          <td className="text-right">₹{item.price.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td className="text-right">₹{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                      
                      <tr className="totals-row">
                        <td colSpan="2"></td>
                        <td>Subtotal:</td>
                        <td className="text-right">₹{(selectedOrder.totalPrice - selectedOrder.shippingPrice - selectedOrder.taxPrice).toLocaleString()}</td>
                      </tr>
                      <tr className="totals-row">
                        <td colSpan="2"></td>
                        <td>Jewelry GST (3%):</td>
                        <td className="text-right">₹{selectedOrder.taxPrice?.toLocaleString() || '0'}</td>
                      </tr>
                      <tr className="totals-row">
                        <td colSpan="2"></td>
                        <td>Shipping Charge:</td>
                        <td className="text-right">₹{selectedOrder.shippingPrice?.toLocaleString() || '0'}</td>
                      </tr>
                      <tr className="totals-row totals-final">
                        <td colSpan="2"></td>
                        <td>Grand Total:</td>
                        <td className="text-right">₹{selectedOrder.totalPrice.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="footer-note">
                    Thank you for choosing Shambhavi Imitation. For returns or support, please contact help@shambhaviimitation.com.
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

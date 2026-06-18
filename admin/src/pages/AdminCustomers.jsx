import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, fetchUserDetails } from '../store/adminSlice';
import { 
  FiSearch, 
  FiX, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiShoppingBag, 
  FiDollarSign, 
  FiMapPin, 
  FiChevronLeft, 
  FiChevronRight, 
  FiEye,
  FiArrowUpRight,
  FiTrendingUp
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminCustomers() {
  const dispatch = useDispatch();
  const { users, totalUsersCount, usersPage, usersPages, selectedUser, selectedUserOrders, loading } = useSelector((state) => state.admin);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, search }));
  }, [dispatch, currentPage, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset page to 1 on search
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= usersPages) {
      setCurrentPage(page);
    }
  };

  const openCustomerDetails = (userId) => {
    setSelectedUserId(userId);
    dispatch(fetchUserDetails(userId))
      .unwrap()
      .then(() => {
        setIsDrawerOpen(true);
      })
      .catch((err) => {
        toast.error(err || "Failed to load customer details.");
      });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUserId(null);
  };

  // Safe Indian currency formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Customers</h1>
          <p className="text-xs text-secondary/60 font-sans mt-1">Monitor registered customer profiles, purchasing analytics, and address lists.</p>
        </div>
      </div>

      {/* Analytics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gold-200/40 p-5 shadow-[0_2px_10px_rgba(240,235,220,0.15)] flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-gold-600 border border-gold-200/30">
            <FiUser size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider font-sans">Total Clients</p>
            <h4 className="text-xl font-bold text-primary font-serif tracking-wide">{totalUsersCount || users.length} Accounts</h4>
          </div>
        </div>

        <div className="bg-white border border-gold-200/40 p-5 shadow-[0_2px_10px_rgba(240,235,220,0.15)] flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100">
            <FiTrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider font-sans">High Value Customers</p>
            <h4 className="text-xl font-bold text-primary font-serif tracking-wide">
              {users.filter(u => u.totalSpent > 15000).length} Clients
            </h4>
          </div>
        </div>

        <div className="bg-white border border-gold-200/40 p-5 shadow-[0_2px_10px_rgba(240,235,220,0.15)] flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100">
            <FiShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider font-sans">Repeat Purchases</p>
            <h4 className="text-xl font-bold text-primary font-serif tracking-wide">
              {users.filter(u => u.orderCount > 1).length} Active Buyers
            </h4>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gold-200/50 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by client name, email, or telephone..."
            className="w-full bg-[#faf9f6] border border-gold-300 py-2.5 pl-12 pr-4 text-xs font-sans outline-none focus:border-gold-500"
          />
        </div>
        <div className="text-[10px] text-secondary/60 uppercase tracking-wider font-bold">
          Showing {users.length} of {totalUsersCount} registrations
        </div>
      </div>

      {/* Customers Table */}
      {loading && users.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-secondary/60">Fetching customer profiles...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white border border-gold-200/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-gold-100 bg-[#FAF8F2] text-secondary/50 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Signed Up</th>
                  <th className="p-4 text-center">Total Orders</th>
                  <th className="p-4 text-right">Total Contribution</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50 text-secondary">
                {users.map((client) => (
                  <tr key={client._id} className="hover:bg-gold-50/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gold-100 text-gold-700 font-serif font-bold text-sm flex items-center justify-center border border-gold-200/40">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-primary text-xs">{client.name}</p>
                          <span className="text-[10px] font-mono text-secondary/50">ID: {client._id.substring(18).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="flex items-center text-[11px] text-secondary/80">
                          <FiMail className="mr-1.5 text-gold-500" size={12} /> {client.email}
                        </p>
                        {client.phone && (
                          <p className="flex items-center text-[10px] text-secondary/60">
                            <FiPhone className="mr-1.5 text-gold-500" size={11} /> {client.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-secondary/70">
                      <p className="flex items-center">
                        <FiCalendar className="mr-1.5 text-gold-400" size={12} />
                        {new Date(client.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 bg-[#FAF8F2] border border-gold-200/50 text-gold-700 font-bold font-mono">
                        {client.orderCount}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-primary font-sans">
                      {formatCurrency(client.totalSpent)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openCustomerDetails(client._id)}
                        className="inline-flex items-center justify-center p-2 bg-[#FAF8F2] border border-gold-200 hover:bg-gold-50 text-gold-700 hover:text-gold-800 transition-colors font-semibold cursor-pointer rounded-sm"
                        title="View Customer Profile"
                      >
                        <FiEye size={14} className="mr-1" /> Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {usersPages > 1 && (
            <div className="px-6 py-4 bg-[#FAF8F2] border-t border-gold-100 flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center text-xs font-semibold text-secondary/70 hover:text-primary disabled:opacity-40 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="mr-1.5" size={16} /> Previous
              </button>
              <div className="flex space-x-1.5">
                {[...Array(usersPages).keys()].map((p) => (
                  <button
                    key={p + 1}
                    onClick={() => handlePageChange(p + 1)}
                    className={`w-7 h-7 text-xs font-bold border transition-colors ${
                      currentPage === p + 1 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-secondary hover:bg-gold-50 border-gold-200'
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === usersPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center text-xs font-semibold text-secondary/70 hover:text-primary disabled:opacity-40 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                Next <FiChevronRight className="ml-1.5" size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center text-secondary/50 border border-dashed border-gold-200 bg-white">
          <FiUser size={32} className="mx-auto mb-2 text-gold-300" />
          <p className="text-sm font-semibold">No customer accounts match your search.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER DETAILS SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeDrawer} />

          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-xl bg-white border-l border-gold-200 shadow-2xl flex flex-col justify-between animate-slide-left">
              
              {/* Drawer Header */}
              <div className="h-20 bg-[#FAF8F2] border-b border-gold-200/55 px-6 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-serif text-base font-bold text-primary tracking-wide">Client Profile Dossier</h3>
                  <p className="text-[10px] text-secondary/60 uppercase tracking-widest font-sans mt-0.5">Admin Analytics Registry</p>
                </div>
                <button onClick={closeDrawer} className="text-secondary/60 hover:text-primary transition-colors cursor-pointer p-1">
                  <FiX size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Profile overview */}
                <div className="flex items-center space-x-4 border-b border-gold-100 pb-5">
                  <div className="w-16 h-16 rounded-full bg-gold-600 text-white font-serif font-bold text-2xl flex items-center justify-center border border-gold-300 shadow-sm">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-primary tracking-wide">{selectedUser.name}</h4>
                    <p className="text-xs text-gold-600 font-bold uppercase tracking-wider mt-0.5">{selectedUser.role} client</p>
                    <p className="text-[10px] font-mono text-secondary/50 mt-1">UUID: {selectedUser._id}</p>
                  </div>
                </div>

                {/* 2. Contact details card */}
                <div className="bg-gold-50/20 border border-gold-200/40 p-4 space-y-2.5">
                  <h5 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 font-sans border-b border-gold-100 pb-1">Communication Coordinates</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-secondary/50 uppercase block">Email Address</span>
                      <span className="font-semibold text-primary select-all">{selectedUser.email}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-secondary/50 uppercase block">Telephone Number</span>
                      <span className="font-semibold text-primary select-all">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Address details */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-secondary uppercase tracking-wider font-sans border-b border-gold-100 pb-1.5">Registered Shipping Address</h5>
                  {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedUser.addresses.map((addr, idx) => (
                        <div key={idx} className="bg-white border border-gold-100 p-3.5 flex items-start space-x-3 shadow-xs">
                          <FiMapPin className="text-gold-500 shrink-0 mt-0.5" size={14} />
                          <div className="text-xs space-y-1">
                            <p className="font-semibold text-primary">{addr.street}</p>
                            <p className="text-secondary/80">{addr.city}, {addr.state} - {addr.postalCode}</p>
                            <p className="text-secondary/60 font-medium">Country: {addr.country}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-secondary/40 border border-dashed border-gold-100 bg-[#FAF9F5]/40 text-xs">
                      <p>No registered delivery address coordinates found for this profile.</p>
                    </div>
                  )}
                </div>

                {/* 4. Order History */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-secondary uppercase tracking-wider font-sans border-b border-gold-100 pb-1.5">Order Purchase Log ({selectedUserOrders?.length || 0})</h5>
                  {selectedUserOrders && selectedUserOrders.length > 0 ? (
                    <div className="space-y-3">
                      {selectedUserOrders.map((order) => (
                        <div key={order._id} className="bg-white border border-gold-200/50 p-4 space-y-3 shadow-xs">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono text-gold-700 font-bold uppercase tracking-wider">#{order._id.substring(18).toUpperCase()}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                              order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          
                          {/* Order Products */}
                          <div className="divide-y divide-gold-50/50 text-[11px] text-secondary">
                            {order.orderItems?.map((item, idx) => (
                              <div key={idx} className="py-1.5 flex justify-between items-center">
                                <span>{item.name} <strong className="text-secondary/60">x {item.quantity}</strong></span>
                                <span className="font-semibold text-primary">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-gold-50 pt-2 flex justify-between items-center text-xs">
                            <span className="text-[10px] text-secondary/40 font-mono">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                            <div className="text-right">
                              <span className="text-[10px] text-secondary/50 font-bold block">Total Amount</span>
                              <span className="font-bold text-primary">₹{order.totalPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-secondary/40 border border-dashed border-gold-100 bg-[#FAF9F5]/40 text-xs">
                      <p>This user has not placed any orders yet.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="h-20 border-t border-gold-100 bg-[#FAF8F2] px-6 flex items-center justify-between shrink-0">
                <div className="text-xs">
                  <span className="text-[10px] text-secondary/50 uppercase block font-bold">Contribution Aggregate</span>
                  <strong className="text-base text-primary font-serif font-bold">
                    {formatCurrency(selectedUserOrders?.filter(o => o.isPaid).reduce((sum, o) => sum + o.totalPrice, 0) || 0)}
                  </strong>
                </div>
                <button
                  onClick={closeDrawer}
                  className="bg-primary hover:bg-gold-600 text-white font-bold py-2.5 px-6 text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

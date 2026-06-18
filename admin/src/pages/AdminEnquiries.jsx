import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiTrash2, 
  FiMail, 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight,
  FiUser,
  FiPhone,
  FiFileText,
  FiEye,
  FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Selected enquiry for details modal
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Fetch enquiries on component mount
  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/enquiries');
      if (response.success) {
        setEnquiries(response.enquiries || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDeleteEnquiry = async (id, name, e) => {
    e.stopPropagation(); // Avoid opening the modal when clicking delete
    if (window.confirm(`Are you sure you want to permanently delete the enquiry from ${name}?`)) {
      try {
        const response = await api.delete(`/enquiries/${id}`);
        if (response.success) {
          toast.success("Enquiry deleted successfully.", { position: 'bottom-center' });
          setEnquiries(enquiries.filter(enq => enq._id !== id));
          if (selectedEnquiry?._id === id) {
            setSelectedEnquiry(null);
          }
        }
      } catch (err) {
        toast.error(err.message || "Failed to delete enquiry.");
      }
    }
  };

  // Filter enquiries based on search query
  const filteredEnquiries = enquiries.filter(enq => {
    const q = search.toLowerCase();
    return (
      enq.name?.toLowerCase().includes(q) ||
      enq.email?.toLowerCase().includes(q) ||
      enq.phone?.toLowerCase().includes(q) ||
      enq.subject?.toLowerCase().includes(q) ||
      enq.message?.toLowerCase().includes(q)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Customer Enquiries</h1>
          <p className="text-xs text-secondary/60 font-sans mt-1">Review, inspect, or manage messages and design custom requests sent through the client concierge desk.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-gold-200/50 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, subject, or message..."
            className="w-full bg-[#faf9f6] border border-gold-300 py-2 pl-12 pr-4 text-xs font-sans outline-none focus:border-gold-500"
          />
        </div>
        
        <div className="text-[10px] font-bold text-gold-700 tracking-wider uppercase bg-gold-50 px-3 py-1.5 border border-gold-200/50">
          Total Messages: {filteredEnquiries.length}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-secondary/60">Retrieving concierge enquiries...</p>
        </div>
      ) : paginatedEnquiries.length > 0 ? (
        <div className="bg-white border border-gold-200/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-gold-100 bg-[#FAF8F2] text-secondary/50 uppercase font-semibold text-[10px] tracking-wider select-none">
                  <th className="p-4">Sender Details</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Message Snippet</th>
                  <th className="p-4">Received Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50 text-secondary">
                {paginatedEnquiries.map((enq) => (
                  <tr 
                    key={enq._id} 
                    onClick={() => setSelectedEnquiry(enq)}
                    className="hover:bg-gold-50/15 cursor-pointer transition-colors"
                  >
                    {/* Sender Details Cell */}
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-primary text-xs flex items-center mb-0.5">
                          <FiUser className="mr-1.5 text-gold-500" size={11} /> {enq.name}
                        </p>
                        <p className="text-[10px] text-secondary/60 font-medium flex items-center mb-0.5">
                          <FiMail className="mr-1.5 text-gold-400" size={10} /> {enq.email}
                        </p>
                        {enq.phone && (
                          <p className="text-[10px] text-secondary/50 flex items-center">
                            <FiPhone className="mr-1.5 text-gold-400" size={10} /> {enq.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Subject Cell */}
                    <td className="p-4 font-semibold text-primary/90 max-w-[150px] truncate">
                      {enq.subject || <span className="text-secondary/40 italic font-normal">No Subject</span>}
                    </td>

                    {/* Message Snippet Cell */}
                    <td className="p-4 max-w-xs truncate italic text-secondary/80">
                      "{enq.message}"
                    </td>

                    {/* Date Received Cell */}
                    <td className="p-4 text-secondary/70 whitespace-nowrap">
                      <p className="flex items-center text-[11px]">
                        <FiCalendar className="mr-1.5 text-gold-400" size={12} />
                        {new Date(enq.createdAt).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>

                    {/* Actions Cell */}
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedEnquiry(enq)}
                          className="p-1.5 bg-gold-50/50 border border-gold-200/50 text-gold-700 hover:bg-gold-100 hover:text-gold-900 rounded-sm transition-colors cursor-pointer"
                          title="View Entire Message"
                        >
                          <FiEye size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteEnquiry(enq._id, enq.name, e)}
                          className="p-1.5 bg-red-50/50 border border-red-200/50 text-red-650 hover:bg-red-100 hover:text-red-800 rounded-sm transition-colors cursor-pointer"
                          title="Delete Enquiry Entry"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-[#FAF8F2] border-t border-gold-100 flex items-center justify-between select-none">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center text-xs font-semibold text-secondary/70 hover:text-primary disabled:opacity-40 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="mr-1.5" size={16} /> Previous
              </button>
              <div className="flex space-x-1.5">
                {[...Array(totalPages).keys()].map((p) => (
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
                disabled={currentPage === totalPages}
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
          <FiMail size={32} className="mx-auto mb-2 text-gold-300" />
          <p className="text-sm font-semibold">No customer enquiries found matching criteria.</p>
        </div>
      )}

      {/* Detail Modal Dialog Popup */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedEnquiry(null)}>
          <div 
            className="bg-white border border-gold-200 w-full max-w-lg shadow-2xl relative animate-scale-up text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#FAF8F2] border-b border-gold-150 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FiMail className="text-gold-600" size={18} />
                <span className="font-serif text-sm font-bold text-primary uppercase tracking-wider">Enquiry Details</span>
              </div>
              <button 
                onClick={() => setSelectedEnquiry(null)}
                className="text-secondary/50 hover:text-secondary hover:bg-gold-100/40 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider block mb-0.5">Sender Name</span>
                  <div className="flex items-center text-primary font-medium text-xs">
                    <FiUser className="mr-1.5 text-gold-500 shrink-0" size={13} />
                    {selectedEnquiry.name}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider block mb-0.5">Received Date & Time</span>
                  <div className="flex items-center text-primary/80 font-medium text-xs">
                    <FiCalendar className="mr-1.5 text-gold-500 shrink-0" size={13} />
                    {new Date(selectedEnquiry.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider block mb-0.5">Email Address</span>
                  <a 
                    href={`mailto:${selectedEnquiry.email}`}
                    className="flex items-center text-gold-700 hover:text-gold-900 font-semibold text-xs transition-colors"
                  >
                    <FiMail className="mr-1.5 shrink-0" size={13} />
                    {selectedEnquiry.email}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider block mb-0.5">Phone Number</span>
                  {selectedEnquiry.phone ? (
                    <a 
                      href={`tel:${selectedEnquiry.phone}`}
                      className="flex items-center text-gold-700 hover:text-gold-900 font-semibold text-xs transition-colors"
                    >
                      <FiPhone className="mr-1.5 shrink-0" size={13} />
                      {selectedEnquiry.phone}
                    </a>
                  ) : (
                    <span className="text-secondary/40 text-xs italic">Not Provided</span>
                  )}
                </div>
              </div>

              <div className="border-t border-gold-100 pt-4">
                <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider block mb-1">Subject Header</span>
                <div className="bg-[#FAF8F2] border border-gold-200/40 p-2.5 font-semibold text-xs text-primary flex items-center">
                  <FiFileText className="mr-2 text-gold-500" size={14} />
                  {selectedEnquiry.subject || <span className="font-normal italic text-secondary/40">No Subject Header Specified</span>}
                </div>
              </div>

              <div className="border-t border-gold-100 pt-4">
                <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider block mb-1">Concierge Enquiry Message</span>
                <div className="bg-[#FDFCF9] border border-gold-150 p-4 font-sans text-xs text-primary leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto select-text italic">
                  "{selectedEnquiry.message}"
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FAF8F2] border-t border-gold-150 flex justify-end space-x-3">
              <a 
                href={`mailto:${selectedEnquiry.email}?subject=Reply to Enquiry: ${encodeURIComponent(selectedEnquiry.subject || '')}`}
                className="bg-primary hover:bg-gold-600 text-white font-bold py-2 px-4 text-xs tracking-widest uppercase transition-colors flex items-center space-x-1.5"
              >
                <FiMail size={12} />
                <span>Write Response Email</span>
              </a>
              <button 
                onClick={() => setSelectedEnquiry(null)}
                className="bg-white border border-gold-200 text-secondary hover:bg-gold-50 font-semibold py-2 px-4 text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

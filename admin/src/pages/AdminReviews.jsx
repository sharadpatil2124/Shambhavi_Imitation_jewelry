import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviewsThunk, toggleReviewApprovalThunk, deleteReviewThunk } from '../store/adminSlice';
import { 
  FiSearch, 
  FiTrash2, 
  FiCheckCircle, 
  FiXCircle, 
  FiStar, 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight,
  FiShoppingBag,
  FiUser
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminReviews() {
  const dispatch = useDispatch();
  const { reviews, totalReviewsCount, reviewsPage, reviewsPages, loading } = useSelector((state) => state.admin);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchReviewsThunk({ page: currentPage, search }));
  }, [dispatch, currentPage, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= reviewsPages) {
      setCurrentPage(page);
    }
  };

  const handleToggleApproval = (id) => {
    dispatch(toggleReviewApprovalThunk(id))
      .unwrap()
      .then((review) => {
        toast.success(`Review ${review.isApproved ? 'approved' : 'hidden'} successfully.`, { position: 'bottom-center' });
      })
      .catch((err) => {
        toast.error(err || "Failed to update review status.");
      });
  };

  const handleDeleteReview = (id) => {
    if (window.confirm("Are you sure you want to permanently delete this customer review? This will recalculate the product rating stats.")) {
      dispatch(deleteReviewThunk(id))
        .unwrap()
        .then(() => {
          toast.success("Review deleted successfully.", { position: 'bottom-center' });
        })
        .catch((err) => {
          toast.error(err || "Failed to delete review.");
        });
    }
  };

  // Local filtering to support rating star/approval selection on top of paginated results
  const filteredReviews = reviews.filter(rev => {
    const matchRating = ratingFilter === "all" || rev.rating === Number(ratingFilter);
    const matchApproval = approvalFilter === "all" || 
      (approvalFilter === "approved" && rev.isApproved) || 
      (approvalFilter === "unapproved" && !rev.isApproved);
    return matchRating && matchApproval;
  });

  // Helper to render stars
  const renderStars = (rating) => {
    return (
      <div className="flex text-gold-500 space-x-0.5">
        {[...Array(5).keys()].map((star) => (
          <FiStar 
            key={star} 
            size={12} 
            fill={star < rating ? "currentColor" : "none"} 
            className={star < rating ? "text-gold-500" : "text-gold-300"} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary m-0">Review Moderation</h1>
          <p className="text-xs text-secondary/60 font-sans mt-1">Approve, hide, or delete customer comments and ratings for catalog transparency.</p>
        </div>
      </div>

      {/* Moderation Controls Panel */}
      <div className="bg-white border border-gold-200/50 p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by reviewer name, comment text..."
            className="w-full bg-[#faf9f6] border border-gold-300 py-2 pl-12 pr-4 text-xs font-sans outline-none focus:border-gold-500"
          />
        </div>

        {/* Rating Filter */}
        <div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full bg-[#faf9f6] border border-gold-300 p-2 text-xs font-sans outline-none focus:border-gold-500 cursor-pointer"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>
        </div>

        {/* Approval status filter */}
        <div>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="w-full bg-[#faf9f6] border border-gold-300 p-2 text-xs font-sans outline-none focus:border-gold-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="unapproved">Hidden / Pending</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {loading && reviews.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-secondary/60">Fetching customer reviews...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="bg-white border border-gold-200/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-gold-100 bg-[#FAF8F2] text-secondary/50 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Reviewer</th>
                  <th className="p-4">Rating & Content</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50 text-secondary">
                {filteredReviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-gold-50/10 transition-colors">
                    
                    {/* Product cell */}
                    <td className="p-4 max-w-[200px]">
                      {rev.product ? (
                        <div className="flex items-center space-x-3">
                          <img 
                            src={rev.product.images?.[0] || 'https://via.placeholder.com/60?text=No+Image'} 
                            alt={rev.product.name} 
                            className="w-11 h-11 object-cover border border-gold-100/50 rounded-sm shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-semibold text-primary text-xs truncate" title={rev.product.name}>{rev.product.name}</p>
                            <span className="text-[10px] font-mono text-secondary/60">SKU: {rev.product.sku}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-secondary/40">
                          <FiShoppingBag size={16} />
                          <span className="font-semibold">Deleted Product</span>
                        </div>
                      )}
                    </td>

                    {/* Reviewer details */}
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-primary text-xs flex items-center">
                          <FiUser className="mr-1.5 text-gold-500" size={11} /> {rev.name}
                        </p>
                        <p className="text-[10px] text-secondary/50 truncate max-w-[150px]">{rev.user?.email || ''}</p>
                      </div>
                    </td>

                    {/* Star count and comments */}
                    <td className="p-4 max-w-sm">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          {renderStars(rev.rating)}
                          <span className="text-[10px] font-bold text-gold-800">{rev.rating}.0</span>
                        </div>
                        {rev.title && (
                          <h5 className="font-semibold text-primary text-[11px] font-sans m-0">{rev.title}</h5>
                        )}
                        <p className="text-[11px] text-secondary/80 leading-relaxed font-sans select-text italic">
                          "{rev.comment}"
                        </p>
                      </div>
                    </td>

                    {/* Date submitted */}
                    <td className="p-4 text-secondary/70 whitespace-nowrap">
                      <p className="flex items-center text-[11px]">
                        <FiCalendar className="mr-1.5 text-gold-400" size={12} />
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>

                    {/* Approval status badge */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        rev.isApproved 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {rev.isApproved ? 'Approved' : 'Hidden'}
                      </span>
                    </td>

                    {/* Control Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => handleToggleApproval(rev._id)}
                          className={`p-1.5 rounded-sm border transition-colors cursor-pointer ${
                            rev.isApproved 
                              ? 'bg-red-50/50 border-red-200/50 text-red-650 hover:bg-red-50 hover:text-red-700'
                              : 'bg-emerald-50/50 border-emerald-200/50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          title={rev.isApproved ? "Hide Review" : "Approve Review"}
                        >
                          {rev.isApproved ? <FiXCircle size={14} /> : <FiCheckCircle size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          className="p-1.5 bg-red-50 text-red-650 hover:text-red-800 border border-red-200/50 rounded-sm hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {reviewsPages > 1 && (
            <div className="px-6 py-4 bg-[#FAF8F2] border-t border-gold-100 flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center text-xs font-semibold text-secondary/70 hover:text-primary disabled:opacity-40 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="mr-1.5" size={16} /> Previous
              </button>
              <div className="flex space-x-1.5">
                {[...Array(reviewsPages).keys()].map((p) => (
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
                disabled={currentPage === reviewsPages}
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
          <FiStar size={32} className="mx-auto mb-2 text-gold-300" />
          <p className="text-sm font-semibold">No customer reviews found matching criteria.</p>
        </div>
      )}
    </div>
  );
}

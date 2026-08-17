import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setSelectedCategory, setSearchTerm, resetFilters } from '../store/productSlice';
import ProductCard from '../components/ProductCard';
import FiltersSidebar from '../components/FiltersSidebar';
import QuickViewModal from '../components/QuickViewModal';
import { FiFilter, FiX, FiChevronLeft, FiChevronRight, FiAlertTriangle } from 'react-icons/fi';
import productService from '../services/productService';

// Premium Visual Loading Placeholder
const ProductSkeleton = () => (
  <div className="border border-gold-200/50 bg-white overflow-hidden luxury-shadow p-5 flex flex-col h-full space-y-4 animate-pulse select-none">
    <div className="bg-gold-50/50 w-full aspect-square"></div>
    <div className="bg-gold-50/50 h-3 w-1/3"></div>
    <div className="bg-gold-50/50 h-4 w-3/4"></div>
    <div className="bg-gold-50/50 h-3 w-1/4"></div>
    <div className="pt-2 border-t border-gold-100 flex items-center justify-between">
      <div className="bg-gold-50/50 h-5 w-1/3"></div>
      <div className="bg-gold-50/50 h-8 w-12"></div>
    </div>
  </div>
);

export default function Shop() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux selectors for active filter parameters
  const { selectedCategory, searchTerm, sortBy, selectedPriceRange } = useSelector((state) => state.products);

  // Local catalog and API network states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Standard layout density

  // Parse URL search parameters on mount or change
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');

    if (categoryParam) {
      dispatch(setSelectedCategory(categoryParam));
    }
    if (searchParam) {
      dispatch(setSearchTerm(searchParam));
    }
  }, [searchParams, dispatch]);

  // Fetch products dynamically from MERN backend
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        // Map Redux sort codes to backend sort keys
        let sortQuery = '';
        if (sortBy === 'price-low-high') sortQuery = 'price-asc';
        else if (sortBy === 'price-high-low') sortQuery = 'price-desc';
        else if (sortBy === 'rating') sortQuery = 'rating';

        const queryParams = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          minPrice: selectedPriceRange.min,
          maxPrice: selectedPriceRange.max,
          sort: sortQuery || undefined
        };

        const response = await productService.getProducts(queryParams);
        
        if (response && response.success) {
          setProducts(response.products || []);
          setTotalProducts(response.total || 0);
          setTotalPages(response.pages || 1);
        } else {
          throw new Error('Invalid response structure received from backend catalog.');
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve jewelry catalog from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedCategory, searchTerm, sortBy, selectedPriceRange, currentPage]);

  // Reset currentPage to 1 whenever filters change to prevent index-overflow
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, sortBy, selectedPriceRange]);

  // Handle active filters list count
  const activeFiltersCount = 
    (selectedCategory !== "All" ? 1 : 0) + 
    (searchTerm ? 1 : 0);

  const handleClearFilters = () => {
    dispatch(resetFilters());
    setSearchParams({});
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      
      {/* 1. Header Banner */}
      <div className="relative bg-gold-50/20 dark:bg-gold-950/10 border border-gold-200/40 dark:border-gold-900/30 p-8 sm:p-12 mb-10 text-center select-none overflow-hidden">
        {/* Luxury Gold Corner Frames */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-gold-300/40"></div>
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-gold-300/40"></div>

        <span className="text-[10px] font-bold tracking-[0.3em] text-gold-600 uppercase mb-2 block">
          SHAMBHAVI LUXE
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-primary m-0 mb-3 dark:text-white leading-none">
          {selectedCategory !== "All" ? `${selectedCategory}` : "All Exquisite Jewelry"}
        </h1>
        <p className="text-secondary text-xs sm:text-sm font-sans max-w-lg mx-auto leading-relaxed dark:text-gray-300">
          Browse through our curated collection of heritage chokers, necklaces, cuffs, jhumkas, and rings. Every piece is handcrafted and polished to luxurious perfection.
        </p>
      </div>

      {/* 2. Controls Bar (Active Filters & Mobile Toggles) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-6 mb-8 border-b border-gold-100 dark:border-gold-950/60 select-none">
        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-0">
          <span className="text-xs text-secondary font-semibold mr-2 dark:text-gray-300">
            {loading ? "Loading masterpieces..." : `Showing ${totalProducts} masterpieces`}
          </span>
          
          {selectedCategory !== "All" && (
            <span className="inline-flex items-center text-[10px] font-bold bg-gold-50/50 text-gold-800 border border-gold-300/60 py-1 pl-3 pr-1.5 uppercase tracking-wider dark:bg-gold-950/20 dark:text-gold-350 dark:border-gold-900">
              Category: {selectedCategory}
              <button 
                onClick={() => {
                  dispatch(setSelectedCategory("All"));
                  searchParams.delete('category');
                  setSearchParams(searchParams);
                }} 
                className="ml-2 hover:text-red-500 p-0.5 cursor-pointer"
              >
                <FiX size={12} />
              </button>
            </span>
          )}

          {searchTerm && (
            <span className="inline-flex items-center text-[10px] font-bold bg-gold-50/50 text-gold-800 border border-gold-300/60 py-1 pl-3 pr-1.5 uppercase tracking-wider dark:bg-gold-950/20 dark:text-gold-350 dark:border-gold-900">
              Search: "{searchTerm}"
              <button 
                onClick={() => {
                  dispatch(setSearchTerm(""));
                  searchParams.delete('search');
                  setSearchParams(searchParams);
                }} 
                className="ml-2 hover:text-red-500 p-0.5 cursor-pointer"
              >
                <FiX size={12} />
              </button>
            </span>
          )}

          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-[10px] font-bold text-red-650 hover:text-red-800 transition-colors uppercase tracking-widest pl-2 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="lg:hidden flex items-center justify-center space-x-2 bg-primary dark:bg-gold-650 dark:text-primary text-white hover:bg-gold-600 font-bold py-3 px-5 text-xs tracking-widest uppercase transition-colors cursor-pointer"
        >
          <FiFilter />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-gold-500 text-gold-950 dark:bg-white w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Main Catalog Display (Split Layout) */}
      <div className="flex gap-8 items-start">
        
        {/* Left Side: Desktop Filter Panel */}
        <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-28">
          <FiltersSidebar />
        </aside>

        {/* Right Side: Product Cards Grid */}
        <div className="flex-grow">
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(itemsPerPage)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            /* API Error UI Container */
            <div className="bg-red-50/50 border border-red-200 p-12 text-center select-none dark:bg-red-950/10 dark:border-red-950/50">
              <FiAlertTriangle className="text-red-500 mx-auto mb-4" size={40} />
              <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-3 text-red-800 dark:text-red-400">Connection Interrupted</h3>
              <p className="text-red-700/80 text-sm font-sans mb-8 max-w-sm mx-auto leading-relaxed dark:text-red-400/80">
                {error}
              </p>
              <button
                onClick={() => setCurrentPage(currentPage)} // Retrigger useEffect
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-colors cursor-pointer"
              >
                Attempt Reconnect
              </button>
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Loaded Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onQuickView={(p) => setSelectedQuickViewProduct(p)}
                  />
                ))}
              </div>

              {/* Luxury Pagination Controls */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center space-x-2 mt-16 select-none border-t border-gold-100 dark:border-gold-950/60 pt-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-3.5 border border-gold-250/70 text-secondary hover:text-gold-600 disabled:opacity-30 disabled:hover:text-secondary disabled:hover:border-gold-250 transition-all cursor-pointer rounded-none dark:border-gold-900/60 dark:text-gray-400"
                    aria-label="Previous Page"
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-12 h-12 border font-sans text-sm font-bold transition-all cursor-pointer rounded-none flex items-center justify-center ${
                          currentPage === pageNum
                            ? 'border-gold-600 bg-gold-600 text-white dark:bg-gold-600 dark:border-gold-600 dark:text-primary font-bold shadow-xs'
                            : 'border-gold-200/75 dark:border-gold-900/60 text-secondary dark:text-gray-300 hover:text-gold-600 hover:border-gold-400'
                        }`}
                      >
                        {String(pageNum).padStart(2, '0')}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-3.5 border border-gold-250/70 text-secondary hover:text-gold-600 disabled:opacity-30 disabled:hover:text-secondary disabled:hover:border-gold-250 transition-all cursor-pointer rounded-none dark:border-gold-900/60 dark:text-gray-400"
                    aria-label="Next Page"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          ) : (
            /* Empty State Catalog UI */
            <div className="bg-white border border-gold-200/50 dark:bg-[#0c0a06] dark:border-gold-900/40 p-12 sm:p-20 text-center select-none">
              <h3 className="font-serif text-xl sm:text-2xl font-bold mb-3 text-primary dark:text-white">No Masterpieces Found</h3>
              <p className="text-secondary text-sm font-sans mb-8 max-w-sm mx-auto leading-relaxed dark:text-gray-400">
                We couldn't find any jewelry matches for your active filters or query. Try resetting filters to browse all.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-primary hover:bg-gold-500 text-white hover:text-primary py-3.5 px-8 font-bold text-xs tracking-widest uppercase transition-all duration-300 border border-primary hover:border-gold-500 dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Sliding Drawer for Mobile Filter Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-[#0a0907] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gold-200/30 overflow-y-auto ${
          isMobileFilterOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gold-100/50 dark:border-gold-950/60">
          <h3 className="font-serif text-lg font-bold text-primary dark:text-white uppercase tracking-wider">Filters</h3>
          <button
            onClick={() => setIsMobileFilterOpen(false)}
            className="text-primary dark:text-gray-300 hover:text-gold-600 p-1 cursor-pointer"
            aria-label="Close filters"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6">
          <FiltersSidebar />
        </div>
      </div>

      {/* Backdrop for Mobile Filter Panel */}
      {isMobileFilterOpen && (
        <div
          onClick={() => setIsMobileFilterOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* Quick View Modal Overlay */}
      {selectedQuickViewProduct && (
        <QuickViewModal
          product={selectedQuickViewProduct}
          onClose={() => setSelectedQuickViewProduct(null)}
        />
      )}

    </div>
  );
}

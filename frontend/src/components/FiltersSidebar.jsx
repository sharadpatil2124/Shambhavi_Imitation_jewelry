import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedCategory, setSortBy, setSelectedPriceRange, resetFilters } from '../store/productSlice';
import { FiSliders, FiRotateCcw, FiChevronDown } from 'react-icons/fi';

import productService from '../services/productService';

export default function FiltersSidebar() {
  const dispatch = useDispatch();
  const { selectedCategory, sortBy, selectedPriceRange } = useSelector((state) => state.products);

  const [categories, setCategories] = useState(["All"]);
  const [minPrice, setMinPrice] = useState(selectedPriceRange.min);
  const [maxPrice, setMaxPrice] = useState(selectedPriceRange.max);

  // Fetch categories dynamically on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productService.getCategories();
        if (response && response.success) {
          const catNames = response.categories.map(c => c.name);
          setCategories(["All", ...catNames]);
        }
      } catch (err) {
        console.error("Failed to load backend categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Sync state if filters reset globally
  useEffect(() => {
    setMinPrice(selectedPriceRange.min);
    setMaxPrice(selectedPriceRange.max);
  }, [selectedPriceRange]);

  const handlePriceApply = (e) => {
    e.preventDefault();
    dispatch(setSelectedPriceRange({ min: Number(minPrice), max: Number(maxPrice) }));
  };

  const handleReset = () => {
    dispatch(resetFilters());
  };

  return (
    <div className="bg-white dark:bg-[#0c0a06] border border-gold-200/50 p-6 shadow-sm flex flex-col space-y-8 select-none relative">
      {/* Decorative Accent bracket */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-gold-300/30"></div>
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-gold-300/30"></div>
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gold-100 dark:border-gold-950/60">
        <h3 className="font-serif text-base font-bold text-primary dark:text-white tracking-wide flex items-center space-x-2">
          <FiSliders className="text-gold-600" />
          <span>Filters</span>
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-secondary dark:text-gold-300 hover:text-gold-650 transition-colors duration-200 flex items-center space-x-1 font-bold cursor-pointer"
        >
          <FiRotateCcw size={12} />
          <span>Reset All</span>
        </button>
      </div>

      {/* Section 1: Categories */}
      <div className="text-left">
        <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-primary dark:text-gold-200 mb-4 pb-2 border-b border-gold-100/35 dark:border-gold-950/60">
          Categories
        </h4>
        <div className="flex flex-col space-y-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => dispatch(setSelectedCategory(category))}
              className={`text-left text-xs py-2 px-3 transition-all duration-200 cursor-pointer tracking-wider ${
                selectedCategory === category
                  ? 'bg-gold-50/50 dark:bg-gold-950/20 border-l-2 border-gold-500 font-bold text-gold-800 dark:text-gold-400'
                  : 'text-secondary dark:text-gray-305 hover:text-primary dark:hover:text-gold-500 hover:pl-4 hover:bg-gold-50/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Sorting Options */}
      <div className="text-left">
        <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-primary dark:text-gold-200 mb-4 pb-2 border-b border-gold-100/35 dark:border-gold-950/60">
          Sort By
        </h4>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => dispatch(setSortBy(e.target.value))}
            className="w-full bg-white dark:bg-[#100d07] border border-gold-200 dark:border-gold-900/60 text-primary dark:text-gray-300 py-2.5 px-3 pr-10 outline-none text-xs font-bold tracking-wider focus:border-gold-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="featured">Featured / Trending</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-600 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Section 3: Price Filter */}
      <div className="text-left">
        <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-primary dark:text-gold-200 mb-4 pb-2 border-b border-gold-100/35 dark:border-gold-950/60">
          Price Range
        </h4>
        <form onSubmit={handlePriceApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-secondary dark:text-gray-400 uppercase tracking-widest mb-1">Min (₹)</label>
              <input
                type="number"
                min="0"
                max="25000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-gold-200 dark:border-gold-900/60 bg-transparent py-2 px-3 text-xs font-sans text-primary dark:text-white focus:border-gold-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-secondary dark:text-gray-400 uppercase tracking-widest mb-1">Max (₹)</label>
              <input
                type="number"
                min="0"
                max="25000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gold-200 dark:border-gold-900/60 bg-transparent py-2 px-3 text-xs font-sans text-primary dark:text-white focus:border-gold-500 outline-none transition-colors"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-gold-500 text-white hover:text-primary font-bold py-2.5 px-4 text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer dark:bg-gold-600 dark:border-gold-600 dark:text-primary dark:hover:bg-white dark:hover:border-white"
          >
            Apply Price
          </button>
        </form>
      </div>

      {/* Decorative Brand Accent */}
      <div className="pt-4 border-t border-gold-100/40 dark:border-gold-950/60 flex items-center justify-center">
        <span className="text-[9px] text-gold-400 font-serif tracking-[0.25em] uppercase italic">
          Shambhavi Heritage Craft
        </span>
      </div>

    </div>
  );
}

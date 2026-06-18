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
    <div className="bg-white border border-gold-200/60 p-6 shadow-sm flex flex-col space-y-8 select-none">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gold-100">
        <h3 className="font-serif text-lg font-bold text-primary tracking-wide flex items-center space-x-2">
          <FiSliders className="text-gold-600" />
          <span>Filters</span>
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-secondary hover:text-gold-600 transition-colors duration-200 flex items-center space-x-1 font-semibold cursor-pointer"
        >
          <FiRotateCcw size={12} />
          <span>Reset All</span>
        </button>
      </div>

      {/* Section 1: Categories */}
      <div>
        <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-primary mb-4 pb-2 border-b border-gray-50">
          Categories
        </h4>
        <div className="flex flex-col space-y-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => dispatch(setSelectedCategory(category))}
              className={`text-left text-sm py-2 px-3 transition-all duration-200 cursor-pointer ${
                selectedCategory === category
                  ? 'bg-gold-50 border-l-2 border-gold-500 font-semibold text-gold-800'
                  : 'text-secondary hover:text-primary hover:pl-4 hover:bg-gold-50/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Sorting Options */}
      <div>
        <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-primary mb-4 pb-2 border-b border-gray-50">
          Sort By
        </h4>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => dispatch(setSortBy(e.target.value))}
            className="w-full bg-white border border-gold-200 text-primary py-2.5 px-3 pr-10 outline-none text-sm font-medium tracking-wide focus:border-gold-500 transition-colors appearance-none cursor-pointer"
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
      <div>
        <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-primary mb-4 pb-2 border-b border-gray-50">
          Price Range
        </h4>
        <form onSubmit={handlePriceApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Min (₹)</label>
              <input
                type="number"
                min="0"
                max="25000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-gold-200 py-2 px-3 text-sm font-sans focus:border-gold-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Max (₹)</label>
              <input
                type="number"
                min="0"
                max="25000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gold-200 py-2 px-3 text-sm font-sans focus:border-gold-500 outline-none transition-colors"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-gold-600 text-white font-bold py-2.5 px-4 text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
          >
            Apply Price Filter
          </button>
        </form>
      </div>

      {/* Decorative Brand Accent */}
      <div className="pt-4 border-t border-gold-100 flex items-center justify-center">
        <span className="text-[10px] text-gold-400 font-serif tracking-[0.25em] uppercase italic">
          Shambhavi Heritage Craft
        </span>
      </div>

    </div>
  );
}

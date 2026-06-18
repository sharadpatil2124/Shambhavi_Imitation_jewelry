import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSelectedCategory } from '../store/productSlice';
import { FiArrowRight } from 'react-icons/fi';
import { getImageUrl } from '../utils/image';
import productService from '../services/productService';

const defaultMeta = {
  "Bridal Collection": { tagline: "GRAND WEDDING SUITES", count: "Exclusive sets" },
  "Necklaces": { tagline: "HERITAGE COUTURE FOR NECK", count: "Traditional malas" },
  "Earrings": { tagline: "LUMINOUS DROP & CHANDELIER", count: "Classic earrings" },
  "Bangles": { tagline: "MAJESTIC GOLDEN CUFFS", count: "Premium cuffs" },
  "Rings": { tagline: "REGAL COCKTAIL PIECES", count: "Adjustable solitaires" }
};

const getCategoryMeta = (catName) => {
  const matchedKey = Object.keys(defaultMeta).find(
    key => key.toLowerCase() === catName.toLowerCase()
  );
  if (matchedKey) {
    return defaultMeta[matchedKey];
  }
  return {
    tagline: `${catName.toUpperCase()} COLLECTION`,
    count: "Curated collection"
  };
};

export default function Categories() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productService.getCategories();
        if (response && response.success) {
          setCategories(response.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    dispatch(setSelectedCategory(categoryName));
    navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none">
        <div className="text-center mb-16 animate-pulse">
          <div className="h-3 w-40 bg-gold-200/50 mx-auto mb-2"></div>
          <div className="h-8 w-64 bg-gold-200/50 mx-auto mb-3"></div>
          <div className="h-4 w-96 bg-gold-200/50 mx-auto"></div>
        </div>
        <div className="space-y-12">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex flex-col lg:flex-row border border-gold-200/50 bg-white overflow-hidden shadow-xs animate-pulse">
              <div className="w-full lg:w-1/2 h-72 sm:h-96 bg-gold-100/50"></div>
              <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center space-y-4 text-left">
                <div className="h-3 w-1/3 bg-gold-100/50"></div>
                <div className="h-8 w-2/3 bg-gold-100/50"></div>
                <div className="h-4 w-full bg-gold-100/50"></div>
                <div className="h-4 w-5/6 bg-gold-100/50"></div>
                <div className="h-10 w-32 bg-gold-200/50 pt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="text-center mb-16 select-none">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">
          THE SHAMBHAVI ARCHIVE
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-primary m-0 mb-3">
          Explore Curated Categories
        </h1>
        <p className="text-secondary text-xs sm:text-sm font-sans max-w-lg mx-auto leading-relaxed">
          Embark on a visual journey through our heritage designs. Select a category below to explore individual masterfully crafted collections.
        </p>
      </div>

      {/* Categories Stack */}
      <div className="space-y-12">
        {categories.map((cat, index) => {
          const isEven = index % 2 === 0;
          const meta = getCategoryMeta(cat.name);
          const desc = cat.description || "No description comments added for this jewelry collection category.";
          return (
            <div
              key={cat._id || cat.name}
              className={`flex flex-col lg:flex-row border border-gold-200/50 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 ${
                isEven ? '' : 'lg:flex-row-reverse'
              }`}
            >
              {/* Category Image */}
              <div 
                className="w-full lg:w-1/2 h-72 sm:h-96 relative overflow-hidden cursor-pointer"
                onClick={() => handleCategoryClick(cat.name)}
              >
                <div className="absolute inset-0 bg-gold-950/15 hover:bg-gold-950/5 transition-colors duration-500 z-10"></div>
                <img
                  src={getImageUrl(cat.image)}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Category Text Description */}
              <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center text-left">
                <div className="flex items-center justify-between mb-4 border-b border-gold-100/50 pb-3">
                  <span className="text-xs font-bold tracking-[0.3em] text-gold-600 uppercase">
                    {meta.tagline}
                  </span>
                  <span className="text-[10px] bg-gold-50 text-gold-800 font-bold uppercase tracking-wider px-2 py-0.5 border border-gold-200/50">
                    {meta.count}
                  </span>
                </div>
                
                <h2 
                  onClick={() => handleCategoryClick(cat.name)}
                  className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-primary mb-4 cursor-pointer hover:text-gold-600 transition-colors"
                >
                  {cat.name}
                </h2>
                
                <p className="text-secondary text-sm font-sans leading-relaxed mb-8">
                  {desc}
                </p>

                <div>
                  <button
                    onClick={() => handleCategoryClick(cat.name)}
                    className="inline-flex items-center space-x-2 bg-primary hover:bg-gold-500 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
                  >
                    <span>View Collection</span>
                    <FiArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Luxury Footer Divider */}
      <div className="my-16 flex items-center justify-center select-none opacity-45">
        <div className="h-[1px] w-20 bg-gold-300"></div>
        <span className="mx-4 font-serif text-gold-600 tracking-[0.3em] uppercase italic text-xs">Shambhavi Heritage</span>
        <div className="h-[1px] w-20 bg-gold-300"></div>
      </div>
    </div>
  );
}

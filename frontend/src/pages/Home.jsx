import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiGift, FiCopy, FiCheck } from 'react-icons/fi';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { setSelectedCategory } from '../store/productSlice';
import { toast } from 'react-toastify';
import productService from '../services/productService';
import { getImageUrl } from '../utils/image';

// Homepage Card Skeleton Loader
const HomeCardSkeleton = () => (
  <div className="border border-gold-200/50 bg-white p-5 flex flex-col h-full space-y-4 animate-pulse select-none">
    <div className="bg-gold-50/50 w-full aspect-square"></div>
    <div className="bg-gold-50/50 h-3 w-1/4"></div>
    <div className="bg-gold-50/50 h-4 w-3/4"></div>
    <div className="pt-2 border-t border-gold-100 flex items-center justify-between">
      <div className="bg-gold-50/50 h-5 w-1/4"></div>
      <div className="bg-gold-50/50 h-8 w-12"></div>
    </div>
  </div>
);

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { settings } = useSelector((state) => state.settings);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch Landing Catalog from MERN backend
  useEffect(() => {
    const fetchLandingCatalog = async () => {
      try {
        const response = await productService.getProducts({ limit: 12 });
        if (response && response.success) {
          setProducts(response.products || []);
        }
      } catch (err) {
        console.error("Failed to load landing products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingCatalog();
  }, []);

  // Fetch Active Categories from MERN backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productService.getCategories();
        if (response && response.success) {
          setCategoriesList(response.categories || []);
        }
      } catch (err) {
        console.error("Failed to load landing categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=1200&auto=format&fit=crop",
      tagline: "HERITAGE MEETS MODERNITY",
      title: "Royal Kundan Collections",
      desc: "Handcrafted chokers and necklace sets plated in 22k antique gold, adorned with premium kundan gems and fresh river pearls.",
      buttonText: "Discover Collection",
      link: "/shop?category=Necklaces"
    },
    {
      image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=1200&auto=format&fit=crop",
      tagline: "CELEBRATE FESTIVALS IN STYLE",
      title: "Temple Work Kasu Malas",
      desc: "Gilded temple motifs depicting divine blessing and exquisite gold scrollwork. Perfect for making traditional statements.",
      buttonText: "Explore Heritage",
      link: "/shop?category=Necklaces"
    },
    {
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
      tagline: "ELEGANT STATEMENT PIECES",
      title: "Diamond-Cut AD Earring Sets",
      desc: "Luminous chandelier earrings made with fine American diamonds in standard silver-rhodium and sleek rose-gold plating.",
      buttonText: "View Sparkles",
      link: "/shop?category=Earrings"
    }
  ];

  // Auto Slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Coupon Copy Simulation
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const handleCopyCoupon = () => {
    const couponCode = settings?.specialOfferCouponCode || "SHAMBHAVI10";
    navigator.clipboard.writeText(couponCode);
    setCopiedCoupon(true);
    toast.success(`Coupon code '${couponCode}' copied to clipboard!`, { position: "bottom-center" });
    setTimeout(() => setCopiedCoupon(false), 3000);
  };

  // Newsletter Simulation
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      toast.success("Welcome to the circle of elegance! Thank you for subscribing.", { position: "bottom-center" });
      setNewsletterEmail("");
    }
  };

  // Dynamic categories fetched on mount

  return (
    <div className="pb-12 animate-fade-in">
      
      {/* 1. Hero Banner Slider Section */}
      <section className="relative h-[480px] sm:h-[600px] w-full overflow-hidden bg-primary select-none">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Image Background with Dark Overlay */}
            <div className="absolute inset-0 bg-black/45 z-10"></div>
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
            
            {/* Slide Content */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-left">
                <div className="max-w-xl text-white flex flex-col space-y-4">
                  <span className="text-xs sm:text-sm font-bold tracking-[0.3em] text-gold-300 uppercase animate-slide-up">
                    {slide.tagline}
                  </span>
                  <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-wide text-white m-0 animate-slide-up">
                    {slide.title}
                  </h1>
                  <p className="font-sans text-sm sm:text-base text-gray-200 leading-relaxed max-w-md animate-slide-up">
                    {slide.desc}
                  </p>
                  <div className="pt-4 animate-slide-up">
                    <Link
                      to={slide.link}
                      className="inline-block bg-white hover:bg-gold-500 text-primary hover:text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-all duration-300 border-2 border-white hover:border-gold-500"
                    >
                      {slide.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-gold-500/80 text-white p-2.5 sm:p-3 transition-colors duration-300 border border-white/10"
          aria-label="Previous Slide"
        >
          <FiChevronLeft size={22} />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-gold-500/80 text-white p-2.5 sm:p-3 transition-colors duration-300 border border-white/10"
          aria-label="Next Slide"
        >
          <FiChevronRight size={22} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-2.5">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 transition-all duration-300 rounded-none ${
                currentSlide === i ? 'w-8 bg-gold-400' : 'bg-white/40 hover:bg-white/60'
              }`}
            ></button>
          ))}
        </div>
      </section>

      {/* 2. Shop By Category Circular Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center select-none">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">CURATED COLLECTIONS</span>
        <h2 className="font-serif text-3xl font-bold tracking-wide text-primary mb-12">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 justify-center">
          {loadingCategories ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse select-none">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gold-50/50 mb-4 border border-gold-200/20"></div>
                <div className="h-4 w-20 bg-gold-50/50 mx-auto"></div>
              </div>
            ))
          ) : (
            categoriesList.map((cat) => (
              <div
                key={cat._id || cat.name}
                onClick={() => {
                  dispatch(setSelectedCategory(cat.name));
                  navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
                }}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border border-gold-200/60 p-1 group-hover:border-gold-500 transition-all duration-500 mb-4 bg-white shadow-xs">
                  <img
                    src={getImageUrl(cat.image)}
                    alt={cat.name}
                    className="w-full h-full rounded-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <span className="font-serif text-sm sm:text-base font-bold text-primary group-hover:text-gold-600 transition-colors tracking-wide">
                  {cat.name}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. Featured Products Grid */}
      <section className="bg-white border-y border-gold-200/50 py-16 dark:bg-[#090805] dark:border-gold-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">ARTISAN CRAFTED</span>
            <h2 className="font-serif text-3xl font-bold tracking-wide text-primary dark:text-white">Featured masterpieces</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {loading ? (
              [...Array(4)].map((_, i) => <HomeCardSkeleton key={i} />)
            ) : (
              products.slice(0, 4).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onQuickView={(p) => setSelectedQuickViewProduct(p)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Heritage Bridal Banner Section (Split layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row border border-gold-200/60 shadow-lg bg-white overflow-hidden dark:bg-[#090805] dark:border-gold-900/60">
          {/* Image side */}
          <div className="w-full lg:w-1/2 h-80 lg:h-auto min-h-[350px] relative">
            <div className="absolute inset-0 bg-gold-950/20"></div>
            <img
              src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=800&auto=format&fit=crop"
              alt="Bridal Kundan Set close up"
              className="w-full h-full object-cover object-center"
            />
          </div>
          {/* Text content side */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-gold-50/20 border-l border-gold-100/40 text-left dark:bg-[#090805]">
            <span className="text-xs font-bold tracking-[0.3em] text-gold-600 uppercase mb-3">GRAND WEDDING LINE</span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-primary leading-tight mb-5 dark:text-white">
              The Sovereign Bridal Heritage
            </h3>
            <p className="text-secondary text-sm font-sans leading-relaxed mb-6 dark:text-gray-300">
              Embrace grand royal traditions on your wedding day with our heritage Bridal Choker sets. Crafted using age-old sand-casting methods, plated in pure 22-karat gold leaf, and embellished with hand-cut Kundan glass cabochons and natural pearls.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop?category=Bridal%20Collection"
                className="bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-all duration-300"
              >
                Browse Bridal Collection
              </Link>
              <a
                href={`https://wa.me/${settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : '917083874227'}?text=Hi%20Shambhavi%20Imitation!%20I%20am%20interested%20in%20exclusive%20bridal%20jewelry%20customizations.`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gold-400 text-gold-700 hover:bg-gold-500 hover:text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-all duration-300 flex items-center space-x-2 dark:text-gold-300"
              >
                <span>WhatsApp Consult</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Festival Offers & Promos Section */}
      {settings?.showSpecialOffer !== false && (
        <section className="bg-gold-950 text-gold-100 py-12 px-4 border-y border-gold-800">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-4">
            <FiGift className="text-gold-300 animate-bounce" size={32} />
            <span className="text-[10px] font-bold tracking-[0.3em] text-gold-300 uppercase">
              {settings?.specialOfferTagline || 'FESTIVAL SPECIAL OFFER'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-white m-0">
              {settings?.specialOfferTitle || 'Enjoy Extra 10% Off on All Prepaid Orders'}
            </h2>
            <p className="text-gold-200/80 text-xs sm:text-sm font-sans max-w-md">
              {settings?.specialOfferSubtitle || 'Save on jewelry sets for upcoming festivals! Apply our coupon code at checkout to claim additional discounts.'}
            </p>
            <div className="flex items-center bg-gold-900 border border-gold-700/60 p-2 pl-4 pr-2 space-x-4 max-w-sm w-full justify-between">
              <span className="font-mono text-sm tracking-widest text-white font-semibold">
                {settings?.specialOfferCouponCode || 'SHAMBHAVI10'}
              </span>
              <button
                onClick={handleCopyCoupon}
                className="bg-gold-500 hover:bg-gold-600 text-gold-950 py-1.5 px-4 font-bold text-xs tracking-widest uppercase transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedCoupon ? <FiCheck size={14} /> : <FiCopy size={14} />}
                <span>{copiedCoupon ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 6. Trending and New Arrivals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">NEW & TRENDING</span>
          <h2 className="font-serif text-3xl font-bold tracking-wide text-primary dark:text-white">Trending Collections</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {loading ? (
            [...Array(4)].map((_, i) => <HomeCardSkeleton key={i} />)
          ) : (
            products.filter(p => p.isTrending || p.isNewArrival).slice(0, 4).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onQuickView={(p) => setSelectedQuickViewProduct(p)}
              />
            ))
          )}
        </div>
      </section>

      {/* 7. Customer Testimonials */}
      <section className="bg-white border-t border-gold-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center select-none">
          <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">TESTIMONIALS</span>
          <h2 className="font-serif text-3xl font-bold tracking-wide text-primary mb-12">Whispers of Luxury</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "I ordered the Royal Kundan bridal set for my wedding reception. It looked absolutely indistinguishable from real gold. The finish was breathtaking and I received so many compliments! Customer service was helpful on WhatsApp.",
                name: "Anjali Sharma",
                city: "Mumbai",
                stars: 5
              },
              {
                quote: "The temple Kasu Mala has a beautiful, rich antique gold color, unlike the bright cheap yellow gold usually seen on imitation jewelry. I highly recommend Shambhavi for elegant traditional occasions.",
                name: "Lakshmi Priya",
                city: "Chennai",
                stars: 5
              },
              {
                quote: "Stunning AD diamond chandelier earrings. They are remarkably lightweight despite being heavy on sparkle. I bought them for a party and they looked extremely premium. Fast delivery too!",
                name: "Nisha Patel",
                city: "Delhi",
                stars: 5
              }
            ].map((t, idx) => (
              <div key={idx} className="bg-gold-50/20 border border-gold-200/40 p-8 shadow-xs flex flex-col justify-between text-left relative">
                <FaQuoteLeft className="text-gold-200 absolute top-4 right-4 opacity-50" size={24} />
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(t.stars)].map((_, i) => <FaStar key={i} size={13} />)}
                  </div>
                  <p className="text-secondary text-sm font-sans leading-relaxed mb-6 italic">
                    "{t.quote}"
                  </p>
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-primary">{t.name}</h4>
                  <span className="text-[10px] text-gold-600 uppercase tracking-widest font-semibold">{t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Instagram Style Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center select-none">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">INSTAGRAM CORNER</span>
        <h2 className="font-serif text-3xl font-bold tracking-wide text-primary mb-4">Style Inspiration</h2>
        <p className="text-secondary text-sm font-sans mb-10">Follow us <a href="#" className="text-gold-600 font-semibold hover:underline">@Shambhavi_Imitation_Jewelry</a> and tag us to be featured.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop"
          ].map((img, i) => (
            <div key={i} className="aspect-square relative overflow-hidden group cursor-pointer border border-gold-100/50">
              <img src={img} alt="Instagram Showcase" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FiChevronRight className="text-white text-2xl" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gold-50/30 border border-gold-200/80 p-8 sm:p-12 lg:p-16 text-center shadow-xs">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <span className="text-xs font-bold tracking-[0.3em] text-gold-600 uppercase mb-3">SHAMBHAVI CIRCLE</span>
            <h2 className="font-serif text-3xl font-bold tracking-wide text-primary leading-tight mb-4">
              Join the Circle of Elegance
            </h2>
            <p className="text-secondary text-sm font-sans leading-relaxed mb-8">
              Subscribe to receive exclusive access to early product launches, handcrafted styling tutorials, and custom VIP festival discounts.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="w-full flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full bg-white border border-gold-300 focus:border-gold-500 py-3.5 px-5 outline-none font-sans text-sm tracking-wide transition-colors"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Subscribe Now
              </button>
            </form>
          </div>
        </div>
      </section>

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

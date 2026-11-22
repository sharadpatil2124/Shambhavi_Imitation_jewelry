import { useState, useEffect, useRef } from 'react';
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

  const craftSteps = [
    {
      step: "01",
      title: "PREMIUM DESIGN PROCESS",
      desc: "Every collection begins with creative sketches inspired by the latest fashion trends, traditional elegance, and modern styling to create timeless imitation jewelry for every occasion.",
      image: "https://www.fashioncrab.com/wp-content/uploads/2023/08/Amazing-Reasons-Artificial-Jewelry-Makes-Us-Better.jpg"
    },
    {
      step: "02",
      title: "PRECISION STONE SETTING",
      desc: "Our skilled artisans carefully set premium-quality stones, crystals, pearls, and decorative elements with precision to ensure every piece shines beautifully from every angle.",
      image: "https://t3.ftcdn.net/jpg/18/48/98/26/240_F_1848982640_8j4z0ugDFloAhKWO2xcBIHxkpB46arUj.jpg"
    },
    {
      step: "03",
      title: "PREMIUM FINISHING",
      desc: "Each jewelry piece is finished with high-quality gold, silver, or rose gold plating to provide a rich appearance, smooth texture, and long-lasting shine suitable for everyday wear.",
      image: "https://t4.ftcdn.net/jpg/11/68/40/39/240_F_1168403949_13Glph4RGJd8RnyiiecKdwU7XIByfG08.jpg"
    },
    {
      step: "04",
      title: "QUALITY INSPECTION",
      desc: "Before reaching our customers, every product undergoes careful quality checks for finishing, durability, comfort, and overall appearance to ensure you receive a flawless jewelry piece.",
      image: "https://t4.ftcdn.net/jpg/15/38/79/29/240_F_1538792989_JajpcFzH75wrgIRa5oaCr57w2kH48d7Q.jpg"
    }
  ];

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
  const [isHovered, setIsHovered] = useState(false);
  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1601121141499-17ae80afc03a?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGpld2VsbGVyeSUyMGRlc2lnbnxlbnwwfHwwfHx8MA%3D%3D",
      tagline: "HERITAGE MEETS MODERNITY",
      title: "Royal Kundan Collections",
      desc: "Handcrafted chokers and necklace sets plated in 22k antique gold, adorned with premium kundan gems and fresh river pearls.",
      buttonText: "Discover Collection",
      link: "/shop?category=Necklaces"
    },
    {
      image: "https://static.vecteezy.com/system/resources/thumbnails/075/625/172/small/diamond-necklace-and-earrings-on-a-green-cloth-photo.jpg",
      tagline: "CELEBRATE FESTIVALS IN STYLE",
      title: "Temple Work Kasu Malas",
      desc: "Gilded temple motifs depicting divine blessing and exquisite gold scrollwork. Perfect for making traditional statements.",
      buttonText: "Explore Heritage",
      link: "/shop?category=Necklaces"
    },
    {
      image: "https://storage.googleapis.com/blog-bucket-staging/Media/b22b1683-small-banner-6.jpg",
      tagline: "ELEGANT STATEMENT PIECES",
      title: "Diamond-Cut AD Earring Sets",
      desc: "Luminous chandelier earrings made with fine American diamonds in standard silver-rhodium and sleek rose-gold plating.",
      buttonText: "View Sparkles",
      link: "/shop?category=Earrings"
    }
  ];

  // Auto Slider
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length, isHovered]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Touch swipe for the hero: the arrow buttons only appear on mouse hover
  const touchStartX = useRef(null);
  const handleHeroTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleHeroTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) handleNextSlide();
    else handlePrevSlide();
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
      
      {/* 1. Hero Banner Slider Section (autoplay pauses only for a real mouse hover; phones get swipe) */}
      <section 
        className="relative h-[440px] min-[400px]:h-[480px] sm:h-[600px] w-full overflow-hidden bg-primary select-none group touch-pan-y"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setIsHovered(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setIsHovered(false)}
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
      >
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? "opacity-100 z-10 slide-active visible" : "opacity-0 z-0 invisible pointer-events-none"
            }`}
          >
            {/* Image Background with Dark Overlay */}
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img
              src={slide.image}
              alt={slide.title}
              className={`w-full h-full object-cover object-center ${currentSlide === index ? 'animate-bg-ken-burns' : ''}`}
            />
            
            {/* Slide Content */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-left">
                <div className="max-w-xl text-white flex flex-col space-y-3 sm:space-y-4 pb-8 sm:pb-0">
                  <span className="text-[11px] sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] text-gold-300 uppercase animate-tagline">
                    {slide.tagline}
                  </span>
                  <h1 className="font-serif text-[1.7rem] leading-tight min-[400px]:text-3xl sm:text-5xl lg:text-6xl font-bold sm:leading-tight tracking-wide text-white m-0 animate-title">
                    {slide.title}
                  </h1>
                  <p className="font-sans text-sm sm:text-base text-gray-200 leading-relaxed max-w-md animate-desc">
                    {slide.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 rounded-full border border-white/20 text-white hover:text-white hover:bg-gold-500 hover:border-gold-500 bg-black/25 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Previous Slide"
        >
          <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 rounded-full border border-white/20 text-white hover:text-white hover:bg-gold-500 hover:border-gold-500 bg-black/25 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Next Slide"
        >
          <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-30 flex justify-center space-x-1">
          {heroSlides.map((_, i) => (
            // Padded button gives a finger-sized tap area around the thin indicator bar
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="py-3 px-1 cursor-pointer group/dot"
              aria-label={`Go to slide ${i + 1}`}
            >
              <span
                className={`block h-1.5 transition-all duration-500 ease-out rounded-full ${
                  currentSlide === i ? 'w-10 bg-gold-400' : 'w-4 bg-white/40 group-hover/dot:bg-white/75'
                }`}
              ></span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Shop By Category Circular Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center select-none">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">CURATED COLLECTIONS</span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-primary mb-8 sm:mb-12">Shop by Category</h2>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 min-[375px]:gap-x-6 sm:gap-8 max-w-5xl mx-auto">
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
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-gold-200/40 p-1.5 group-hover:border-gold-500 group-hover:shadow-lg dark:bg-[#100d07] dark:border-gold-950/60 transition-all duration-500 mb-4 bg-white shadow-xs">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src={getImageUrl(cat.image)}
                      alt={cat.name}
                      className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
                <span className="font-serif text-xs sm:text-sm font-bold text-primary dark:text-gray-300 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors tracking-[0.15em] uppercase text-center max-w-[8rem] sm:max-w-[10rem]">
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

      {/* 4. Signature Showcase Section (Split layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row border border-gold-200/60 shadow-lg bg-white overflow-hidden group/banner dark:bg-[#090805] dark:border-gold-900/60 transition-all duration-500 hover:shadow-xl hover:border-gold-300">
          {/* Image side */}
          <div className="w-full lg:w-1/2 h-72 sm:h-80 lg:h-auto lg:min-h-[380px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gold-950/10 z-10 transition-colors duration-500 group-hover/banner:bg-gold-950/20"></div>
            <img
              src="https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=800&auto=format&fit=crop"
              alt="Signature Handcrafted Jewelry"
              className="w-full h-full object-cover object-center transform group-hover/banner:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
          {/* Text content side */}
          <div className="w-full lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center bg-gold-50/10 border-t lg:border-t-0 lg:border-l border-gold-100/40 text-left dark:bg-[#090805] dark:border-gold-900/30">
            <span className="text-xs font-bold tracking-[0.35em] text-gold-600 uppercase mb-3">ARTISANAL CRAFTED LUXURY</span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-primary leading-tight mb-5 dark:text-white">
              The Shambhavi Signature Edit
            </h3>
            <p className="text-secondary text-sm font-sans leading-relaxed mb-8 dark:text-gray-300">
              Explore our masterfully curated catalog featuring traditional temple scrollwork chokers, premium 22k gold-plated bangles, and luminous American Diamond earrings. Every piece is meticulously detailed to bring you royal Indian heritage fused with contemporary styles.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Explore Collections
              </Link>
              <a
                href={`https://wa.me/${settings?.contactPhone ? settings.contactPhone.replace(/\D/g, '') : '917083874227'}?text=Hi%20Shambhavi%20Imitation!%20I%20am%20interested%20in%20exclusive%20jewelry%20customizations%20and%20consultation.`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gold-400 text-gold-700 hover:bg-gold-500 hover:text-white font-bold py-3.5 px-6 text-xs tracking-widest uppercase transition-all duration-300 flex items-center space-x-2 dark:text-gold-300 dark:border-gold-500/60"
              >
                <span>WhatsApp Consult</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Festival Offers & Promos Section */}
      {settings?.showSpecialOffer !== false && (
        <section className="bg-gradient-to-r from-gold-950 via-gold-900 to-gold-950 text-gold-100 py-14 sm:py-16 px-6 border-y border-gold-800 relative shadow-2xl overflow-hidden">
          {/* Inner Decorative luxury border */}
          <div className="absolute inset-4 border border-gold-500/20 pointer-events-none z-10"></div>
          
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-5 relative z-20">
            <FiGift className="text-gold-300 animate-bounce" size={36} />
            <span className="text-[10px] font-bold tracking-[0.35em] text-gold-300 uppercase">
              {settings?.specialOfferTagline || 'FESTIVAL SPECIAL OFFER'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-white m-0 leading-tight">
              {settings?.specialOfferTitle || 'Enjoy Extra 10% Off on All Prepaid Orders'}
            </h2>
            <p className="text-gold-200/80 text-xs sm:text-sm font-sans max-w-md leading-relaxed">
              {settings?.specialOfferSubtitle || 'Save on jewelry sets for upcoming festivals! Apply our coupon code at checkout to claim additional discounts.'}
            </p>
            <div className="flex items-center bg-gold-950/70 border border-gold-500/30 p-2 pl-4 sm:pl-5 pr-2 gap-3 sm:gap-4 max-w-sm w-full justify-between shadow-inner">
              <span className="font-mono text-sm tracking-widest text-white font-bold min-w-0 truncate">
                {settings?.specialOfferCouponCode || 'SHAMBHAVI10'}
              </span>
              <button
                onClick={handleCopyCoupon}
                className="shrink-0 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-gold-950 font-extrabold py-2.5 px-4 sm:px-5 text-xs tracking-widest uppercase transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer shadow-md"
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
          <div className="w-12 h-[1px] bg-gold-500 mt-4"></div>
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
      <section className="bg-white dark:bg-[#070604] border-t border-gold-200/40 dark:border-gold-950/60 py-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center select-none">
          <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">TESTIMONIALS</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-primary dark:text-white mb-10 sm:mb-16">Whispers of Luxury</h2>
          
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
              <div key={idx} className="bg-gold-50/15 dark:bg-[#0c0a06] border border-gold-200/40 dark:border-gold-900/40 p-6 sm:p-8 shadow-xs flex flex-col justify-between text-left relative group hover:shadow-xl hover:-translate-y-1.5 hover:border-gold-400 transition-all duration-500">
                {/* Decorative Corner Accents */}
                <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-gold-300/40 group-hover:border-gold-500 transition-all duration-500"></div>
                <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-gold-300/40 group-hover:border-gold-500 transition-all duration-500"></div>

                <FaQuoteLeft className="text-gold-200 dark:text-gold-950/40 absolute top-4 right-4 opacity-50" size={24} />
                <div>
                  <div className="flex text-gold-500 mb-4">
                    {[...Array(t.stars)].map((_, i) => <FaStar key={i} size={13} />)}
                  </div>
                  <p className="text-secondary dark:text-gray-300 text-sm font-sans leading-relaxed mb-6 italic">
                    "{t.quote}"
                  </p>
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-primary dark:text-gold-200 mb-1">{t.name}</h4>
                  <span className="text-[10px] text-gold-600 uppercase tracking-widest font-semibold">{t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. The Craftsmanship Journey Section */}
      <section className="bg-gradient-to-b from-gold-50/15 via-white to-gold-50/15 border-y border-gold-200/50 py-16 sm:py-24 dark:from-[#060504] dark:via-[#090806] dark:to-[#060504] dark:border-gold-950/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-20 select-none">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-6 sm:w-8 h-[1px] shrink-0 bg-gold-400/60"></span>
              <span className="text-xs font-bold tracking-[0.25em] sm:tracking-[0.35em] text-gold-600 uppercase">BEHIND THE SPARKLE</span>
              <span className="w-6 sm:w-8 h-[1px] shrink-0 bg-gold-400/60"></span>
            </div>
            <h2 className="font-serif text-2xl min-[400px]:text-3xl sm:text-4xl font-extrabold tracking-wide text-primary leading-tight dark:text-white max-w-2xl mx-auto">
              Crafted with Passion,<br />
              <span className="text-gold-600 font-serif italic font-normal mt-1 block">Designed for Every Occasion</span>
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6 mb-5"></div>
            <p className="text-secondary text-sm font-sans max-w-2xl mx-auto dark:text-gray-300 leading-relaxed">
              Every Shambhavi Imitation Jewelry piece is thoughtfully designed using premium materials and skilled craftsmanship to deliver elegance, comfort, and long-lasting beauty at an affordable price.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {craftSteps.map((step, idx) => (
              <div 
                key={idx} 
                className="flex flex-col text-left group bg-white border border-gold-100/80 p-5 sm:p-7 dark:bg-[#0a0907] dark:border-gold-900/40 relative shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-gold-400/60 transition-all duration-500 select-none"
              >
                {/* Decorative Luxury Gold Corner Frames */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-gold-300/40 group-hover:border-gold-500/80 group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all duration-500"></div>
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-gold-300/40 group-hover:border-gold-500/80 group-hover:translate-x-1 group-hover:translate-y-1 transition-all duration-500"></div>

                {/* Image panel with fine gold border frame */}
                <div className="w-full aspect-[4/3] overflow-hidden mb-6 relative border border-gold-200/30">
                  <div className="absolute inset-0 bg-gold-950/5 group-hover:bg-transparent z-10 transition-colors duration-500"></div>
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Step indicator: large metallic gold serif number */}
                <span className="font-serif text-4xl sm:text-5xl font-light italic text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-600 to-gold-500 mb-1 block leading-none">
                  {step.step}
                </span>

                {/* Decorative underline that expands on hover */}
                <div className="w-8 h-[1px] bg-gold-300/60 mb-4 transition-all duration-500 group-hover:w-16 group-hover:bg-gold-500"></div>

                {/* Title: tracked and uppercase */}
                <h3 className="font-serif text-xs sm:text-sm font-bold tracking-[0.2em] text-primary dark:text-gold-200 mb-3 uppercase">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-secondary text-xs sm:text-sm font-sans leading-relaxed dark:text-gray-300 group-hover:text-primary dark:group-hover:text-white transition-colors duration-300">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gold-50/30 border border-gold-200/80 px-5 py-8 sm:p-12 lg:p-16 text-center shadow-xs">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <span className="text-xs font-bold tracking-[0.3em] text-gold-600 uppercase mb-3">SHAMBHAVI CIRCLE</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-primary leading-tight mb-4">
              Join the Circle of Elegance
            </h2>
            <p className="text-secondary text-sm font-sans leading-relaxed mb-8">
              Subscribe to receive exclusive access to early product launches, handcrafted styling tutorials, and custom VIP festival discounts.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="w-full flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Enter Email Address"
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

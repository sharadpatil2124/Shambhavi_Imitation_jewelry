import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckSquare, FiAward, FiHeart, FiGlobe } from 'react-icons/fi';

export default function AboutUs() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in text-left">
      
      {/* 1. Page Header */}
      <div className="text-center mb-16 select-none">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-600 uppercase block mb-2">
          OUR GOLDEN LEGACY
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-primary m-0 mb-3">
          The Craft of Shambhavi Imitation
        </h1>
        <p className="text-secondary text-xs sm:text-sm font-sans max-w-lg mx-auto leading-relaxed">
          Discover the exquisite devotion, heritage artisan traditions, and state-of-the-art gold leaf coatings that make our pieces stand out.
        </p>
      </div>

      {/* 2. Story Section (Split layout) */}
      <section className="flex flex-col lg:flex-row gap-12 items-center mb-16">
        {/* Story Text */}
        <div className="w-full lg:w-1/2 space-y-5">
          <span className="text-xs font-bold tracking-[0.3em] text-gold-600 uppercase">SINCE 2018</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-wide leading-tight">
            Indistinguishable from real gold. Built for majestic occasions.
          </h2>
          <p className="text-secondary text-sm font-sans leading-relaxed">
            Shambhavi Imitation was born out of a singular, refined vision: to build breathtaking traditional Indian bridal and festival jewelry that possesses the weight, sparkle, and rich antique golden sheen of pure solid gold heritage ornaments, at a fraction of their cost.
          </p>
          <p className="text-secondary text-sm font-sans leading-relaxed">
            We recognized that today's modern brides seek design flexibility, lightweight wear, and safety during wedding galas, without compromising on majestic royal visual weight. To answer this demand, we collaborated with legacy artisans in Hyderabad, Jaipur, and Chennai to recreate the royal Kundan chokers, temple Kasu Malas, and diamond-cut CZ studs with absolute perfection.
          </p>
        </div>

        {/* Story Image */}
        <div className="w-full lg:w-1/2 h-80 sm:h-[400px] border border-gold-200/60 p-2 bg-white shadow-md relative">
          <div className="absolute inset-0 bg-gold-950/10 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=600&auto=format&fit=crop"
            alt="Artisanal Handcrafting close up"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </section>

      {/* 3. The Pillars of Excellence (Grid of 4 benefits) */}
      <section className="bg-white border border-gold-200/50 p-8 sm:p-12 shadow-sm mb-16">
        <div className="text-center mb-12 select-none">
          <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase block mb-1">BRAND PROMISE</span>
          <h3 className="font-serif text-2xl font-bold tracking-wide text-primary">Pillars of Exquisite Excellence</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <FiAward className="text-gold-600" size={28} />,
              title: "Artisanal Heritage",
              desc: "Every jewelry casting is meticulously chased and detailed by master silversmiths using age-old traditional wax casting moulds."
            },
            {
              icon: <FiCheckSquare className="text-gold-600" size={28} />,
              title: "22k Gold Leaf Plating",
              desc: "We employ advanced double-layer vacuum micro-plating coated with real 22k gold leaf, yielding that rich, warm warm antique look."
            },
            {
              icon: <FiHeart className="text-gold-600" size={28} />,
              title: "Lightweight Comfort",
              desc: "Engineered using high-quality copper and brass base alloys, our heavy-looking bridal chokers can be worn comfortably all night."
            },
            {
              icon: <FiGlobe className="text-gold-600" size={28} />,
              title: "Global Shipment concierge",
              desc: "We package every masterwork in customized velvet-lined cases and ship worldwide via premier trackable air-freight networks."
            }
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gold-50 border border-gold-200 rounded-full flex items-center justify-center mb-1">
                {item.icon}
              </div>
              <h4 className="font-serif text-base font-bold text-primary">{item.title}</h4>
              <p className="text-secondary text-xs leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Artistic Showcase (Split layout reversed) */}
      <section className="flex flex-col lg:flex-row-reverse gap-12 items-center mb-12">
        <div className="w-full lg:w-1/2 space-y-5">
          <span className="text-xs font-bold tracking-[0.3em] text-gold-600 uppercase">THE DESIGN LABORATORY</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-wide leading-tight">
            Double-Layer Anti-Tarnish Shields
          </h2>
          <p className="text-secondary text-sm font-sans leading-relaxed">
            Standard imitation jewelry suffers from rapid gold discoloration and allergic skin reactions. At Shambhavi, we resolve this by putting all alloys through a double-layer anti-tarnish coating.
          </p>
          <p className="text-secondary text-sm font-sans leading-relaxed">
            This state-of-the-art protective layer shields the real gold plating from perspiration and humidity, preserving the warm antique luster for decades. Furthermore, our entire catalog is 100% nickel-free and lead-free, ensuring zero skin reactions even for sensitive skin.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-block bg-primary hover:bg-gold-600 text-white font-bold py-3.5 px-8 text-xs tracking-widest uppercase transition-colors"
            >
              Explore Masterpieces
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/2 h-80 sm:h-[400px] border border-gold-200/60 p-2 bg-white shadow-md relative">
          <div className="absolute inset-0 bg-gold-950/10 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
            alt="Exquisite gold plating rings"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </section>

    </div>
  );
}

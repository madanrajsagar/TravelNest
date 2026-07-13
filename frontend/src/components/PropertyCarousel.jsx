import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PropertyCarousel = ({ title, subtitle, listings = [] }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: 'smooth'
      });
    }
  };

  if (listings.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 relative group/carousel">
      {/* Title Header with Arrows */}
      <div className="flex justify-between items-end pl-0.5">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight m-0">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 m-0">{subtitle}</p>}
        </div>
        
        {/* Navigation Arrow buttons */}
        <div className="flex gap-1.5 z-10">
          <button
            onClick={() => scroll('left')}
            className="rounded-full border border-slate-100 bg-white p-2 text-slate-500 shadow-xs hover:bg-slate-50 transition-all cursor-pointer border-none flex items-center justify-center active:scale-90 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="rounded-full border border-slate-100 bg-white p-2 text-slate-500 shadow-xs hover:bg-slate-50 transition-all cursor-pointer border-none flex items-center justify-center active:scale-90 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Scroll list */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-none scroll-smooth snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {listings.map((l) => (
          <Link
            key={l._id}
            to={`/listings/${l._id}`}
            className="snap-start flex-shrink-0 w-64 rounded-2xl border border-slate-100/50 bg-white hover:shadow-md transition-shadow flex flex-col gap-3 text-decoration-none dark:bg-slate-900 dark:border-slate-800 p-2.5"
          >
            {/* Image section */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 relative">
              <img
                src={l.image?.url || (l.images && l.images[0]?.url) || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80"}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                alt={l.title}
              />
              
              <div className="absolute top-2 right-2 bg-slate-900/40 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{l.rating || '4.8'}</span>
              </div>
            </div>

            {/* Information section */}
            <div className="flex flex-col gap-0.5 px-0.5">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{l.title}</span>
              <span className="text-[10px] text-slate-400 font-bold">{l.location}, {l.country}</span>
              
              <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-50 dark:border-slate-850">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  ₹{l.price?.toLocaleString('en-IN')} <span className="text-[9px] font-semibold text-slate-400">/ night</span>
                </span>
                <span className="text-[9px] font-black text-brand-rose bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {l.type || 'Villa'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
};

export default PropertyCarousel;

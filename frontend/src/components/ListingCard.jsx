import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ListingCard = ({ listing, showTax }) => {
  const { wishlist, toggleWishlist } = useAuth();
  const isSaved = wishlist.includes(listing._id);
  const finalPrice = showTax ? listing.price * 1.18 : listing.price;

  const testAccounts = ["admin", "vaishnavi", "madanrajsagar", "Demo"];
  const isSuperHost = listing.owner && (
    testAccounts.includes((listing.owner.username || "").toLowerCase()) || 
    listing.owner.role === "admin"
  );

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(listing._id);
  };

  return (
    <Link to={`/listings/${listing._id}`} className="group block text-decoration-none">
      <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-100/80 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:border-slate-200/50">
        
        {/* Image Frame */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
          <img
            src={listing.image.url}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            alt={listing.title}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Super Host Badge */}
          {isSuperHost && (
            <div className="absolute top-3 left-3 z-10 rounded-lg bg-amber-500 text-white px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider shadow-md flex items-center gap-0.5">
              <span>★</span>
              <span>Super Host</span>
            </div>
          )}
          
          {/* Heart Wishlist Toggle Button */}
          <button
            onClick={handleHeartClick}
            className="absolute top-3 right-3 z-10 rounded-full p-2 bg-white/70 backdrop-blur-sm border border-slate-100/50 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-white transition-all duration-200 cursor-pointer group/heart active:scale-90"
            title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart 
              className={`h-4 w-4 transition-all duration-250 ${
                isSaved 
                  ? 'fill-rose-500 text-rose-500 scale-110' 
                  : 'text-slate-600 group-hover/heart:text-rose-500 group-hover/heart:scale-105'
              }`} 
            />
          </button>

        </div>

        {/* Details Area */}
        <div className="flex flex-col gap-1.5 px-1.5 pb-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-[16px] leading-tight text-slate-900 truncate flex-1 group-hover:text-brand-rose transition-colors duration-200">
              {listing.title}
            </h4>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
            <MapPin className="h-3 w-3 stroke-[2.2]" />
            <span>{listing.location}, {listing.country}</span>
          </div>

          <div className="mt-1 flex items-baseline gap-1 text-sm text-slate-500">
            <span className="font-extrabold text-[16px] text-slate-900">
              &#8377;{finalPrice?.toLocaleString('en-IN')}
            </span>
            <span>/ night</span>
            {showTax && (
              <span className="ml-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                incl. 18% GST
              </span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
};
export default ListingCard;

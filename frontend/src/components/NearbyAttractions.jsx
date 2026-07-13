import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Navigation, Star, MapPin, Compass, Search } from 'lucide-react';
import { toast } from 'react-toastify';

export const NearbyAttractions = ({ lat, lng }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All'); // 'All' or specific types

  const fetchNearby = async () => {
    try {
      const res = await axios.get(`/api/services/nearby/${lat}/${lng}`);
      if (res.data && res.data.success) {
        setPlaces(res.data.places);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load nearby places list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lat && lng) {
      fetchNearby();
    }
  }, [lat, lng]);

  const categories = [
    'All', 'Restaurant', 'Cafe', 'Hospital', 'Pharmacy', 'ATM', 
    'Fuel Station', 'Grocery Store', 'Entertainment', 'Tourist Attraction', 
    'Railway Station', 'Airport', 'Bus Stop'
  ];

  const filteredPlaces = activeCategory === 'All'
    ? places
    : places.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-brand-rose" />
        <span className="text-xs font-bold text-slate-400 ml-2">Locating nearby landmarks...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-slate-50 pb-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-50 text-brand-rose border border-rose-100/50">
          <Compass className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm m-0 leading-none">Nearby Places & Attractions</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5 leading-none">
            Points of interest in walking or driving distance
          </span>
        </div>
      </div>

      {/* Categories chips horizontal scroll bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap active:scale-95 border-none ${
              activeCategory === cat
                ? 'bg-slate-900 text-white font-extrabold shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Attractions items stack list */}
      {filteredPlaces.length > 0 ? (
        <div className="flex flex-col gap-3.5 max-h-96 overflow-y-auto pr-1">
          {filteredPlaces.map((place, idx) => (
            <div key={idx} className="flex justify-between items-center gap-4 border-b border-slate-50 pb-3.5 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-xl bg-slate-50 border border-slate-100 p-2 rounded-xl flex-shrink-0 flex items-center justify-center">
                  {place.icon}
                </span>
                
                <div className="flex flex-col truncate gap-0.5">
                  <span className="text-xs font-bold text-slate-800 truncate">{place.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    <span className="text-slate-500">{place.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{place.rating}</span>
                    </span>
                    <span>•</span>
                    <span className={place.isOpen ? 'text-emerald-600' : 'text-rose-500'}>
                      {place.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distance and directions indicators */}
              <div className="flex items-center gap-4 text-right flex-shrink-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-black text-slate-800 leading-none">{place.distance}</span>
                  <span className="text-[9px] text-slate-400 font-bold leading-none mt-1">{place.travelTime} drive</span>
                </div>
                
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-brand-rose border border-slate-100/50 p-2.5 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  title="Navigate Directions"
                >
                  <Navigation className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-slate-400 font-bold uppercase tracking-wider">
          No landmarks found matching this category.
        </div>
      )}

    </div>
  );
};

export default NearbyAttractions;

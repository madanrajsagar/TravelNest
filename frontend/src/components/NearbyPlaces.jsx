import React, { useState, useEffect } from 'react';
import { 
  Coffee, Utensils, HeartPulse, CreditCard, Train, Landmark, 
  MapPin, Clock, Star, Navigation, Compass 
} from 'lucide-react';

export const NearbyPlaces = ({ coordinates }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [places, setPlaces] = useState([]);

  // Generate realistic nearby points of interest based on geo-coordinates
  useEffect(() => {
    if (!coordinates || coordinates.length < 2) return;
    const [lng, lat] = coordinates;

    // A list of general templates for POIs that we will randomize deterministically based on coordinates
    const placesTemplates = [
      { name: "The Daily Brew Cafe", category: "cafe", baseDist: 0.35, rating: 4.8, icon: Coffee, sub: "Premium espresso, pastries & workspace" },
      { name: "Green Garden Bistro", category: "restaurant", baseDist: 0.62, rating: 4.6, icon: Utensils, sub: "Organic local cuisine & outdoor seating" },
      { name: "City Care Hospital", category: "hospital", baseDist: 1.45, rating: 4.3, icon: HeartPulse, sub: "24/7 Emergency medical facilities" },
      { name: "HDFC Bank ATM", category: "atm", baseDist: 0.21, rating: 4.1, icon: CreditCard, sub: "Multi-card cash withdrawals & deposits" },
      { name: "Central Metro Station", category: "transit", baseDist: 0.95, rating: 4.5, icon: Train, sub: "Transit route connection lines 2 & 4" },
      { name: "Old Heritage Fort", category: "attraction", baseDist: 2.10, rating: 4.9, icon: Landmark, sub: "Historical monuments & panoramic views" },
      { name: "Blue Bottle Coffee", category: "cafe", baseDist: 0.58, rating: 4.7, icon: Coffee, sub: "Single-origin pour overs & light snacks" },
      { name: "Heritage Spice Kitchen", category: "restaurant", baseDist: 0.78, rating: 4.5, icon: Utensils, sub: "Traditional Indian delicacies & curries" },
      { name: "Metro Transit Bus Stop", category: "transit", baseDist: 0.15, rating: 4.2, icon: Train, sub: "Regular local and express line buses" },
      { name: "National Bank ATM", category: "atm", baseDist: 0.44, rating: 4.0, icon: CreditCard, sub: "Secure cash ATM next to super market" }
    ];

    // Seed deterministic randomized distances/ratings based on coordinates
    const seededPlaces = placesTemplates.map((p, idx) => {
      // Create slight variations based on coordinates
      const seed = Math.sin(lat * (idx + 1) + lng) * 0.1;
      const finalDist = parseFloat((p.baseDist + Math.abs(seed)).toFixed(2));
      const ratingVar = parseFloat((p.rating + (seed * 0.5)).toFixed(1));
      const finalRating = Math.min(Math.max(ratingVar, 3.8), 5.0);

      // Determine travel time (average: 12 mins per km walking, 3 mins driving)
      let timeText = "";
      if (finalDist < 1.0) {
        timeText = `${Math.ceil(finalDist * 12)} min walk`;
      } else {
        timeText = `${Math.ceil(finalDist * 3.5)} min drive`;
      }

      // Open/Closed status
      const isOpen = (idx % 3 !== 0);

      return {
        ...p,
        distance: finalDist,
        rating: finalRating,
        timeText,
        isOpen,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat + seed},${lng + seed}`
      };
    });

    // Sort by distance ascending
    seededPlaces.sort((a, b) => a.distance - b.distance);
    setPlaces(seededPlaces);
  }, [coordinates]);

  const categories = [
    { id: 'all', name: 'All nearby', icon: Compass },
    { id: 'cafe', name: 'Cafes', icon: Coffee },
    { id: 'restaurant', name: 'Dining', icon: Utensils },
    { id: 'hospital', name: 'Hospitals', icon: HeartPulse },
    { id: 'atm', name: 'ATMs', icon: CreditCard },
    { id: 'transit', name: 'Transit', icon: Train },
    { id: 'attraction', name: 'Attractions', icon: Landmark }
  ];

  const filteredPlaces = activeCategory === 'all' 
    ? places 
    : places.filter(p => p.category === activeCategory);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.015)] dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-5 mt-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2 tracking-wide m-0">
          <MapPin className="h-5 w-5 text-brand-rose animate-bounce" />
          <span>Local Places Explorer</span>
        </h3>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-850 px-2.5 py-0.5 rounded-full">
          Geocoded coordinates
        </span>
      </div>

      {/* Category horizontal scrolling selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pr-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border-none whitespace-nowrap ${
                isActive 
                  ? 'bg-brand-rose text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Results list */}
      <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1">
        {filteredPlaces.length > 0 ? (
          filteredPlaces.map((p, idx) => {
            const PlaceIcon = p.icon;
            return (
              <div 
                key={idx}
                className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-850 pb-3.5 last:border-0 last:pb-0"
              >
                {/* Left side details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-rose-50 text-brand-rose flex items-center justify-center flex-shrink-0 dark:bg-rose-950/20">
                    <PlaceIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                    <span className="text-[9.5px] text-slate-400 font-semibold truncate leading-relaxed">{p.sub}</span>
                    <div className="flex items-center gap-2.5 mt-0.5 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-350">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {p.distance} km
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-350">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {p.timeText}
                      </span>
                      <span>•</span>
                      <span className={`text-[9px] font-extrabold uppercase ${p.isOpen ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {p.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Rating indicator */}
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {p.rating}
                  </span>
                  
                  {/* Directions trigger */}
                  <a
                    href={p.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Get Directions on Maps"
                    className="rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-brand-rose p-1.5 transition-colors dark:bg-slate-850 dark:hover:bg-rose-950/20"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                  </a>
                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            No places indexed under this category.
          </div>
        )}
      </div>

    </div>
  );
};

export default NearbyPlaces;

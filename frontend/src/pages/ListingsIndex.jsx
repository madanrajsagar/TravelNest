import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ListingCard from '../components/ListingCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import AIAssistantChat from '../components/AIAssistantChat';
import PropertyCarousel from '../components/PropertyCarousel';
import { useLanguage } from '../context/LanguageContext';
import { 
  Flame, Bed, Landmark, Mountain, ShieldCheck, Waves, Tent, Wheat, 
  Snowflake, Orbit, Ship, Sparkles, SlidersHorizontal, X, Star, Check, Loader2 
} from 'lucide-react';

export const ListingsIndex = ({ searchQuery, onSearch }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [showTax, setShowTax] = useState(false);
  const [superHostOnly, setSuperHostOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  // Advanced Filters States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('Any');
  const [bathrooms, setBathrooms] = useState('Any');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRating, setMinRating] = useState(0);

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);

  // Reset pagination index when search parameters change
  useEffect(() => {
    setVisibleCount(8);
  }, [
    searchQuery, activeFilter, minPrice, maxPrice, propertyType, 
    bedrooms, bathrooms, selectedAmenities, minRating, superHostOnly
  ]);

  // Observer callback to increment grid visible items counts
  useEffect(() => {
    const trigger = document.getElementById("infinite-scroll-trigger");
    if (!trigger) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 4, filteredListings.length));
      }
    }, { threshold: 0.1 });

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [visibleCount, filteredListings]);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      setRecentlyViewed(history);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const amenitiesOptions = ['WiFi', 'Kitchen', 'Pool', 'AC', 'Parking', 'TV'];

  // Fetch listings on mount
  const fetchListings = async () => {
    try {
      const res = await axios.get('/api/listings');
      setListings(res.data);
      setFilteredListings(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Filter listings by Search Query, Category, and Advanced criteria
  useEffect(() => {
    let result = listings;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.country?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q)
      );
    }

    if (activeFilter) {
      const filterName = activeFilter.toLowerCase();
      result = result.filter((l) => {
        const text = `${l.title} ${l.description} ${l.location} ${l.country}`.toLowerCase();
        if (filterName === 'trending') return true;
        if (filterName === 'rooms') return text.includes('room') || text.includes('bedroom') || text.includes('stay');
        if (filterName === 'iconic cities') return text.includes('city') || text.includes('town') || text.includes('mumbai') || text.includes('delhi');
        if (filterName === 'mountains') return text.includes('mountain') || text.includes('hill') || text.includes('trek');
        if (filterName === 'castles') return text.includes('castle') || text.includes('fort') || text.includes('palace');
        if (filterName === 'amazing pools') return text.includes('pool') || text.includes('swimming') || text.includes('villa');
        if (filterName === 'camping') return text.includes('camp') || text.includes('tent') || text.includes('nature');
        if (filterName === 'farms') return text.includes('farm') || text.includes('ranch') || text.includes('organic');
        if (filterName === 'arctic') return text.includes('arctic') || text.includes('snow') || text.includes('cold');
        if (filterName === 'domes') return text.includes('dome') || text.includes('glamping');
        if (filterName === 'boats') return text.includes('boat') || text.includes('yacht') || text.includes('houseboat');
        return true;
      });
    }

    // Apply Price Slider
    result = result.filter(l => (l.price || 0) >= minPrice && (l.price || 0) <= maxPrice);

    // Apply Super Host Filter
    if (superHostOnly) {
      result = result.filter(l => {
        const owner = l.owner;
        if (!owner) return false;
        const testAccounts = ["admin", "vaishnavi", "madanrajsagar", "Demo"];
        return testAccounts.includes((owner.username || "").toLowerCase()) || owner.role === "admin";
      });
    }

    // Apply Property Type search match
    if (propertyType) {
      const type = propertyType.toLowerCase();
      result = result.filter(l => {
        const text = `${l.title} ${l.description}`.toLowerCase();
        return text.includes(type);
      });
    }

    // Apply Bedrooms selector
    if (bedrooms !== 'Any') {
      result = result.filter(l => {
        const text = `${l.title} ${l.description}`.toLowerCase();
        if (bedrooms === '4+') {
          return text.includes('4 bedroom') || text.includes('5 bedroom') || text.includes('4 beds') || text.includes('5 beds');
        }
        return text.includes(`${bedrooms} bedroom`) || text.includes(`${bedrooms} bed`) || text.includes(`${bedrooms} room`);
      });
    }

    // Apply Bathrooms selector
    if (bathrooms !== 'Any') {
      result = result.filter(l => {
        const text = `${l.title} ${l.description}`.toLowerCase();
        if (bathrooms === '4+') {
          return text.includes('4 bathroom') || text.includes('5 bathroom') || text.includes('4 bath') || text.includes('5 bath');
        }
        return text.includes(`${bathrooms} bathroom`) || text.includes(`${bathrooms} bath`);
      });
    }

    // Apply Amenities Checklist
    if (selectedAmenities.length > 0) {
      result = result.filter(l => {
        const text = `${l.title} ${l.description}`.toLowerCase();
        return selectedAmenities.every(amenity => text.includes(amenity.toLowerCase()));
      });
    }

    // Apply Star Rating selector
    if (minRating > 0) {
      result = result.filter(l => {
        if (!l.reviews || l.reviews.length === 0) return false;
        const avg = l.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / l.reviews.length;
        return avg >= minRating;
      });
    }

    setFilteredListings(result);
  }, [listings, searchQuery, activeFilter, minPrice, maxPrice, propertyType, bedrooms, bathrooms, selectedAmenities, minRating, superHostOnly]);

  const handleFilterClick = (filter) => {
    if (activeFilter === filter) {
      setActiveFilter('');
    } else {
      setActiveFilter(filter);
    }
  };

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
    } else {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  const clearAllFilters = () => {
    setMinPrice(0);
    setMaxPrice(50000);
    setPropertyType('');
    setBedrooms('Any');
    setBathrooms('Any');
    setSelectedAmenities([]);
    setMinRating(0);
    setActiveFilter('');
    if (onSearch) onSearch('');
  };

  const filters = [
    { name: 'Trending', icon: Flame },
    { name: 'Rooms', icon: Bed },
    { name: 'Iconic Cities', icon: Landmark },
    { name: 'Mountains', icon: Mountain },
    { name: 'Castles', icon: ShieldCheck },
    { name: 'Amazing pools', icon: Waves },
    { name: 'Camping', icon: Tent },
    { name: 'Farms', icon: Wheat },
    { name: 'Arctic', icon: Snowflake },
    { name: 'Domes', icon: Orbit },
    { name: 'Boats', icon: Ship }
  ];

  const hasActiveFilters = 
    minPrice > 0 || maxPrice < 50000 || propertyType !== '' || 
    bedrooms !== 'Any' || bathrooms !== 'Any' || selectedAmenities.length > 0 || 
    minRating > 0 || activeFilter !== '' || searchQuery;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      
      {/* Category Filters Bar & Advanced Filter Trigger */}
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
        
        {/* Scrollable Categories List */}
        <div className="flex flex-1 items-center gap-6 overflow-x-auto pb-2 scrollbar-none">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.name;
            return (
              <button
                key={f.name}
                onClick={() => handleFilterClick(f.name)}
                className={`flex flex-col items-center gap-2 cursor-pointer border-b-2 pb-2 text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  isActive
                    ? 'border-brand-rose text-brand-rose scale-105'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Advanced Filters Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>

          {/* GST Tax Toggle Pill */}
          <div className="flex items-center border border-slate-200/80 bg-white px-5 py-2.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:bg-slate-50/50 transition-colors">
            <div className="form-check form-switch flex items-center gap-3">
              <input
                className="form-check-input h-5 w-10 cursor-pointer rounded-full bg-slate-200 border-none transition-all checked:bg-brand-rose"
                type="checkbox"
                role="switch"
                id="switchCheckDefault"
                checked={showTax}
                onChange={() => setShowTax(!showTax)}
              />
              <label className="form-check-label cursor-pointer text-xs font-bold text-slate-700 select-none" htmlFor="switchCheckDefault">
                Display tax
              </label>
            </div>
          </div>

          {/* Super Host Toggle Pill */}
          <div className="flex items-center border border-slate-200/80 bg-white px-5 py-2.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:bg-slate-50/50 transition-colors">
            <div className="form-check form-switch flex items-center gap-3">
              <input
                className="form-check-input h-5 w-10 cursor-pointer rounded-full bg-slate-200 border-none transition-all checked:bg-brand-rose"
                type="checkbox"
                role="switch"
                id="switchSuperHostDefault"
                checked={superHostOnly}
                onChange={() => setSuperHostOnly(!superHostOnly)}
              />
              <label className="form-check-label cursor-pointer text-xs font-bold text-slate-700 select-none" htmlFor="switchSuperHostDefault">
                {t('superHostOnly')}
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center mt-6 animate-in fade-in duration-300">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Active filters:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>Search: "{searchQuery}"</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => onSearch && onSearch('')} />
            </span>
          )}

          {activeFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>Category: {activeFilter}</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setActiveFilter('')} />
            </span>
          )}

          {(minPrice > 0 || maxPrice < 50000) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>Price: ₹{minPrice} - ₹{maxPrice}</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => { setMinPrice(0); setMaxPrice(50000); }} />
            </span>
          )}

          {propertyType && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>Type: {propertyType}</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setPropertyType('')} />
            </span>
          )}

          {bedrooms !== 'Any' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>Bedrooms: {bedrooms}</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setBedrooms('Any')} />
            </span>
          )}

          {bathrooms !== 'Any' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>Bathrooms: {bathrooms}</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setBathrooms('Any')} />
            </span>
          )}

          {selectedAmenities.map(a => (
            <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>{a}</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => handleAmenityToggle(a)} />
            </span>
          ))}

          {minRating > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span>Rating: {minRating}★+</span>
              <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setMinRating(0)} />
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-[10px] font-bold text-brand-rose uppercase tracking-widest hover:underline cursor-pointer border-none bg-transparent"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Grid Area */}
      {loading ? (
        <SkeletonLoader count={8} />
      ) : filteredListings.length > 0 ? (
        <>
          {!searchQuery && !activeFilter && (
            <div className="flex flex-col gap-10 mt-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-10">
              <PropertyCarousel
                title="🔥 Trending Properties"
                subtitle="Highly requested bookings this week"
                listings={listings.filter(l => l.price > 7500).slice(0, 8)}
              />
              <PropertyCarousel
                title="💰 Best Value Deals"
                subtitle="Budget friendly stays under ₹5,000"
                listings={listings.filter(l => l.price <= 5000).slice(0, 8)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-6">
            {filteredListings.slice(0, visibleCount).map((l) => (
              <ListingCard key={l._id} listing={l} showTax={showTax} />
            ))}
          </div>

          {/* Observer trigger point */}
          {visibleCount < filteredListings.length && (
            <div id="infinite-scroll-trigger" className="w-full flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand-rose" />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <Orbit className="h-8 w-8 animate-spin duration-10000" />
          </div>
          <h4 className="mt-4 font-bold text-slate-800">No properties found</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            We couldn't find any homes matching your criteria. Try adjusting your filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Filters Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-2xs animate-in fade-in duration-200">
          
          {/* Close click blocker outside */}
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />
          
          {/* Slide container */}
          <div className="relative z-10 w-full max-w-sm h-full bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <h4 className="font-extrabold text-slate-900 m-0">Advanced Filters</h4>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Price Range Section */}
              <div className="flex flex-col gap-3 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Price range per night</span>
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>₹{minPrice.toLocaleString('en-IN')}</span>
                  <span>₹{maxPrice.toLocaleString('en-IN')}+</span>
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full accent-brand-rose"
                  />
                </div>
              </div>

              {/* Property Type Section */}
              <div className="flex flex-col gap-3 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Property Type</span>
                <div className="grid grid-cols-3 gap-2">
                  {['Villa', 'Apartment', 'Cabin', 'Palace', 'Farm', 'Boat'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPropertyType(propertyType === type ? '' : type)}
                      className={`rounded-xl border py-2 text-center text-xs font-bold cursor-pointer transition-colors ${
                        propertyType === type
                          ? 'border-brand-rose bg-rose-50/10 text-brand-rose'
                          : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms & beds */}
              <div className="flex flex-col gap-3.5 mb-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Bedrooms</span>
                  <div className="flex gap-2">
                    {['Any', '1', '2', '3', '4+'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBedrooms(val)}
                        className={`flex-1 rounded-full border py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                          bedrooms === val
                            ? 'border-brand-rose bg-rose-50/10 text-brand-rose'
                            : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Bathrooms</span>
                  <div className="flex gap-2">
                    {['Any', '1', '2', '3', '4+'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBathrooms(val)}
                        className={`flex-1 rounded-full border py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                          bathrooms === val
                            ? 'border-brand-rose bg-rose-50/10 text-brand-rose'
                            : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-col gap-3 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Amenities</span>
                <div className="grid grid-cols-2 gap-2">
                  {amenitiesOptions.map(amenity => {
                    const isChecked = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold cursor-pointer transition-all ${
                          isChecked
                            ? 'border-brand-rose bg-rose-50/10 text-brand-rose shadow-xs'
                            : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{amenity}</span>
                        {isChecked && <Check className="h-3.5 w-3.5 text-brand-rose" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating selection */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Average Guest Rating</span>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMinRating(val)}
                      className={`flex-1 rounded-full border py-1.5 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                        minRating === val
                          ? 'border-brand-rose bg-rose-50/10 text-brand-rose'
                          : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {val === 0 ? 'Any' : (
                        <>
                          <span>{val}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="mt-8 border-t border-slate-100 pt-4 flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 rounded-full border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 rounded-full bg-slate-900 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer"
              >
                Show {filteredListings.length} Nests
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Recently Viewed Stays block */}
      {recentlyViewed.length > 0 && !searchQuery && (
        <div className="border-t border-slate-100 mt-16 pt-10 animate-in fade-in duration-300">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest pl-0.5 mb-6 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-brand-rose animate-pulse" />
            <span>Recently Viewed Stays</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyViewed.map((s) => (
              <Link key={s._id} to={`/listings/${s._id}`} className="group flex gap-3 items-center border border-slate-100/60 rounded-2xl p-2.5 bg-white hover:shadow-xs transition-all text-decoration-none shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                <div className="h-12 w-16 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                  <img src={s.image?.url} className="h-full w-full object-cover" alt={s.title} />
                </div>
                <div className="truncate flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 truncate group-hover:text-brand-rose transition-colors">{s.title}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{s.location}, {s.country}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating Chatbot Portal */}
      <AIAssistantChat />

    </div>
  );
};

export default ListingsIndex;

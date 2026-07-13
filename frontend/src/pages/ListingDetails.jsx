import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import Map from '../components/Map';
import { toast } from 'react-toastify';
import { MapPin, User, Calendar, ShieldCheck, Heart, Sparkles, MessageSquare, Star, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import RatingInput from '../components/RatingInput';
import ListingWeatherCard from '../components/ListingWeatherCard';
import NearbyAttractions from '../components/NearbyAttractions';
import PriceAnalyticsCard from '../components/PriceAnalyticsCard';
import ReportListingDialog from '../components/ReportListingDialog';
import NearbyPlaces from '../components/NearbyPlaces';
import { useLanguage } from '../context/LanguageContext';

const ListingImagesCarousel = ({ images, title }) => {
  const [currIdx, setCurrIdx] = useState(0);

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full h-[320px] sm:h-[480px] overflow-hidden bg-slate-950 flex items-center justify-center">
      {/* Blurred background preview to show colors */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-105 pointer-events-none"
        style={{ backgroundImage: `url(${images[currIdx]?.url})` }}
      />

      {/* Clear focused foreground image */}
      <img
        src={images[currIdx]?.url}
        className="w-full h-full object-contain relative z-1"
        alt={`${title} - ${currIdx + 1}`}
      />
      
      <button
        type="button"
        onClick={prevSlide}
        className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-slate-800 p-2 shadow-md transition-all cursor-pointer border-none flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 z-10 active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-slate-800 p-2 shadow-md transition-all cursor-pointer border-none flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 z-10 active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/45 px-3 py-1.5 rounded-full z-10">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              idx === currIdx ? 'bg-white w-3' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Import calendar date-range picker components
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currUser, wishlist, toggleWishlist } = useAuth();
  const { t } = useLanguage();
  const isSaved = wishlist.includes(id);

  const [listing, setListing] = useState(null);
  const [maptilerApiKey, setMaptilerApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [superHostInfo, setSuperHostInfo] = useState(null);

  // Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Reviews Sorting and Limit States
  const [sortBy, setSortBy] = useState('newest');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(4);
  const [similarStays, setSimilarStays] = useState([]);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!listing) return;
      try {
        const res = await axios.get('/api/listings');
        if (res.data) {
          const matched = res.data.filter(
            (l) => l._id !== id && (l.location === listing.location || l.type === listing.type)
          );
          setSimilarStays(matched.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSimilar();
  }, [listing, id]);

  useEffect(() => {
    if (listing && listing.owner) {
      axios.get(`/api/services/hosts/${listing.owner._id}/superhost-status`)
        .then(res => {
          if (res.data && res.data.success) {
            setSuperHostInfo(res.data);
          }
        })
        .catch(err => console.error("Failed to load superhost status:", err));
    }
  }, [listing]);

  useEffect(() => {
    if (listing) {
      try {
        const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const compactItem = {
          _id: listing._id,
          title: listing.title,
          location: listing.location,
          country: listing.country,
          price: listing.price,
          image: listing.image
        };
        const updated = [compactItem, ...history.filter(item => item._id !== listing._id)].slice(0, 4);
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update recentlyViewed history:", e);
      }
    }
  }, [listing]);

  // Booking States
  const [reservedDates, setReservedDates] = useState([]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [reserving, setReserving] = useState(false);

  const fetchListingDetails = async () => {
    try {
      const res = await axios.get(`/api/listings/${id}`);
      if (res.data) {
        setListing(res.data.listing);
        setMaptilerApiKey(res.data.maptilerApiKey);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to load listing details.');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservedDates = async () => {
    try {
      const res = await axios.get(`/api/bookings/listing/${id}/reserved-dates`);
      if (res.data && res.data.success) {
        const dates = res.data.reservedRanges.map((range) => ({
          start: new Date(range.start),
          end: new Date(range.end)
        }));
        setReservedDates(dates);
      }
    } catch (err) {
      console.error("Failed to load reserved dates:", err);
    }
  };

  useEffect(() => {
    fetchListingDetails();
    if (currUser) {
      fetchReservedDates();
    }
  }, [id, currUser]);

  const getDisabledDatesArray = () => {
    const disabled = [];
    reservedDates.forEach(range => {
      let current = new Date(range.start);
      const end = new Date(range.end);
      while (current <= end) {
        disabled.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    return disabled;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async () => {
    if (!currUser) {
      toast.error("Please log in to reserve this Nest!");
      navigate('/login');
      return;
    }

    if (nights <= 0) {
      toast.error("Please select a valid check-in and check-out date range!");
      return;
    }

    const paymentMode = import.meta.env.VITE_PAYMENT_MODE || "mock";
    if (paymentMode === "mock") {
      const checkInStr = checkInDate.toISOString();
      const checkOutStr = checkOutDate.toISOString();
      navigate(`/bookings/payment-summary?listingId=${id}&checkIn=${checkInStr}&checkOut=${checkOutStr}&totalPrice=${grandTotal}`);
      return;
    }

    setReserving(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay payment gateway client.");
        setReserving(false);
        return;
      }

      const orderRes = await axios.post('/api/bookings/order', {
        amount: grandTotal
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.error || "Order creation failed");
      }

      const { order } = orderRes.data;

      if (order.isMock) {
        toast.info("Using simulated sandbox checkout mode...");
        setTimeout(async () => {
          try {
            const verifyRes = await axios.post('/api/bookings/verify', {
              razorpay_order_id: order.id,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
              razorpay_signature: "mock_signature",
              listingId: id,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              totalPrice: grandTotal
            });

            if (verifyRes.data.success) {
              toast.success("Simulation payment successful! Booking confirmed.");
              navigate('/bookings');
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            toast.error(verifyErr.response?.data?.error || "Transaction verification failed.");
          }
        }, 1500);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_5gUqK0j2b2Z9jW",
        amount: order.amount,
        currency: order.currency,
        name: "TravelNest",
        description: `Booking reservation for ${listing.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            toast.info("Verifying transaction...");
            const verifyRes = await axios.post('/api/bookings/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              listingId: id,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              totalPrice: grandTotal
            });

            if (verifyRes.data.success) {
              toast.success("Payment verified! Booking confirmed.");
              navigate('/bookings');
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            toast.error(verifyErr.response?.data?.error || "Transaction verification failed.");
          }
        },
        prefill: {
          name: currUser.username,
          email: currUser.email
        },
        theme: {
          color: "#fe424d"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to initiate payment.");
    } finally {
      setReserving(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await axios.delete(`/api/listings/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Listing deleted!');
        navigate('/listings');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to delete listing.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a review comment!');
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await axios.post(`/api/listings/${id}/reviews`, {
        review: { rating, comment }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Review added!');
        setListing((prev) => ({
          ...prev,
          reviews: [...prev.reviews, res.data.review]
        }));
        setRating(5);
        setComment('');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

    const handleDeleteReview = async (reviewId) => {
      if (!window.confirm('Are you sure you want to delete this review?')) return;
      try {
        const res = await axios.delete(`/api/listings/${id}/reviews/${reviewId}`);
        if (res.data.success) {
          toast.success(res.data.message || 'Review deleted!');
          setListing((prev) => ({
            ...prev,
            reviews: prev.reviews.filter((r) => r._id !== reviewId)
          }));
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.error || 'Failed to delete review.');
      }
    };

    const handleUpdateReview = (updatedReview) => {
      setListing((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) => r._id === updatedReview._id ? updatedReview : r)
      }));
    };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-danger animate-spin" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const isOwner = currUser && currUser._id === listing.owner?._id;
  const ownerName = listing.owner?.username || 'Host';

  // Booking details calculation helper
  const checkInDate = dateRange[0].startDate;
  const checkOutDate = dateRange[0].endDate;
  const timeDiff = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const nights = diffDays === 0 ? 0 : diffDays;

  const cleanPrice = listing ? (listing.price || 0) : 0;
  const gstRate = 0.18;
  const baseTotal = cleanPrice * nights;
  const gstTotal = baseTotal * gstRate;
  const grandTotal = baseTotal + gstTotal;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Title & Details Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl m-0">
              {listing.title}
            </h2>
            <button
              onClick={() => toggleWishlist(listing._id)}
              className="rounded-full border border-slate-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:bg-slate-50 active:scale-95 cursor-pointer"
              title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={`h-5 w-5 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500'}`} />
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-brand-rose" />
              <span>{listing.location}, {listing.country}</span>
            </span>
            <span className="hidden text-slate-300 sm:inline">•</span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4 text-slate-400" />
              <span>{t('hostedBy')} <b className="text-slate-700">{ownerName}</b></span>
            </span>
            {superHostInfo?.isSuperHost && (
              <div 
                className="relative group/superhost flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-help"
                title={superHostInfo.reason}
              >
                <span>★</span>
                <span>Super Host</span>
                
                {/* Custom hover explanation tooltip */}
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 bg-slate-800 text-white rounded-xl p-3 text-[10px] leading-relaxed shadow-xl opacity-0 scale-95 group-hover/superhost:opacity-100 group-hover/superhost:scale-100 transition-all pointer-events-none z-30 font-semibold normal-case">
                  <div className="flex items-center gap-1.5 text-amber-400 font-black mb-1 text-[11.5px] uppercase tracking-wider">
                    <span>★</span> Super Host
                  </div>
                  {superHostInfo.reason}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                </div>
              </div>
            )}
            {!isOwner && currUser && (
              <>
                <span className="hidden text-slate-300 sm:inline">•</span>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-750 transition-colors border-none bg-transparent cursor-pointer p-0 focus:outline-none"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{t('reportListing')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-3">
            <Link
              to={`/listings/${listing._id}/edit`}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              Edit Nest
            </Link>
            <button
              onClick={handleDeleteListing}
              className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              Delete Nest
            </button>
          </div>
        )}
      </div>

      {/* Main Image Banner Gallery Carousel */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-950 relative group h-[320px] sm:h-[480px] flex items-center justify-center">
        {listing.images && listing.images.length > 1 ? (
          <ListingImagesCarousel images={listing.images} title={listing.title} />
        ) : (
          <>
            {/* Blurred background fallback */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-105 pointer-events-none"
              style={{ backgroundImage: `url(${listing.image?.url || (listing.images && listing.images[0]?.url) || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80"})` }}
            />
            {/* Foreground contain crop block */}
            <img
              src={listing.image?.url || (listing.images && listing.images[0]?.url) || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80"}
              className="w-full h-full object-contain relative z-1"
              alt={listing.title}
            />
          </>
        )}
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
        
        {/* Left Column: Description, Map & Reviews */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* About Nest description section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-brand-rose font-bold text-xs tracking-wider uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Property Description</span>
            </div>

            {/* AI Insights chips row */}
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {listing.price > 9000 && <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-100">Luxury stay choice</span>}
              {listing.price <= 5000 && <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-100">Best value match</span>}
              {listing.type === 'Villa' && <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-indigo-100">Great for group stays</span>}
              <span className="bg-rose-50 text-brand-rose text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-rose-100">Popular among couples</span>
              <span className="bg-slate-50 text-slate-650 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-150">Remote worker ready</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('aboutThisHome')}
            </h3>
            <p className="text-base leading-relaxed text-slate-600 font-medium whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Map Location Section */}
          {listing.geometry && listing.geometry.coordinates && maptilerApiKey && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
                {t('whereYouWillBe')}
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-100/80 shadow-sm">
                <Map 
                  coordinates={listing.geometry.coordinates} 
                  apiKey={maptilerApiKey} 
                  title={listing.title}
                  price={listing.price}
                  imageUrl={listing.image?.url}
                />
              </div>
              <NearbyPlaces coordinates={listing.geometry.coordinates} />
            </div>
          )}            {/* Reviews List & Write Review Panel */}
            <div className="flex flex-col gap-6">
              
              {/* Calculation metrics for average score summary */}
              {(() => {
                const reviews = listing.reviews || [];
                const totalReviews = reviews.length;
                const averageRating = totalReviews > 0
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
                  : 0;

                const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                reviews.forEach(r => {
                  if (distribution[r.rating] !== undefined) {
                    distribution[r.rating]++;
                  }
                });

                const sortedReviews = [...reviews].sort((a, b) => {
                  if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                  if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
                  if (sortBy === 'highest') return b.rating - a.rating;
                  if (sortBy === 'lowest') return a.rating - b.rating;
                  return 0;
                });

                const displayedReviews = sortedReviews.slice(0, visibleReviewsCount);

                return (
                  <>
                    <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-2">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 m-0">
                        <MessageSquare className="h-5 w-5 text-slate-400" />
                        <span>Reviews ({totalReviews})</span>
                      </h3>
                      {totalReviews > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort by</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all cursor-pointer"
                          >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="highest">Highest Rated</option>
                            <option value="lowest">Lowest Rated</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {totalReviews > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/30 p-6 rounded-2xl border border-slate-100/50 mb-2 items-center">
                        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0">
                          <span className="text-4xl font-black text-slate-900 leading-none">{averageRating}</span>
                          <div className="flex items-center gap-0.5 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(parseFloat(averageRating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">
                            {totalReviews} review{totalReviews > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="col-span-2 flex flex-col gap-2">
                          {[5, 4, 3, 2, 1].map((starsCount) => {
                            const count = distribution[starsCount];
                            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            return (
                              <div key={starsCount} className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                                <span className="w-6 text-right font-bold">{starsCount}★</span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-brand-rose rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-12 text-slate-400 text-[10px] font-bold text-right">
                                  {count} ({Math.round(pct)}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {totalReviews > 0 ? (
                      <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {displayedReviews.map((review) => (
                            <ReviewCard
                              key={review._id}
                              review={review}
                              listingId={id}
                              onDelete={handleDeleteReview}
                              onUpdate={handleUpdateReview}
                            />
                          ))}
                        </div>
                        {totalReviews > visibleReviewsCount && (
                          <button
                            onClick={() => setVisibleReviewsCount(prev => prev + 4)}
                            className="self-center rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-xs active:scale-95 cursor-pointer"
                          >
                            Show More Reviews
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                        <p className="text-sm font-semibold text-slate-500">No reviews yet. Be the first to share your experience!</p>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Leave a review section */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6 shadow-sm">
                {currUser ? (
                  <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                    <h4 className="font-bold text-slate-900 m-0">Leave a Review</h4>
                    
                    {/* Dynamic star hover selector input */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</span>
                      <RatingInput value={rating} onChange={setRating} />
                    </div>

                    <div className="flex flex-col gap-2">
                    <label htmlFor="comment" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Comment
                    </label>
                    <textarea
                      id="comment"
                      rows="4"
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all"
                      placeholder="Share your stay experience details..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="self-start rounded-full bg-brand-rose px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-rose/90 disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-2 text-sm font-semibold text-slate-500">
                  Please <Link to="/login" className="text-brand-rose hover:underline font-bold">log in</Link> to leave a review.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Sticky Reservation Detail Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="sticky top-24 flex flex-col gap-6">
            
            {/* Sticky Booking Form card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            
            {/* Header / Price per night */}
            <div className="flex items-baseline justify-between gap-1.5">
              <div>
                <span className="text-2xl font-extrabold text-slate-900">
                  &#8377;{listing.price?.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-semibold text-slate-400"> {t('night')}</span>
              </div>
            </div>

            <hr className="border-slate-100 my-1" />

            {/* Calendar Date Picker */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('selectDates')}</span>
              <div className="overflow-hidden rounded-2xl border border-slate-100 flex justify-center bg-slate-50/50">
                <DateRange
                  onChange={item => setDateRange([item.selection])}
                  ranges={dateRange}
                  minDate={new Date()}
                  disabledDates={getDisabledDatesArray()}
                  rangeColors={["#fe424d"]}
                  showDateDisplay={false}
                />
              </div>
            </div>

            {/* Dynamic booking details */}
            {nights > 0 && (
              <div className="flex flex-col gap-3 text-sm font-semibold text-slate-600 animate-in fade-in duration-300">
                <div className="flex justify-between">
                  <span className="underline">&#8377;{listing.price?.toLocaleString('en-IN')} x {nights} nights</span>
                  <span className="text-slate-800">&#8377;{baseTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('gst')}</span>
                  <span className="text-slate-800">&#8377;{gstTotal.toLocaleString('en-IN')}</span>
                </div>
                
                <hr className="border-slate-100 my-1" />
  
                <div className="flex justify-between text-base font-extrabold text-slate-900">
                  <span>{t('grandTotal')}</span>
                  <span>&#8377;{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={reserving || nights <= 0}
              className="w-full rounded-full bg-brand-rose py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-brand-rose/90 hover:shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {reserving ? t('reserving') : nights <= 0 ? t('selectDates') : t('bookNow')}
            </button>

            {/* Policies */}
            <div className="flex flex-col gap-3 pt-2 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span>Free cancellation for 48 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span>TravelNest safety insurance included</span>
              </div>
            </div>

            </div> {/* Close Nest Reservation Form Card */}

          </div>

          {/* Weather, Places & Analytics details cards */}
          <PriceAnalyticsCard listingId={listing._id} currentPrice={listing.price} />
          <ListingWeatherCard lat={listing.geometry?.coordinates[1] || 15.498} lng={listing.geometry?.coordinates[0] || 73.828} />
          <NearbyAttractions lat={listing.geometry?.coordinates[1] || 15.498} lng={listing.geometry?.coordinates[0] || 73.828} />

        </div>

      </div>

      {/* Similar Stays Recommendations Grid */}
      {similarStays.length > 0 && (
        <div className="border-t border-slate-100 mt-12 pt-10">
          <h3 className="text-xl font-extrabold text-slate-900 mb-6">Similar Properties You Might Love</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarStays.map((s) => (
              <Link key={s._id} to={`/listings/${s._id}`} className="group flex flex-col gap-3 text-decoration-none">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                  <img src={s.image?.url || (s.images && s.images[0]?.url)} className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300" alt={s.title} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-extrabold text-slate-800 group-hover:text-brand-rose transition-colors truncate">{s.title}</span>
                  <span className="text-xs font-bold text-slate-450">{s.location}, {s.country}</span>
                  <span className="text-xs font-black text-slate-900 mt-1">₹{s.price?.toLocaleString('en-IN')} / night</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportListingDialog
          listingId={listing._id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
export default ListingDetails;

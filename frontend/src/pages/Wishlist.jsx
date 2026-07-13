import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ListingCard from '../components/ListingCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Wishlist = () => {
  const { currUser, wishlist } = useAuth();
  const [wishlistListings, setWishlistListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlistListings = async () => {
    try {
      const res = await axios.get('/api/wishlist');
      if (res.data && res.data.success) {
        setWishlistListings(res.data.wishlist || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currUser) {
      fetchWishlistListings();
    } else {
      setLoading(false);
    }
  }, [currUser]);

  // Sync populated listings with the global wishlist IDs
  useEffect(() => {
    setWishlistListings((prev) => prev.filter((l) => wishlist.includes(l._id)));
  }, [wishlist]);

  if (!currUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h4 className="mt-4 font-bold text-slate-800">Authentication Required</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Please log in or sign up to view and manage your private wishlist.
          </p>
          <Link
            to="/login"
            className="mt-5 rounded-full bg-brand-rose px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-rose/90 text-decoration-none"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-brand-rose font-bold text-xs tracking-wider uppercase">
          <Sparkles className="h-4 w-4" />
          <span>Your Favorites</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          My Wishlist
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">
          Manage stays you are interested in booking
        </p>
      </div>

      {/* Grid Area */}
      {loading ? (
        <SkeletonLoader count={4} />
      ) : wishlistListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-8">
          {wishlistListings.map((l) => (
            <ListingCard key={l._id} listing={l} showTax={false} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose">
            <Heart className="h-8 w-8 fill-brand-rose text-brand-rose animate-pulse" />
          </div>
          <h4 className="mt-4 font-bold text-slate-800">Your wishlist is empty</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Explore unique holiday properties and save them here by tapping the heart icon.
          </p>
          <Link
            to="/listings"
            className="mt-6 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 text-decoration-none"
          >
            Explore Listings
          </Link>
        </div>
      )}

    </div>
  );
};
export default Wishlist;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Calendar, ShieldCheck, Heart, User, MapPin, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBookings = () => {
  const { currUser } = useAuth();
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' or 'hosting'
  const [trips, setTrips] = useState([]);
  const [hostBookings, setHostBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch both user trips and host listings bookings in parallel
      const [tripsRes, hostRes] = await Promise.all([
        axios.get('/api/bookings/my-bookings'),
        axios.get('/api/bookings/host-bookings')
      ]);

      if (tripsRes.data && tripsRes.data.success) {
        setTrips(tripsRes.data.bookings);
      }
      if (hostRes.data && hostRes.data.success) {
        setHostBookings(hostRes.data.bookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to fetch bookings list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currUser) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [currUser]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await axios.delete(`/api/bookings/${bookingId}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Booking cancelled successfully.');
        
        // Update state locally for instant UI update
        setTrips((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' } : b))
        );
        setHostBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' } : b))
        );
      }
    } catch (err) {
      console.error('Cancel booking error:', err);
      toast.error(err.response?.data?.error || 'Failed to cancel booking.');
    }
  };

  if (!currUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h4 className="mt-4 font-bold text-slate-800">Authentication Required</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Please log in or sign up to view and manage your bookings and reservations.
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Manage Bookings
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">
          View your transaction history, travel itineraries, and properties hosting dashboard
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="mt-6 flex gap-4 border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab('trips')}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
            activeTab === 'trips'
              ? 'border-brand-rose text-brand-rose'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          My Trips ({trips.length})
        </button>
        <button
          onClick={() => setActiveTab('hosting')}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
            activeTab === 'hosting'
              ? 'border-brand-rose text-brand-rose'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Hosting Reservations ({hostBookings.length})
        </button>
      </div>

      {/* Main Panel Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
        </div>
      ) : activeTab === 'trips' ? (
        // Trips Panel
        trips.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {trips.map((booking) => {
              const listing = booking.listing;
              if (!listing) return null;
              const isConfirmed = booking.status === 'confirmed';

              return (
                <div
                  key={booking._id}
                  className="flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300"
                >
                  {/* Listing Thumbnail */}
                  <div className="w-full sm:w-1/3 aspect-video sm:aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={listing.image?.url}
                      className="h-full w-full object-cover"
                      alt={listing.title}
                    />
                  </div>

                  {/* Booking Metadata details */}
                  <div className="flex flex-1 flex-col justify-between mt-4 sm:mt-0 sm:pl-4.5 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {booking.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Order ID: {booking.paymentDetails?.orderId?.substring(0, 14)}
                        </span>
                      </div>
                      
                      <Link to={`/listings/${listing._id}`} className="block text-decoration-none group mt-2">
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-brand-rose transition-colors duration-200 truncate">
                          {listing.title}
                        </h4>
                      </Link>
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 font-semibold">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>{listing.location}, {listing.country}</span>
                      </div>
                    </div>

                    {/* Date bounds and final receipt pricing */}
                    <div className="border-t border-b border-slate-50 py-2.5 flex justify-between items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check In</span>
                        <span className="text-xs font-bold text-slate-700 mt-0.5">
                          {new Date(booking.checkIn).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check Out</span>
                        <span className="text-xs font-bold text-slate-700 mt-0.5">
                          {new Date(booking.checkOut).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Paid</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          &#8377;{booking.totalPrice?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {isConfirmed && (
                        <div className="flex gap-2">
                          <Link
                            to={`/chat/${booking._id}`}
                            className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/50 transition-colors border border-slate-100 cursor-pointer text-decoration-none"
                          >
                            <span>Chat Host</span>
                          </Link>
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-50 transition-colors border border-rose-100/50 cursor-pointer active:scale-95"
                            title="Cancel Booking"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Cancel Trip</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose">
              <Calendar className="h-8 w-8 text-brand-rose animate-pulse" />
            </div>
            <h4 className="mt-4 font-bold text-slate-800">No trips planned yet</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Explore listings and properties to book your next unique getaway with TravelNest!
            </p>
            <Link
              to="/listings"
              className="mt-6 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 text-decoration-none"
            >
              Explore Listings
            </Link>
          </div>
        )
      ) : (
        // Hosting reservations panel
        hostBookings.length > 0 ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Property</th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Guest Details</th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Dates</th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Total Revenue</th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {hostBookings.map((booking) => {
                    const listing = booking.listing;
                    if (!listing) return null;
                    const isConfirmed = booking.status === 'confirmed';

                    return (
                      <tr key={booking._id} className="hover:bg-slate-50/40 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <Link to={`/listings/${listing._id}`} className="flex items-center gap-3 group text-decoration-none">
                            <div className="h-10 w-16 overflow-hidden rounded-md bg-slate-100 flex-shrink-0">
                              <img src={listing.image?.url} className="h-full w-full object-cover" alt="" />
                            </div>
                            <span className="font-bold text-slate-800 group-hover:text-brand-rose transition-colors duration-150 max-w-[180px] truncate">
                              {listing.title}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">@{booking.user?.username || 'user'}</span>
                            <span className="text-[11px] text-slate-400 font-semibold">{booking.user?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs gap-0.5">
                            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                              <span>
                                {new Date(booking.checkIn).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                              <ArrowRight className="h-3 w-3 text-slate-300" />
                              <span>
                                {new Date(booking.checkOut).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {Math.ceil(Math.abs(new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 3600 * 24))} nights
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">
                          &#8377;{booking.totalPrice?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                              isConfirmed
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isConfirmed ? (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="rounded-full border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer active:scale-95 inline-flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold italic">No actions</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <ShieldCheck className="h-8 w-8 text-slate-300" />
            </div>
            <h4 className="mt-4 font-bold text-slate-800">No active reservations</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              When other users book your hosted properties, reservations will show up here.
            </p>
            <Link
              to="/listings/new"
              className="mt-6 rounded-full bg-brand-rose px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-rose/90 text-decoration-none"
            >
              Nest another home
            </Link>
          </div>
        )
      )}

    </div>
  );
};
export default MyBookings;

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, ShieldCheck, Sparkles, CreditCard, ArrowRight } from 'lucide-react';

export const PaymentSummary = () => {
  const { currUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const listingId = searchParams.get('listingId');
  const checkInStr = searchParams.get('checkIn');
  const checkOutStr = searchParams.get('checkOut');
  const totalPriceParam = parseFloat(searchParams.get('totalPrice') || '0');

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const checkInDate = new Date(checkInStr);
  const checkOutDate = new Date(checkOutStr);
  const timeDiff = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const nights = diffDays === 0 ? 1 : diffDays;

  const fetchListing = async () => {
    try {
      const res = await axios.get(`/api/listings/${listingId}`);
      if (res.data && res.data.listing) {
        setListing(res.data.listing);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load listing for payment summary.');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handleProceed = async () => {
    if (!currUser) {
      toast.error('Session expired, please log in.');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      // Call backend order generator to log payment attempt
      const orderRes = await axios.post('/api/bookings/order', {
        amount: totalPriceParam,
        listingId
      });

      if (orderRes.data && orderRes.data.success) {
        const orderId = orderRes.data.order.id;
        // Redirect to simulated gateway page
        navigate(
          `/bookings/payment-gateway?orderId=${orderId}&listingId=${listingId}&checkIn=${checkInStr}&checkOut=${checkOutStr}&totalPrice=${totalPriceParam}`
        );
      } else {
        toast.error('Failed to initiate transaction order.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Order creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
      </div>
    );
  }

  if (!listing) return null;

  const cleanPrice = listing.price || 0;
  const baseTotal = cleanPrice * nights;
  const gstTotal = baseTotal * 0.18;
  const grandTotal = baseTotal + gstTotal;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      {/* Step Progress indicators */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
        <span className="text-brand-rose">1. Summary</span>
        <ArrowRight className="h-3 w-3" />
        <span>2. Checkout</span>
        <ArrowRight className="h-3 w-3" />
        <span>3. Confirmation</span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col gap-1.5 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2 text-brand-rose font-bold text-[10px] uppercase tracking-wider pl-0.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Confirm & Pay</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 leading-none mt-1">
            Trip Summary
          </h3>
        </div>

        {/* Listing Block */}
        <div className="flex gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/30">
          <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100 flex-shrink-0">
            <img src={listing.image?.url} className="h-full w-full object-cover" alt={listing.title} />
          </div>
          <div className="flex flex-col truncate gap-0.5">
            <h4 className="font-extrabold text-sm text-slate-800 truncate">{listing.title}</h4>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <MapPin className="h-3 w-3" />
              <span>{listing.location}, {listing.country}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 mt-0.5">
              Hosted by @{listing.owner?.username || 'Host'}
            </span>
          </div>
        </div>

        {/* Reservation dates block */}
        <div className="grid grid-cols-2 gap-4 border border-slate-100 rounded-xl p-4 text-sm font-semibold text-slate-700 bg-white">
          <div className="flex flex-col gap-1 border-r border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check In</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">
              {checkInDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">After 12:00 PM</span>
          </div>
          <div className="flex flex-col gap-1 pl-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check Out</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">
              {checkOutDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Before 11:00 AM</span>
          </div>
        </div>

        {/* Pricing Math */}
        <div className="flex flex-col gap-3 text-sm font-semibold text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100/30">
          <div className="flex justify-between">
            <span className="underline">&#8377;{listing.price?.toLocaleString('en-IN')} x {nights} nights</span>
            <span className="text-slate-800">&#8377;{baseTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>GST Service tax (18%)</span>
            <span className="text-slate-800">&#8377;{gstTotal.toLocaleString('en-IN')}</span>
          </div>
          
          <hr className="border-slate-100 my-1" />

          <div className="flex justify-between text-base font-extrabold text-slate-900">
            <span>Grand Total</span>
            <span>&#8377;{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Policies */}
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-400 pl-0.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>Free cancellation for 48 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <span>TravelNest safety insurance included</span>
          </div>
        </div>

        {/* Proceed Trigger */}
        <button
          onClick={handleProceed}
          disabled={submitting}
          className="w-full rounded-full bg-brand-rose py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-brand-rose/90 hover:shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <CreditCard className="h-4.5 w-4.5" />
          <span>{submitting ? 'Redirecting...' : 'Proceed to Payment'}</span>
        </button>

      </div>
    </div>
  );
};
export default PaymentSummary;

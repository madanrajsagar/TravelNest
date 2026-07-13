import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Printer, ArrowLeft, ShieldCheck, Download, Sparkles } from 'lucide-react';

export const PrintInvoice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBookingDetail = async () => {
    try {
      const res = await axios.get('/api/bookings/my-bookings');
      if (res.data && res.data.success) {
        const found = res.data.bookings.find((b) => b._id === bookingId);
        if (found) {
          setBooking(found);
        } else {
          toast.error('Booking details not found.');
          navigate('/bookings');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoice parameters.');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail();
    }
  }, [bookingId]);

  // Trigger print overlay automatically once loaded
  useEffect(() => {
    if (booking) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [booking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 print:hidden">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
      </div>
    );
  }

  if (!booking || !booking.listing) return null;
  const listing = booking.listing;

  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const timeDiff = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const nights = diffDays === 0 ? 1 : diffDays;

  const cleanPrice = listing.price || 0;
  const baseTotal = cleanPrice * nights;
  const gstTotal = baseTotal * 0.18;
  const grandTotal = booking.totalPrice || baseTotal + gstTotal;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 bg-white">
      
      {/* Action panel (Hidden on Print Mode) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8 print:hidden">
        <Link
          to="/bookings"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 text-decoration-none"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Bookings</span>
        </Link>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Invoice Sheet container */}
      <div className="p-8 border border-slate-200 rounded-2xl print:border-none print:p-0">
        
        {/* Receipt Header details */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-brand-rose font-black text-lg">
              <Sparkles className="h-5 w-5 fill-brand-rose" />
              <span>TravelNest Invoice</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-0.5">
              Simulated Booking Receipt
            </span>
          </div>

          <div className="text-right flex flex-col text-xs font-semibold text-slate-500 gap-0.5">
            <span className="font-extrabold text-slate-800">Booking Reference</span>
            <span className="font-mono">#{booking._id}</span>
            <span>Date: {new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <hr className="border-slate-100 my-6" />

        {/* Guest and Property Details */}
        <div className="grid grid-cols-2 gap-6 text-xs font-semibold text-slate-500">
          <div>
            <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">Property Details</h5>
            <div className="flex flex-col text-slate-800 gap-0.5">
              <span className="font-extrabold text-sm text-slate-950 mb-0.5">{listing.title}</span>
              <span>{listing.location}, {listing.country}</span>
              <span>Host Username: @{listing.owner?.username || 'Host'}</span>
            </div>
          </div>

          <div className="text-right">
            <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">Guest Details</h5>
            <div className="flex flex-col text-slate-800 gap-0.5">
              <span className="font-extrabold text-sm text-slate-950 mb-0.5">@{booking.user?.username || 'Guest'}</span>
              <span>Email: {booking.user?.email || 'N/A'}</span>
              <span>Method: {booking.paymentDetails?.method || 'UPI'}</span>
            </div>
          </div>
        </div>

        {/* Date Ranges banner details */}
        <div className="bg-slate-50 border border-slate-100/50 p-4 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-700 mt-6.5">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check In</span>
            <span className="text-slate-800 font-bold mt-0.5">
              {checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nights Stay</span>
            <span className="text-slate-800 font-extrabold mt-0.5 block">{nights} nights</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check Out</span>
            <span className="text-slate-800 font-bold mt-0.5">
              {checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Pricing Math Grid details */}
        <div className="mt-8">
          <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-3">Cost Summary</h5>
          
          <table className="w-full text-left text-xs font-semibold text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold">
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-right">Rate</th>
                <th className="py-2.5 text-right">Quantity</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td className="py-3 text-slate-800 font-bold">Accomodation charge</td>
                <td className="py-3 text-right">&#8377;{cleanPrice?.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right">{nights} nights</td>
                <td className="py-3 text-right text-slate-800">&#8377;{baseTotal?.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-3 text-slate-800">GST Service tax (18%)</td>
                <td className="py-3 text-right">18.00%</td>
                <td className="py-3 text-right">-</td>
                <td className="py-3 text-right text-slate-800">&#8377;{gstTotal?.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-bold text-slate-900 text-sm">
                <td className="py-4" colSpan="2">Total paid amount</td>
                <td className="py-4 text-right" colSpan="2">
                  &#8377;{grandTotal?.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center flex flex-col gap-1 text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-4">
          <span className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Simulated Checkout Gateway Verified</span>
          </span>
          <span>Thank you for booking with TravelNest. Wish you a happy stay!</span>
        </div>

      </div>
    </div>
  );
};
export default PrintInvoice;

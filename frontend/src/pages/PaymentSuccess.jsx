import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Calendar, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '0');
  const method = searchParams.get('method') || 'UPI';
  const bookingId = searchParams.get('bookingId');

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  return (
    <div className="mx-auto max-w-md px-4 py-16 animate-in fade-in duration-300">
      
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
        <span>1. Summary</span>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <span>2. Checkout</span>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <span className="text-brand-rose">3. Confirmation</span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col items-center gap-6">
        
        {/* Animated Check */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 animate-bounce">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-extrabold text-slate-900 leading-none">Booking Confirmed!</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs leading-relaxed">
            Your simulated payment transaction has been processed. Your stay at TravelNest is booked.
          </p>
        </div>

        {/* Details Card */}
        <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
          <div className="flex justify-between">
            <span>Booking ID:</span>
            <span className="text-slate-800 font-mono font-bold">{bookingId?.substring(0, 15) || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment ID:</span>
            <span className="text-slate-800 font-mono">{paymentId?.substring(0, 15)}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="text-slate-800 font-bold uppercase">{method}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Charged:</span>
            <span className="text-slate-900 font-extrabold">&#8377;{totalPrice?.toLocaleString('en-IN')}</span>
          </div>
          <hr className="border-slate-100 my-1" />
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Simulated Success</span>
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col w-full gap-2.5 mt-2">
          <Link
            to="/bookings"
            className="w-full rounded-full bg-slate-900 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 text-decoration-none"
          >
            Go to Trips
          </Link>
          
          <Link
            to={`/bookings/invoice?bookingId=${bookingId}`}
            className="w-full rounded-full bg-rose-50 py-3 text-xs font-bold text-brand-rose border border-rose-100 hover:bg-rose-100/40 transition-all text-decoration-none flex items-center justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            <span>Download Invoice</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
export default PaymentSuccess;

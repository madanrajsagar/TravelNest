import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, AlertCircle, RefreshCw, Home, ArrowRight } from 'lucide-react';

export const PaymentFailure = () => {
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('orderId');
  const listingId = searchParams.get('listingId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '0');

  const retryUrl = `/bookings/payment-gateway?orderId=${orderId}&listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}&totalPrice=${totalPrice}`;

  return (
    <div className="mx-auto max-w-md px-4 py-16 animate-in fade-in duration-300">
      
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
        <span>1. Summary</span>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <span>2. Checkout</span>
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <span className="text-rose-500 font-extrabold">3. Failed</span>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col items-center gap-6">
        
        {/* Error icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <XCircle className="h-10 w-10 text-rose-500" />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-extrabold text-slate-900 leading-none">Payment Failed</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs leading-relaxed">
            Your simulated payment transaction failed. No funds were debited. Please check your bank or retry the transaction.
          </p>
        </div>

        {/* Details Card */}
        <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left flex flex-col gap-2 text-xs font-semibold text-slate-500">
          <div className="flex justify-between">
            <span>Order Reference:</span>
            <span className="text-slate-800 font-mono">{orderId?.substring(0, 15)}</span>
          </div>
          <div className="flex justify-between">
            <span>Failure Reason:</span>
            <span className="text-rose-600 font-bold">Simulated Sandbox Error</span>
          </div>
          <div className="flex justify-between">
            <span>Transaction Amount:</span>
            <span className="text-slate-800 font-bold">&#8377;{totalPrice?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col w-full gap-2.5 mt-2">
          <Link
            to={retryUrl}
            className="w-full rounded-full bg-slate-900 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 text-decoration-none flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Payment</span>
          </Link>
          
          <Link
            to="/listings"
            className="w-full rounded-full bg-rose-50 py-3 text-xs font-bold text-brand-rose border border-rose-100 hover:bg-rose-100/40 transition-all text-decoration-none flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            <span>Cancel Reservation</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
export default PaymentFailure;

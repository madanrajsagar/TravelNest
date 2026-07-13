import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

export const PaymentSimulator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('orderId');
  const listingId = searchParams.get('listingId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '0');
  const method = searchParams.get('method') || 'UPI';
  const urlStatus = searchParams.get('status'); // 'pending' if mapped from pending simulation

  const [loading, setLoading] = useState(false);

  const triggerVerification = async (simulatedStatus) => {
    setLoading(true);
    const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      const verifyRes = await axios.post('/api/bookings/mock-verify', {
        orderId,
        paymentId: mockPaymentId,
        status: simulatedStatus,
        listingId,
        checkIn,
        checkOut,
        totalPrice,
        method
      });

      if (verifyRes.data && verifyRes.data.success) {
        if (simulatedStatus === 'captured') {
          toast.success('Simulation payment successful!');
          navigate(
            `/bookings/payment-success?orderId=${orderId}&paymentId=${mockPaymentId}&listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}&totalPrice=${totalPrice}&method=${method}&bookingId=${verifyRes.data.booking?._id}`
          );
        } else if (simulatedStatus === 'failed') {
          toast.warn('Simulation payment marked as failed.');
          navigate(
            `/bookings/payment-failure?orderId=${orderId}&listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}&totalPrice=${totalPrice}`
          );
        } else {
          // Keep in pending state
          toast.info('Simulation payment marked as pending.');
          navigate(
            `/bookings/payment-simulator?status=pending&orderId=${orderId}&listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}&totalPrice=${totalPrice}&method=${method}`
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Simulated transaction submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (urlStatus === 'pending') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 animate-in fade-in duration-300">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-extrabold text-slate-800 leading-none">Transaction Pending</h3>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-xs mt-1">
              Your mock payment transaction is in a pending waiting state. Click below to refresh status.
            </p>
          </div>

          <div className="flex flex-col w-full gap-2 mt-2">
            <button
              onClick={() => triggerVerification('captured')}
              disabled={loading}
              className="w-full rounded-full bg-slate-900 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              Refresh: Force Success
            </button>
            <button
              onClick={() => triggerVerification('failed')}
              disabled={loading}
              className="w-full rounded-full bg-rose-50 py-3 text-xs font-bold text-rose-600 border border-rose-100 hover:bg-rose-100/40 transition-colors cursor-pointer"
            >
              Refresh: Force Failure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col gap-6">
        
        {/* Terminal Header */}
        <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-700">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-none">TravelNest Developer Console</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
              Select Payment Result
            </p>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-400 leading-relaxed">
          You are currently in local mock payment mode. Select the transaction status below to simulate bank responses:
        </p>

        {/* Buttons Selector */}
        <div className="flex flex-col gap-3.5 mt-2">
          
          <button
            onClick={() => triggerVerification('captured')}
            disabled={loading}
            className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/20 px-4 py-3.5 text-left cursor-pointer hover:bg-emerald-50/45 transition-colors group disabled:opacity-50"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">Success (Capture)</span>
              <span className="text-[10px] text-slate-400 font-semibold">Simulate successful checkouts, verifies and books property.</span>
            </div>
          </button>

          <button
            onClick={() => triggerVerification('failed')}
            disabled={loading}
            className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/20 px-4 py-3.5 text-left cursor-pointer hover:bg-rose-50/45 transition-colors group disabled:opacity-50"
          >
            <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-slate-800 group-hover:text-rose-700 transition-colors">Failure</span>
              <span className="text-[10px] text-slate-400 font-semibold">Simulate transaction failure, redirects to retry options.</span>
            </div>
          </button>

          <button
            onClick={() => triggerVerification('pending')}
            disabled={loading}
            className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/20 px-4 py-3.5 text-left cursor-pointer hover:bg-amber-50/45 transition-colors group disabled:opacity-50"
          >
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-slate-800 group-hover:text-amber-700 transition-colors">Pending</span>
              <span className="text-[10px] text-slate-400 font-semibold">Simulate processing delays, redirects to waiting room.</span>
            </div>
          </button>

        </div>

        <span className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 border-t border-slate-50 pt-4">
          Demo Simulator Mode
        </span>

      </div>
    </div>
  );
};
export default PaymentSimulator;

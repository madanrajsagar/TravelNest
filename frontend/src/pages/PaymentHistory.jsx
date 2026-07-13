import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, FileText, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PaymentHistory = () => {
  const { currUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/bookings/payments');
      if (res.data && res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currUser) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [currUser]);

  if (!currUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h4 className="mt-4 font-bold text-slate-800">Authentication Required</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Please log in or sign up to view your transaction receipts history.
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
          Payment History
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">
          Verify and compile your booking transaction records, transaction IDs, and invoice details
        </p>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
        </div>
      ) : payments.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Property</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Method</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Amount Paid</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                {payments.map((payment) => {
                  const listing = payment.listing;
                  const isSuccess = payment.status === 'captured';
                  const isFailed = payment.status === 'failed';

                  return (
                    <tr key={payment._id} className="hover:bg-slate-50/40 transition-colors duration-150">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {listing ? (
                          <Link to={`/listings/${listing._id}`} className="font-bold text-slate-800 hover:text-brand-rose transition-colors max-w-[180px] truncate block text-decoration-none">
                            {listing.title}
                          </Link>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Listing Removed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {payment.orderId?.substring(0, 18)}...
                      </td>
                      <td className="px-6 py-4 text-xs uppercase text-slate-500 font-bold">
                        {payment.method || 'UPI'}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">
                        &#8377;{payment.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700'
                              : isFailed
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSuccess && payment.booking ? (
                          <Link
                            to={`/bookings/invoice?bookingId=${payment.booking._id || payment.booking}`}
                            className="rounded-full border border-slate-100 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 text-xs font-bold transition-colors text-decoration-none inline-flex items-center gap-1.5"
                            title="Print Invoice"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Invoice</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold italic">No invoice</span>
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
          <h4 className="mt-4 font-bold text-slate-800">No transactions recorded</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Any reservations or transaction histories you complete will show up in this dashboard.
          </p>
          <Link
            to="/listings"
            className="mt-6 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 text-decoration-none"
          >
            Explore stays
          </Link>
        </div>
      )}

    </div>
  );
};
export default PaymentHistory;

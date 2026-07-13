import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, AlertTriangle } from 'lucide-react';

export const ReportListingDialog = ({ listingId, onClose }) => {
  const [reason, setReason] = useState('Fake Listing');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    'Fake Listing',
    'Spam',
    'Offensive Content',
    'Incorrect Information',
    'Duplicate Listing',
    'Fraudulent Activity',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`/api/reports/listing/${listingId}`, {
        reason,
        description
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Report submitted successfully.');
        onClose();
      } else {
        toast.error(res.data.error || 'Failed to submit report.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'An error occurred while submitting report.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Report Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm font-semibold text-slate-800 transition-all focus:border-brand-rose focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:dark:bg-slate-900"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Additional Details (Optional)
            </label>
            <textarea
              rows="4"
              placeholder="Tell us why this listing is inappropriate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-brand-rose focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:dark:bg-slate-900"
            ></textarea>
          </div>

          {/* Warning notice */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-850">
            <span className="text-[10px] leading-normal text-slate-400 font-semibold dark:text-slate-400">
              Note: Reporting a listing initiates a review by the TravelNest moderation team. False reports may lead to user account limitations.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand-rose px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-rose/90 disabled:bg-brand-rose/50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReportListingDialog;

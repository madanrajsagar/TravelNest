import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsHistory = () => {
  const { currUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currUser) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [currUser]);

  const markAllRead = async () => {
    try {
      const res = await axios.put('/api/notifications/read-all');
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('All notifications marked as read.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark notifications read.');
    }
  };

  const markRead = async (id) => {
    try {
      const res = await axios.put(`/api/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!currUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center animate-in fade-in duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose mx-auto">
          <Bell className="h-8 w-8" />
        </div>
        <h4 className="mt-4 font-bold text-slate-800">Login Required</h4>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Please log in to view your notification messages history.
        </p>
        <Link to="/login" className="mt-5 inline-block rounded-full bg-brand-rose px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-rose/90 text-decoration-none">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 leading-none">Notifications</h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block">
            System Messages & Booking Logs
          </span>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100/50 px-4 py-2 text-xs font-bold text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`rounded-2xl border p-4.5 transition-all duration-300 flex items-start gap-4 relative overflow-hidden ${
                n.isRead 
                  ? 'border-slate-100 bg-white opacity-70' 
                  : 'border-brand-rose/10 bg-rose-50/5 shadow-[0_2px_12px_rgba(254,66,77,0.02)] cursor-pointer'
              }`}
            >
              {/* Highlight ribbon for unread */}
              {!n.isRead && (
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-brand-rose" />
              )}

              <div className={`p-2 rounded-xl flex-shrink-0 ${
                n.type === 'booking_confirmed' ? 'bg-emerald-50 text-emerald-600' :
                n.type === 'booking_cancelled' ? 'bg-rose-50 text-rose-600' :
                n.type === 'review' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-500'
              }`}>
                <Bell className="h-4 w-4" />
              </div>

              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex justify-between items-start gap-2">
                  <h5 className={`text-sm font-extrabold m-0 ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h5>
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed mt-1">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/20 rounded-2xl border border-dashed border-slate-200">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
            <Bell className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-slate-800 m-0">No notifications yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">We'll alert you here when stays get confirmed, reviews arrive, or cancellations happen.</p>
        </div>
      )}

    </div>
  );
};
export default NotificationsHistory;

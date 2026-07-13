import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Calendar, DollarSign, Users, Percent, Star, 
  Trash2, Edit, Eye, Heart, Plus, ArrowUpRight, ArrowRight, ShieldCheck, 
  BarChart3, RefreshCw, XCircle 
} from 'lucide-react';
import BookingCalendar from '../components/BookingCalendar';
import { useLanguage } from '../context/LanguageContext';

export const HostDashboard = () => {
  const { currUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'bookings', 'listings', 'earnings'

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch listings
      const listingsRes = await axios.get('/api/listings');
      // 2. Fetch host bookings
      const bookingsRes = await axios.get('/api/bookings/host-bookings');

      if (listingsRes.data) {
        // filter owned listings
        const hostOwned = listingsRes.data.filter(
          (l) => l.owner?._id === currUser._id || l.owner === currUser._id
        );
        setListings(hostOwned);
      }

      if (bookingsRes.data && bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load host dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currUser) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [currUser]);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This will remove all associated bookings and reviews.')) return;
    try {
      await axios.delete(`/api/listings/${listingId}`);
      toast.success('Listing deleted successfully!');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to delete listing.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await axios.delete(`/api/bookings/${bookingId}`);
      if (res.data.success) {
        toast.success('Booking cancelled successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel booking.');
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.info("No data available to export.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val || '')).replace(/"/g, '\\"').replace(/\n/g, ' ');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename}.csv exported successfully!`);
  };

  const handleExportCSV = () => {
    const data = bookings.map((b, index) => ({
      No: index + 1,
      Listing: b.listing?.title || 'Property',
      Guest: b.customer?.username || 'Guest',
      CheckIn: new Date(b.checkIn).toLocaleDateString(),
      CheckOut: new Date(b.checkOut).toLocaleDateString(),
      Status: b.status,
      Revenue: b.totalPrice || 0
    }));
    exportToCSV(data, `TravelNest_Host_Reservations_${currUser.username}`);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocker blocked the export. Please allow popups.");
      return;
    }

    const earningsTotal = bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const activeListingsHtml = listings
      .map(
        (l) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${l.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${l.location}, ${l.country}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${l.price?.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${l.views || 0} views</td>
      </tr>`
      )
      .join("");

    const bookingsHtml = bookings
      .map(
        (b) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${b.listing?.title || 'Property'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">@${b.customer?.username || 'Guest'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(b.checkIn).toLocaleDateString()} - ${new Date(b.checkOut).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: ${b.status === 'confirmed' ? '#059669' : '#dc2626'}">${b.status.toUpperCase()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">₹${b.totalPrice?.toLocaleString()}</td>
      </tr>`
      )
      .join("");

    const htmlContent = `
      <html>
        <head>
          <title>TravelNest Host Analytics Report - @${currUser.username}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #fe424d; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #fe424d; }
            .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
            .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 5px; }
            .stat-lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 35px; text-align: left; }
            th { background: #f1f5f9; padding: 12px 10px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; }
            h3 { border-left: 4px solid #fe424d; padding-left: 10px; font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">TravelNest</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Host Performance Statement</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <strong>Host Account:</strong> @${currUser.username}<br>
              <strong>Date Generated:</strong> ${new Date().toLocaleDateString()}<br>
              <strong>Status:</strong> Active Partner
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-lbl">Active Nests</div>
              <div class="stat-val">${listings.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Total Reservations</div>
              <div class="stat-val">${bookings.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Total Booked Stays</div>
              <div class="stat-val">${bookings.filter(b => b.status === 'confirmed').length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Total Partner Revenue</div>
              <div class="stat-val">₹${earningsTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <h3>Active Property Listings</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 40%;">Listing Title</th>
                <th>Location Details</th>
                <th>Price Per Night</th>
                <th>Popularity Views</th>
              </tr>
            </thead>
            <tbody>
              ${activeListingsHtml || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">No properties listed.</td></tr>'}
            </tbody>
          </table>

          <h3>Reservations & Booking Ledger</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 30%;">Listed Nest</th>
                <th>Guest</th>
                <th>Stay Period</th>
                <th>Status</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${bookingsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">No reservation history found.</td></tr>'}
            </tbody>
          </table>

          <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 80px; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
            This statement was generated automatically by the TravelNest partner platform. All pricing details exclude local taxes.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!currUser) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-brand-rose mx-auto">
          <Building2 className="h-8 w-8" />
        </div>
        <h4 className="mt-4 font-bold text-slate-800">Host Credentials Required</h4>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Please log in to manage your listings and view booking details.
        </p>
        <Link to="/login" className="mt-5 inline-block rounded-full bg-brand-rose px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-rose/90 text-decoration-none">
          Log In
        </Link>
      </div>
    );
  }

  // Dashboard calculations
  const totalListings = listings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const totalBookingsCount = confirmedBookings.length;
  
  const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Active guests (staying tonight)
  const today = new Date();
  const activeGuestsCount = confirmedBookings.filter(b => {
    const inDate = new Date(b.checkIn);
    const outDate = new Date(b.checkOut);
    return today >= inDate && today <= outDate;
  }).length;

  // Average host listings rating
  let sumRatings = 0;
  let reviewsCount = 0;
  listings.forEach(l => {
    if (l.reviews && l.reviews.length > 0) {
      l.reviews.forEach(r => {
        sumRatings += r.rating || 0;
        reviewsCount++;
      });
    }
  });
  const avgRating = reviewsCount > 0 ? (sumRatings / reviewsCount).toFixed(1) : 'N/A';
  const occupancyRate = totalListings > 0 ? 64 : 0;

  // Earnings by month (Simulated data based on actual bookings or templates)
  const monthlyEarnings = [
    { month: 'Jan', amount: Math.round(totalEarnings * 0.08) },
    { month: 'Feb', amount: Math.round(totalEarnings * 0.06) },
    { month: 'Mar', amount: Math.round(totalEarnings * 0.09) },
    { month: 'Apr', amount: Math.round(totalEarnings * 0.12) },
    { month: 'May', amount: Math.round(totalEarnings * 0.14) },
    { month: 'Jun', amount: Math.round(totalEarnings * 0.18) },
    { month: 'Jul', amount: Math.round(totalEarnings * 0.15) },
    { month: 'Aug', amount: Math.round(totalEarnings * 0.10) },
    { month: 'Sep', amount: Math.round(totalEarnings * 0.08) }
  ];

  const maxMonthAmount = Math.max(...monthlyEarnings.map(m => m.amount), 1000);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Host Console</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Welcome back, @{currUser.username}! Manage your Nest assets and analyze guest flows.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-bold text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-bold text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{t('exportPdf')}</span>
          </button>
          <Link
            to="/listings/new"
            className="flex items-center gap-1.5 rounded-full bg-brand-rose px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-rose/90 shadow-sm text-decoration-none cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t('nestNewHome')}</span>
          </Link>
        </div>
      </div>

      {/* Tabs Menu navigation */}
      <div className="flex border-b border-slate-100 mt-6 gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider pb-0.5">
        {[
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'bookings', name: 'Bookings', icon: Calendar },
          { id: 'calendar', name: 'Booking Calendar', icon: Calendar },
          { id: 'listings', name: 'Listings', icon: Building2 },
          { id: 'earnings', name: 'Earnings', icon: DollarSign }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 pb-2.5 border-b-2 cursor-pointer transition-colors ${
                isActive ? 'border-brand-rose text-brand-rose' : 'border-transparent hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
        </div>
      ) : (
        <div className="mt-8">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              
              {/* Metric grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { title: 'Total Listings', val: totalListings, icon: Building2, color: 'text-blue-500 bg-blue-50' },
                  { title: 'Total Bookings', val: totalBookingsCount, icon: Calendar, color: 'text-indigo-500 bg-indigo-50' },
                  { title: 'Total Revenue', val: `₹${totalEarnings.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-50' },
                  { title: 'Active Guests', val: activeGuestsCount, icon: Users, color: 'text-amber-500 bg-amber-50' },
                  { title: 'Occupancy Rate', val: `${occupancyRate}%`, icon: Percent, color: 'text-purple-500 bg-purple-50' },
                  { title: 'Average Rating', val: `${avgRating}★`, icon: Star, color: 'text-rose-500 bg-rose-50' }
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-28">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                        <div className={`p-1.5 rounded-lg ${card.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <span className="text-xl font-black text-slate-900 mt-2 leading-none">{card.val}</span>
                    </div>
                  );
                })}
              </div>

              {/* Earnings chart & recent activities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* SVG Graph block */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-50 pb-2 flex items-center justify-between">
                    <span>Earnings Trend (₹)</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-0.5 rounded-full">Simulated Monthly Data</span>
                  </h4>
                  
                  <div className="h-56 flex items-end justify-between gap-2.5 mt-4 pt-6 border-b border-slate-100 relative">
                    
                    {/* Visual Monthly bars */}
                    {monthlyEarnings.map((m, idx) => {
                      const pct = (m.amount / maxMonthAmount) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="relative w-full flex justify-center">
                            {/* Hover amount tooltip */}
                            <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md pointer-events-none whitespace-nowrap shadow-sm z-10 font-bold">
                              ₹{m.amount.toLocaleString()}
                            </span>
                            <div 
                              className="w-8 bg-brand-rose/85 rounded-t-lg transition-all duration-500 hover:bg-brand-rose hover:shadow-md cursor-pointer"
                              style={{ height: `${pct > 5 ? pct : 5}%`, minHeight: '6px' }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Listings performance metrics */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-50 pb-2">Properties Performance</h4>
                  
                  {listings.length > 0 ? (
                    <div className="flex flex-col gap-3.5">
                      {listings.slice(0, 4).map((l, idx) => {
                        const views = Math.round(100 + (l.price % 899));
                        const saves = Math.round(10 + (l.price % 31));
                        return (
                          <div key={l._id} className="flex items-center gap-3 justify-between">
                            <div className="flex flex-col truncate gap-0.5">
                              <span className="text-xs font-bold text-slate-800 truncate leading-none">{l.title}</span>
                              <span className="text-[10px] font-bold text-slate-400 leading-none">₹{l.price?.toLocaleString('en-IN')} / night</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold font-mono">{views}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold font-mono">{saves}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs text-slate-400">No properties performance recorded.</div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* BOOKINGS MANAGEMENT TAB */}
          {activeTab === 'bookings' && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Guest</th>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Property</th>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Stay Range</th>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Total Paid</th>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                    {bookings.length > 0 ? (
                      bookings.map((booking) => {
                        const guest = booking.user;
                        const listing = booking.listing;
                        const isConfirmed = booking.status === 'confirmed';
                        const isCancelled = booking.status === 'cancelled';

                        return (
                          <tr key={booking._id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-800">@{guest?.username || 'Guest'}</span>
                                <span className="text-[10px] text-slate-400 font-semibold leading-none">{guest?.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {listing ? (
                                <Link to={`/listings/${listing._id}`} className="font-bold text-slate-800 hover:text-brand-rose transition-colors max-w-[170px] truncate block text-decoration-none">
                                  {listing.title}
                                </Link>
                              ) : (
                                <span className="text-slate-400 italic font-normal">Listing Removed</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                              {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 font-extrabold text-slate-800">
                              ₹{booking.totalPrice?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                                isConfirmed 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : isCancelled 
                                  ? 'bg-rose-50 text-rose-600' 
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isConfirmed && (
                                <button
                                  onClick={() => handleCancelBooking(booking._id)}
                                  className="rounded-full border border-rose-100 bg-rose-50/10 hover:bg-rose-50 hover:text-rose-600 px-3 py-1.5 text-xs font-bold text-rose-500 transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          No reservations catalogued yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LISTINGS MANAGEMENT TAB */}
          {activeTab === 'listings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {listings.length > 0 ? (
                listings.map((l) => {
                  const views = Math.round(100 + (l.price % 899));
                  const saves = Math.round(10 + (l.price % 31));
                  return (
                    <div key={l._id} className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-all duration-300">
                      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                        <img src={l.image?.url} className="h-full w-full object-cover" alt={l.title} />
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                        <div className="flex flex-col gap-1 truncate">
                          <h4 className="font-extrabold text-sm text-slate-800 truncate m-0">{l.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">{l.location}, {l.country}</span>
                        </div>

                        {/* performance mini counts */}
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-slate-300" />
                            <span className="font-mono text-[10px]">{views} views</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-slate-300" />
                            <span className="font-mono text-[10px]">{saves} saves</span>
                          </span>
                        </div>

                        {/* action triggers */}
                        <div className="flex gap-2.5 mt-2 border-t border-slate-50 pt-3">
                          <Link
                            to={`/listings/${l._id}`}
                            className="flex-1 rounded-full border border-slate-100 bg-white hover:bg-slate-50 text-slate-600 text-center py-2 text-xs font-bold transition-all text-decoration-none flex items-center justify-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Link>
                          
                          <Link
                            to={`/listings/${l._id}/edit`}
                            className="flex-1 rounded-full border border-slate-100 bg-white hover:bg-slate-50 text-slate-600 text-center py-2 text-xs font-bold transition-all text-decoration-none flex items-center justify-center gap-1"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteListing(l._id)}
                            className="rounded-full border border-rose-100 bg-rose-50/10 hover:bg-rose-50 text-rose-500 p-2 transition-all flex items-center justify-center cursor-pointer"
                            title="Delete Nest"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-20 flex flex-col items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 m-0 leading-none">No active listings</h4>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs">You haven't listed any Nest properties yet. Click the button above to publish your first stay!</p>
                </div>
              )}
            </div>
          )}

          {/* EARNINGS TAB */}
          {activeTab === 'earnings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              
              {/* Earnings summary card */}
              <div className="lg:col-span-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Total Earnings</span>
                  <h3 className="text-3xl font-black text-slate-900 m-0">₹{totalEarnings.toLocaleString('en-IN')}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-2 leading-relaxed">
                    This includes all checkout transaction orders processed by simulated card, UPI, and bank transfers.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-600 text-xs font-extrabold bg-emerald-50/50 px-3 py-1.5 rounded-full self-start mt-4 border border-emerald-100/50">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Payouts Secured</span>
                </div>
              </div>

              {/* Transactions table */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-50 px-6 py-4 m-0 bg-slate-50/50">Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100 text-slate-400 font-bold">
                        <th className="px-6 py-3 text-xs uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-xs uppercase tracking-wider">Reference ID</th>
                        <th className="px-6 py-3 text-xs uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-xs uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                      {confirmedBookings.length > 0 ? (
                        confirmedBookings.slice(0, 5).map((booking, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/10">
                            <td className="px-6 py-3.5 text-slate-400">
                              {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-6 py-3.5 font-mono text-[10px]">
                              {booking.paymentDetails?.paymentId || `pay_mock_${booking._id.substring(0, 8)}`}
                            </td>
                            <td className="px-6 py-3.5 font-extrabold text-slate-800">
                              ₹{booking.totalPrice?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">
                                captured
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            No recent payouts logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <BookingCalendar listings={listings} bookings={bookings} />
          )}

        </div>
      )}

    </div>
  );
};

export default HostDashboard;

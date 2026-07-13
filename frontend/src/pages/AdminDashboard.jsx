import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Users, Building2, Calendar, DollarSign, AlertTriangle, 
  ShieldCheck, Ban, Trash2, ShieldAlert, Sparkles, Eye, Star, CheckCircle, 
  XCircle, Filter, Search, BarChart3, TrendingUp, Compass, Clock, RefreshCw
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'listings', 'reports'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Tab 1: Analytics & Charts States
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [timeFilter, setTimeFilter] = useState('year'); // 'week', 'month', 'year'

  // Tab 2: User management states
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'admin', 'user', 'host', 'banned', 'suspended'
  const [suspensionUserId, setSuspensionUserId] = useState(null);
  const [suspensionDate, setSuspensionDate] = useState('');

  // Tab 3: Listing management states
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingSearch, setListingSearch] = useState('');
  const [listingFilter, setListingFilter] = useState('all'); // 'all', 'featured', 'most_viewed'

  // Tab 4: Report management states
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportFilter, setReportFilter] = useState('all'); // 'all', 'pending', 'resolved', 'dismissed'

  // Destructive delete confirmation modal states
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [confirmDeleteListing, setConfirmDeleteListing] = useState(null);

  // Tooltip position state for charts
  const [chartTooltip, setChartTooltip] = useState(null); // { x, y, label, value }

  // 1. Fetch Overview Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get('/api/admin/stats');
      if (res.data && res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Analytics Charts Data
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await axios.get(`/api/admin/analytics?filter=${timeFilter}`);
      if (res.data && res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch platform analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // 3. Fetch User List
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`/api/admin/users?search=${userSearch}&filter=${userFilter}`);
      if (res.data && res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      toast.error('Failed to load platform users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 4. Fetch Listings List
  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const res = await axios.get(`/api/admin/listings?search=${listingSearch}&filter=${listingFilter}`);
      if (res.data && res.data.success) {
        setListings(res.data.listings);
      }
    } catch (err) {
      toast.error('Failed to load platform listings.');
    } finally {
      setLoadingListings(false);
    }
  };

  // 5. Fetch Reports List
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await axios.get(`/api/admin/reports?status=${reportFilter}`);
      if (res.data && res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err) {
      toast.error('Failed to load listing reports.');
    } finally {
      setLoadingReports(false);
    }
  };

  // Triggers when tabs change
  useEffect(() => {
    fetchStats();
    if (activeTab === 'overview') fetchAnalytics();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'listings') fetchListings();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, timeFilter]);

  // Debounced search triggers for Users and Listings
  useEffect(() => {
    if (activeTab === 'users') {
      const delay = setTimeout(fetchUsers, 400);
      return () => clearTimeout(delay);
    }
  }, [userSearch, userFilter]);

  useEffect(() => {
    if (activeTab === 'listings') {
      const delay = setTimeout(fetchListings, 400);
      return () => clearTimeout(delay);
    }
  }, [listingSearch, listingFilter]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [reportFilter]);

  // User Actions
  const handleToggleBan = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/ban`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle user ban state.');
    }
  };

  const handleUpdateSuspension = async (e) => {
    e.preventDefault();
    if (!suspensionUserId) return;
    try {
      const res = await axios.put(`/api/admin/users/${suspensionUserId}/suspend`, {
        suspendedUntil: suspensionDate || null
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSuspensionUserId(null);
        setSuspensionDate('');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update suspension date.');
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!confirmDeleteUser) return;
    try {
      const res = await axios.delete(`/api/admin/users/${confirmDeleteUser._id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setConfirmDeleteUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  // Listing Actions
  const handleToggleFeature = async (listingId) => {
    try {
      const res = await axios.put(`/api/admin/listings/${listingId}/feature`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchListings();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update featured status.');
    }
  };

  const handleDeleteListingConfirm = async () => {
    if (!confirmDeleteListing) return;
    try {
      const res = await axios.delete(`/api/admin/listings/${confirmDeleteListing._id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setConfirmDeleteListing(null);
        fetchListings();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete listing.');
    }
  };

  // Report Actions
  const handleReportAction = async (reportId, action) => {
    try {
      const res = await axios.put(`/api/admin/reports/${reportId}/resolve`, { action });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchReports();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update report status.');
    }
  };

  // Custom SVG Chart Render Helpers
  const renderRevenueChart = () => {
    if (!analytics || !analytics.revenueData || analytics.revenueData.length === 0) return null;
    const data = analytics.revenueData;
    const maxVal = Math.max(...data.map(d => d.revenue)) || 100000;
    
    // SVG Dimensions
    const width = 600;
    const height = 180;
    const paddingLeft = 55;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Generate path points
    const points = data.map((d, idx) => {
      const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.revenue / maxVal) * chartHeight;
      return { x, y, label: d.month, value: `₹${d.revenue.toLocaleString('en-IN')}` };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fe424d" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fe424d" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = paddingTop + p * chartHeight;
            const gridVal = Math.round(maxVal * (1 - p));
            return (
              <g key={i} className="opacity-40">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                <text x={paddingLeft - 10} y={y + 3.5} textAnchor="end" className="text-[9px] fill-slate-400 font-mono font-bold">
                  ₹{gridVal >= 1000 ? `${(gridVal/1000).toFixed(0)}k` : gridVal}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#revGrad)" />

          {/* Line Path */}
          <path d={linePath} fill="none" stroke="#fe424d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#ffffff"
              stroke="#fe424d"
              strokeWidth="2.5"
              className="cursor-pointer transition-all hover:r-6 active:scale-125"
              onMouseEnter={(e) => {
                const rect = e.target.getBoundingClientRect();
                setChartTooltip({
                  x: p.x - 50,
                  y: p.y - 45,
                  label: p.label,
                  value: p.value
                });
              }}
              onMouseLeave={() => setChartTooltip(null)}
            />
          ))}

          {/* X Axis ticks */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={height - 5} textAnchor="middle" className="text-[9px] fill-slate-400 font-bold uppercase tracking-wider">
              {p.label}
            </text>
          ))}
        </svg>

        {/* Tooltip Overlay */}
        {chartTooltip && (
          <div 
            className="absolute z-10 bg-slate-900 text-white font-semibold text-[10px] p-2 rounded-xl shadow-lg border border-slate-800 pointer-events-none transition-all duration-150 animate-in fade-in duration-100"
            style={{ left: `${(chartTooltip.x / width) * 100}%`, top: `${(chartTooltip.y / height) * 100}%` }}
          >
            <div className="font-extrabold uppercase tracking-widest text-[8px] text-slate-400 mb-0.5">{chartTooltip.label}</div>
            <div className="font-mono text-brand-rose">{chartTooltip.value}</div>
          </div>
        )}
      </div>
    );
  };

  const renderBookingsChart = () => {
    if (!analytics || !analytics.bookingTrends || analytics.bookingTrends.length === 0) return null;
    const data = analytics.bookingTrends;
    const maxVal = Math.max(...data.map(d => d.count)) || 10;

    const width = 600;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const colWidth = chartWidth / data.length;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Y Axis Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = paddingTop + p * chartHeight;
            const gridVal = Math.round(maxVal * (1 - p));
            return (
              <g key={i} className="opacity-40">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeWidth="0.8" />
                <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" className="text-[9px] fill-slate-400 font-mono font-bold">
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Bar pillars */}
          {data.map((d, idx) => {
            const colHeight = (d.count / maxVal) * chartHeight;
            const x = paddingLeft + idx * colWidth + colWidth * 0.15;
            const y = paddingTop + chartHeight - colHeight;
            const w = colWidth * 0.7;

            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={w}
                height={colHeight > 2 ? colHeight : 2}
                rx="3"
                className="fill-indigo-500/80 hover:fill-indigo-500 cursor-pointer transition-colors duration-200"
                onMouseEnter={(e) => {
                  setChartTooltip({
                    x: x + w/2 - 50,
                    y: y - 45,
                    label: d.label,
                    value: `${d.count} Bookings`
                  });
                }}
                onMouseLeave={() => setChartTooltip(null)}
              />
            );
          })}

          {/* X Axis ticks */}
          {data.map((d, i) => {
            const x = paddingLeft + i * colWidth + colWidth/2;
            return (
              <text key={i} x={x} y={height - 5} textAnchor="middle" className="text-[8px] fill-slate-400 font-extrabold uppercase truncate max-w-10">
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Tooltip Overlay */}
        {chartTooltip && (
          <div 
            className="absolute z-10 bg-slate-900 text-white font-semibold text-[10px] p-2 rounded-xl shadow-lg border border-slate-800 pointer-events-none transition-all duration-150 animate-in fade-in"
            style={{ left: `${(chartTooltip.x / width) * 100}%`, top: `${(chartTooltip.y / height) * 100}%` }}
          >
            <div className="font-extrabold uppercase tracking-widest text-[8px] text-slate-400 mb-0.5">{chartTooltip.label}</div>
            <div className="font-mono text-indigo-400">{chartTooltip.value}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-350">
      
      {/* Upper Brand Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-brand-rose">
            <ShieldCheck className="h-7 w-7 stroke-[2.2]" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 m-0">Admin Dashboard</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            Security Control, Content Moderation, Financial Monitoring, and Analytics Insights.
          </p>
        </div>

        {/* Sync state indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === 'overview') fetchAnalytics();
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'listings') fetchListings();
              if (activeTab === 'reports') fetchReports();
              toast.info('Data refreshed from DB.');
            }}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-850 px-4.5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Overview Row */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {loadingStats ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 h-24 shadow-xs animate-pulse dark:border-slate-850 dark:bg-slate-900" />
          ))
        ) : (
          stats && [
            { label: 'Total revenue', val: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
            { label: 'Total bookings', val: stats.totalBookings, icon: Calendar, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
            { label: 'Active listings', val: stats.activeListings, icon: Building2, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
            { label: 'Total users', val: stats.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
            { label: 'Platform hosts', val: stats.totalHosts, icon: ShieldCheck, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
            { label: 'Pending reports', val: stats.pendingReports, icon: AlertTriangle, color: stats.pendingReports > 0 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 animate-pulse' : 'text-slate-400 bg-slate-50 dark:bg-slate-850' },
            { label: 'Active users', val: stats.activeUsers, icon: CheckCircle, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
            { label: 'New listings', val: stats.totalListings, icon: Sparkles, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' }
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.015)] flex flex-col justify-between h-24 dark:border-slate-850 dark:bg-slate-900 transition-all hover:scale-102 hover:shadow-xs duration-200">
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-16 leading-tight">{c.label}</span>
                  <div className={`p-1 rounded-lg ${c.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-slate-150 truncate leading-none mt-2">{c.val}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Tabs Menu navigation */}
      <div className="flex border-b border-slate-100 dark:border-slate-850 mt-8 gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider pb-0.5">
        {[
          { id: 'overview', name: 'Analytics & Charts', icon: BarChart3 },
          { id: 'users', name: 'User Management', icon: Users },
          { id: 'listings', name: 'Listing Management', icon: Building2 },
          { id: 'reports', name: 'Report Listing Center', icon: AlertTriangle }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 pb-2.5 border-b-2 cursor-pointer transition-colors ${
                isActive ? 'border-brand-rose text-brand-rose' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels Content */}
      <div className="mt-8">

        {/* TAB 1: ANALYTICS & CHARTS */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            
            {/* Header controls (time filter) */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-850 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-350 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-brand-rose" />
                <span>Interactive Chart Displays</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time filter:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white py-1 px-3 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-750 dark:bg-slate-850 dark:text-slate-100 focus:dark:bg-slate-900"
                >
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                  <option value="year">Past 12 Months</option>
                </select>
              </div>
            </div>

            {loadingAnalytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64 rounded-3xl bg-white border border-slate-100 animate-pulse dark:bg-slate-900 dark:border-slate-850" />
                <div className="h-64 rounded-3xl bg-white border border-slate-100 animate-pulse dark:bg-slate-900 dark:border-slate-850" />
              </div>
            ) : (
              analytics && (
                <>
                  {/* Two large core charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Monthly Revenue Chart */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.015)] dark:border-slate-850 dark:bg-slate-900 flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-2">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-150">Revenue Trends (₹)</h4>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">Total Secured</span>
                      </div>
                      {renderRevenueChart()}
                    </div>

                    {/* Monthly Bookings Bar Chart */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.015)] dark:border-slate-850 dark:bg-slate-900 flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-2">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-150">Booking Volume Trends</h4>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-950/20 dark:text-indigo-400">Reservations</span>
                      </div>
                      {renderBookingsChart()}
                    </div>
                  </div>

                  {/* Four Columns Grid for breakdown data charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    
                    {/* Popular Cities list */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex flex-col gap-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-850 pb-2 flex items-center justify-between">
                        <span>Popular Cities</span>
                        <Compass className="h-4 w-4 text-slate-400" />
                      </h5>
                      <div className="flex flex-col gap-3">
                        {analytics.popularCities.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                              <span>{item.city}</span>
                              <span className="font-bold">{item.listingsCount} nests</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-brand-rose h-full transition-all" style={{ width: `${(item.listingsCount / Math.max(...analytics.popularCities.map(c => c.listingsCount))) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Most Booked properties */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex flex-col gap-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-850 pb-2 flex items-center justify-between">
                        <span>Most Booked</span>
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </h5>
                      <div className="flex flex-col gap-3">
                        {analytics.mostBookedProperties.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                              <span className="truncate max-w-36">{item.title}</span>
                              <span className="font-bold">{item.bookingsCount} stay{item.bookingsCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(item.bookingsCount / Math.max(...analytics.mostBookedProperties.map(p => p.bookingsCount))) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Highest Rated Properties */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex flex-col gap-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-850 pb-2 flex items-center justify-between">
                        <span>Highest Rated</span>
                        <Star className="h-4 w-4 text-slate-400" />
                      </h5>
                      <div className="flex flex-col gap-3">
                        {analytics.ratedListings.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                              <span className="truncate max-w-36">{item.title}</span>
                              <span className="font-bold text-amber-500 flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                {item.rating}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-400 h-full transition-all" style={{ width: `${(item.rating / 5) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Most Viewed listings */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex flex-col gap-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-850 pb-2 flex items-center justify-between">
                        <span>Most Viewed</span>
                        <Eye className="h-4 w-4 text-slate-400" />
                      </h5>
                      <div className="flex flex-col gap-3">
                        {analytics.mostViewedListings.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                              <span className="truncate max-w-36">{item.title}</span>
                              <span className="font-bold flex items-center gap-0.5">
                                <Eye className="h-3 w-3 text-slate-400" />
                                {item.views}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-teal-500 h-full transition-all" style={{ width: `${(item.views / Math.max(...analytics.mostViewedListings.map(v => v.views))) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Occupancy and Host Earnings Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Radial Occupancy Gauge */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 text-center">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-850 pb-2 w-full text-left">Occupancy Rate</h4>
                      
                      {/* Circle Gauge SVG */}
                      <div className="relative flex items-center justify-center h-36 w-36">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="12" fill="transparent" className="dark:stroke-slate-800" />
                          <circle
                            cx="72"
                            cy="72"
                            r="60"
                            stroke="#fe424d"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 60}
                            strokeDashoffset={2 * Math.PI * 60 * (1 - analytics.occupancyRate / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{analytics.occupancyRate}%</span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Booked Nights</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold max-w-[200px] leading-normal">
                        Calculated by dividing booked nights by total available property nights.
                      </p>
                    </div>

                    {/* Top Hosts Table */}
                    <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white shadow-xs dark:border-slate-850 dark:bg-slate-900 overflow-hidden flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-850 p-6 m-0 bg-slate-50/50 dark:bg-slate-850">Top Host Performers</h4>
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-white dark:bg-slate-900">
                              <th className="px-6 py-3 text-[10px] uppercase tracking-wider">Username</th>
                              <th className="px-6 py-3 text-[10px] uppercase tracking-wider">Nests Owned</th>
                              <th className="px-6 py-3 text-[10px] uppercase tracking-wider">Bookings count</th>
                              <th className="px-6 py-3 text-[10px] uppercase tracking-wider">Earnings</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-350">
                            {analytics.topHosts.map((host, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/10">
                                <td className="px-6 py-3.5 text-slate-800 dark:text-slate-150">@{host.username}</td>
                                <td className="px-6 py-3.5 font-mono">{host.listingsCount} listings</td>
                                <td className="px-6 py-3.5 font-mono">{host.bookingCount} stays</td>
                                <td className="px-6 py-3.5 font-extrabold text-slate-900 dark:text-slate-100">
                                  ₹{host.revenue.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                </>
              )
            )}

          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Filter controls */}
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="search"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-brand-rose focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100 focus:dark:bg-slate-900"
                />
                <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Role:</span>
                </span>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100 focus:dark:bg-slate-900"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Administrators</option>
                  <option value="user">Regular Users</option>
                  <option value="host">Hosts only</option>
                  <option value="banned">Banned Users</option>
                  <option value="suspended">Suspended Users</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/20 dark:bg-slate-850/50">
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Listings</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Bookings</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-350">
                    {loadingUsers ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="7" className="h-12 bg-slate-50/10" />
                        </tr>
                      ))
                    ) : users.length > 0 ? (
                      users.map((user) => {
                        const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil) > new Date();
                        let statusBadge = (
                          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 uppercase dark:bg-emerald-950/20 dark:text-emerald-400">
                            Active
                          </span>
                        );
                        if (user.isBanned) {
                          statusBadge = (
                            <span className="rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-[9px] font-bold text-rose-700 uppercase dark:bg-rose-950/20 dark:text-rose-450">
                              Banned
                            </span>
                          );
                        } else if (isSuspended) {
                          statusBadge = (
                            <span 
                              title={`Suspended until ${new Date(user.suspendedUntil).toLocaleDateString()}`}
                              className="rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[9px] font-bold text-amber-700 uppercase dark:bg-amber-950/20 dark:text-amber-450 flex items-center gap-1 w-max cursor-help"
                            >
                              <Clock className="h-3 w-3" />
                              <span>Suspended</span>
                            </span>
                          );
                        }

                        return (
                          <tr key={user._id} className="hover:bg-slate-50/10">
                            <td className="px-6 py-3.5 text-slate-900 dark:text-slate-150">
                              <span className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 flex items-center justify-center border border-slate-200/50">
                                  {user.username.substring(0, 2).toUpperCase()}
                                </div>
                                <span>@{user.username}</span>
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">{user.email}</td>
                            <td className="px-6 py-3.5">
                              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                                user.role === 'admin' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400' : 'bg-slate-50 border border-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 font-mono">{user.listingCount}</td>
                            <td className="px-6 py-3.5 font-mono">{user.bookingCount}</td>
                            <td className="px-6 py-3.5">{statusBadge}</td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center justify-center gap-2.5">
                                
                                {/* Ban Toggle button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleBan(user._id)}
                                  title={user.isBanned ? "Unban User" : "Ban User"}
                                  className={`rounded-full p-1.5 transition-colors cursor-pointer border-none flex items-center justify-center ${
                                    user.isBanned 
                                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400' 
                                      : 'bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-rose-950/20'
                                  }`}
                                >
                                  <Ban className="h-4 w-4" />
                                </button>

                                {/* Suspension timer trigger */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSuspensionUserId(user._id);
                                    setSuspensionDate(user.suspendedUntil ? new Date(user.suspendedUntil).toISOString().split('T')[0] : '');
                                  }}
                                  title="Temporary Suspend"
                                  className={`rounded-full p-1.5 bg-slate-50 text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-amber-950/20 transition-colors cursor-pointer border-none flex items-center justify-center`}
                                >
                                  <Clock className="h-4 w-4" />
                                </button>

                                {/* Delete User button */}
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteUser(user)}
                                  title="Delete Account Permanently"
                                  className="rounded-full p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-650 dark:bg-slate-850 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border-none flex items-center justify-center"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          No users found matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LISTING MANAGEMENT */}
        {activeTab === 'listings' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            
            {/* Filters panel */}
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="search"
                  placeholder="Search listings by title, location..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-brand-rose focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100 focus:dark:bg-slate-900"
                />
                <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Type:</span>
                </span>
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100 focus:dark:bg-slate-900"
                >
                  <option value="all">All Listings</option>
                  <option value="featured">Featured Nests</option>
                  <option value="standard">Standard Nests</option>
                  <option value="most_viewed">Sort by Views count</option>
                </select>
              </div>
            </div>

            {/* Listings table grid */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/20 dark:bg-slate-850/50">
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Property Details</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Base Price</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Views</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Reports count</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-350">
                    {loadingListings ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="7" className="h-12 bg-slate-50/10" />
                        </tr>
                      ))
                    ) : listings.length > 0 ? (
                      listings.map((l) => (
                        <tr key={l._id} className="hover:bg-slate-50/10">
                          <td className="px-6 py-3.5 text-slate-900 dark:text-slate-150">
                            <span className="flex items-center gap-3">
                              <img 
                                src={l.image?.url || (l.images && l.images[0]?.url) || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=80&q=80"} 
                                className="h-9 w-12 rounded-lg object-cover border border-slate-100" 
                                alt="" 
                              />
                              <div className="flex flex-col gap-0.5 max-w-[200px]">
                                <span className="font-extrabold truncate">{l.title}</span>
                                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1">
                                  {l.type}
                                  {l.isFeatured && <span className="bg-rose-50 text-brand-rose px-1.5 py-0.5 rounded-full dark:bg-rose-950/20">Featured</span>}
                                </span>
                              </div>
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                            {l.owner ? `@${l.owner.username}` : 'N/A'}
                          </td>
                          <td className="px-6 py-3.5 truncate max-w-44 text-slate-550 dark:text-slate-400">{l.location}, {l.country}</td>
                          <td className="px-6 py-3.5 font-extrabold text-slate-800 dark:text-slate-200">₹{l.price?.toLocaleString()}</td>
                          <td className="px-6 py-3.5 font-mono">{l.views || 0}</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`rounded-full px-2 py-0.5 font-bold ${
                              l.reportCount > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse' : 'bg-slate-50 text-slate-400 dark:bg-slate-850'
                            }`}>
                              {l.reportCount || 0} reports
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2.5">
                              
                              {/* Toggle Featured */}
                              <button
                                type="button"
                                onClick={() => handleToggleFeature(l._id)}
                                title={l.isFeatured ? "Unfeature listing" : "Feature listing"}
                                className={`rounded-full p-1.5 transition-colors cursor-pointer border-none flex items-center justify-center ${
                                  l.isFeatured 
                                    ? 'bg-rose-50 text-brand-rose hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-450' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-brand-rose dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-rose-950/20'
                                }`}
                              >
                                <Sparkles className="h-4 w-4" />
                              </button>

                              {/* View Listing details */}
                              <a
                                href={`/listings/${l._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open details view"
                                className="rounded-full p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </a>

                              {/* Delete Listing */}
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteListing(l)}
                                title="Remove Inappropriate listing"
                                className="rounded-full p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-650 dark:bg-slate-850 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border-none flex items-center justify-center"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          No listings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: REPORT LISTING CENTER */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Filter */}
            <div className="flex justify-end bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Status:</span>
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100 focus:dark:bg-slate-900"
                >
                  <option value="all">All reports</option>
                  <option value="pending">Pending reviews</option>
                  <option value="resolved">Resolved reports</option>
                  <option value="dismissed">Dismissed reports</option>
                </select>
              </div>
            </div>

            {/* Reports table */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/20 dark:bg-slate-850/50">
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Reported Nest</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Reporter</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Violation Reason</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Description details</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3.5 text-[10px] uppercase tracking-wider text-center">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-350">
                    {loadingReports ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="7" className="h-12 bg-slate-50/10" />
                        </tr>
                      ))
                    ) : reports.length > 0 ? (
                      reports.map((report) => (
                        <tr key={report._id} className="hover:bg-slate-50/10">
                          <td className="px-6 py-3.5 text-slate-900 dark:text-slate-150">
                            {report.listing ? (
                              <a
                                href={`/listings/${report.listing._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-extrabold text-slate-800 hover:text-brand-rose transition-colors dark:text-slate-200"
                              >
                                {report.listing.title}
                              </a>
                            ) : (
                              <span className="text-slate-400 line-through">Deleted Property</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                            {report.reporter ? `@${report.reporter.username}` : 'Deleted User'}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[9px] font-black uppercase dark:bg-rose-950/20 dark:text-rose-400">
                              {report.reason}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 max-w-xs truncate text-slate-550 dark:text-slate-400" title={report.description}>
                            {report.description || <span className="text-slate-400 font-bold italic">No text details provided.</span>}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${
                              report.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 animate-pulse' :
                              report.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-400 font-medium">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              {report.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleReportAction(report._id, 'resolved')}
                                    title="Mark Resolved"
                                    className="rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 transition-colors cursor-pointer border-none flex items-center justify-center dark:bg-emerald-950/20 dark:text-emerald-400"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReportAction(report._id, 'dismissed')}
                                    title="Dismiss report"
                                    className="rounded-full bg-slate-50 text-slate-500 hover:bg-slate-200 p-1.5 transition-colors cursor-pointer border-none flex items-center justify-center dark:bg-slate-850 dark:text-slate-400"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 uppercase italic">Archived</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          No reports logged under this status.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: SUSPENSION CONFIGURATION DATE PICKER */}
      {suspensionUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-50 pb-3 dark:text-slate-100 dark:border-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>Configure Account Suspension</span>
            </h3>
            <form onSubmit={handleUpdateSuspension} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suspend Until Date</label>
                <input
                  type="date"
                  required
                  value={suspensionDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSuspensionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-150"
                />
              </div>
              <p className="text-[9px] leading-normal text-slate-400 font-semibold">
                Note: During suspension, the user cannot log in and active login tokens will be immediately invalidated.
              </p>
              <div className="flex justify-end gap-3.5 border-t border-slate-50 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    // Revoke suspension to none
                    axios.put(`/api/admin/users/${suspensionUserId}/suspend`, { suspendedUntil: null })
                      .then(res => {
                        toast.success('Suspension revoked!');
                        setSuspensionUserId(null);
                        fetchUsers();
                      })
                      .catch(err => toast.error('Failed to revoke suspension.'));
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4.5 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:border-slate-750 dark:bg-slate-800 dark:hover:bg-rose-950/20"
                >
                  Revoke / Lift
                </button>
                <button
                  type="button"
                  onClick={() => setSuspensionUserId(null)}
                  className="rounded-full border border-slate-200 bg-white px-4.5 py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-rose px-5 py-2 text-[10px] font-bold text-white hover:bg-brand-rose/90"
                >
                  Apply Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE USER CONFIRMATION SAFEGUARD */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 text-rose-600 border-b border-slate-100 pb-3.5 dark:border-slate-800">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-sm font-black uppercase tracking-wider">Destructive Safeguard Warning</h3>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Are you absolutely sure you want to permanently delete user account <span className="text-brand-rose">@{confirmDeleteUser.username}</span>?
              </p>
              
              {/* Cascade warnings alert */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:bg-rose-950/10 dark:border-rose-900/50">
                <span className="text-[10.5px] leading-normal text-rose-800 dark:text-rose-400 font-semibold block mb-1 font-extrabold uppercase tracking-wide">
                  This action triggers database cascading deletions:
                </span>
                <ul className="list-disc list-inside text-[10px] leading-normal text-rose-700/90 dark:text-rose-450 font-bold space-y-0.5">
                  <li>ALL listing properties nested by this user will be removed.</li>
                  <li>ALL bookings reserved by this user (and bookings for their properties) will be deleted.</li>
                  <li>ALL reviews, reports, and payments history logged to this account will be purged.</li>
                </ul>
              </div>

              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
                This operation is irreversible.
              </span>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-350"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUserConfirm}
                className="rounded-full bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1 cursor-pointer border-none"
              >
                <Trash2 className="h-4 w-4" />
                <span>Confirm Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE LISTING CONFIRMATION */}
      {confirmDeleteListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 text-rose-600 border-b border-slate-100 pb-3.5 dark:border-slate-800">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-sm font-black uppercase tracking-wider">Remove Property Listing</h3>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Are you sure you want to delete listing <span className="text-brand-rose">"{confirmDeleteListing.title}"</span>?
              </p>
              
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:bg-rose-950/10 dark:border-rose-900/50">
                <span className="text-[10.5px] leading-normal text-rose-800 dark:text-rose-400 font-semibold block mb-1 font-extrabold uppercase tracking-wide">
                  This action will purge:
                </span>
                <ul className="list-disc list-inside text-[10px] leading-normal text-rose-700/90 dark:text-rose-450 font-bold space-y-0.5">
                  <li>The listing details and maps geometry location indexing.</li>
                  <li>ALL reservations and active bookings made on this listing.</li>
                  <li>ALL reviews submitted by guests on this property.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteListing(null)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-350"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteListingConfirm}
                className="rounded-full bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1 cursor-pointer border-none"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Property</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

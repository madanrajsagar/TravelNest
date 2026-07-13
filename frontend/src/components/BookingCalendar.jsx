import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Calendar, ShieldCheck, DollarSign, Info } from 'lucide-react';

export const BookingCalendar = ({ listings, bookings }) => {
  const [selectedListingId, setSelectedListingId] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Local state to simulate custom blocked dates by the host
  const [blockedDates, setBlockedDates] = useState(() => {
    try {
      const saved = localStorage.getItem('host_blocked_dates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save blocked dates to localStorage when changed
  useEffect(() => {
    localStorage.setItem('host_blocked_dates', JSON.stringify(blockedDates));
  }, [blockedDates]);

  // Filter bookings based on selected listing
  const filteredBookings = bookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    if (selectedListingId === 'all') return true;
    return (b.listing?._id || b.listing) === selectedListingId;
  });

  // Date details calculation helper
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to determine status of a specific day
  const getDayStatus = (day) => {
    const checkDate = new Date(year, month, day);
    checkDate.setHours(12, 0, 0, 0); // normalize hour

    const checkDateStr = checkDate.toDateString();

    // Check if user blocked it
    if (blockedDates.includes(checkDateStr)) {
      return { type: 'blocked', label: 'Blocked by Host' };
    }

    // Check bookings
    for (const b of filteredBookings) {
      const inDate = new Date(b.checkIn);
      inDate.setHours(12, 0, 0, 0);
      const outDate = new Date(b.checkOut);
      outDate.setHours(12, 0, 0, 0);

      if (checkDate >= inDate && checkDate <= outDate) {
        if (b.paymentDetails?.status === 'pending' || b.paymentDetails?.status === 'failed') {
          return { type: 'pending', booking: b, label: 'Pending Booking' };
        }
        return { type: 'booked', booking: b, label: 'Booked' };
      }
    }

    return { type: 'available', label: 'Available' };
  };

  // Handle day click
  const handleDayClick = (day) => {
    const status = getDayStatus(day);
    const dateObj = new Date(year, month, day);
    const dateStr = dateObj.toDateString();

    if (status.type === 'booked' || status.type === 'pending') {
      setSelectedBooking(status.booking);
    } else {
      setSelectedBooking(null);
      // Toggle blocking for available/blocked dates
      if (blockedDates.includes(dateStr)) {
        setBlockedDates(prev => prev.filter(d => d !== dateStr));
      } else {
        setBlockedDates(prev => [...prev, dateStr]);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Render days array
  const dayCells = [];
  // Empty slots for previous month padding
  for (let i = 0; i < firstDayOfMonth; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-16 border-b border-r border-slate-50 dark:border-slate-800 bg-slate-50/20" />);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const status = getDayStatus(d);
    const dateObj = new Date(year, month, d);
    const isToday = new Date().toDateString() === dateObj.toDateString();

    let bgColor = 'hover:bg-slate-50 dark:hover:bg-slate-800';
    let textColor = 'text-slate-800 dark:text-slate-200';
    let ringColor = '';

    if (status.type === 'booked') {
      bgColor = 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/30';
      textColor = 'text-rose-700 dark:text-rose-450 font-bold';
      ringColor = 'border-l-4 border-l-rose-500';
    } else if (status.type === 'pending') {
      bgColor = 'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/30';
      textColor = 'text-amber-700 dark:text-amber-450 font-bold';
      ringColor = 'border-l-4 border-l-amber-500';
    } else if (status.type === 'blocked') {
      bgColor = 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-700/50';
      textColor = 'text-slate-400 dark:text-slate-500 line-through';
      ringColor = 'border-l-4 border-l-slate-450';
    } else {
      // available
      bgColor = 'bg-emerald-50/30 dark:bg-emerald-950/5 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/15';
      textColor = 'text-emerald-800 dark:text-emerald-450';
    }

    dayCells.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => handleDayClick(d)}
        className={`h-16 border-b border-r border-slate-100 dark:border-slate-800 text-left p-2 flex flex-col justify-between transition-all relative outline-none focus:bg-slate-50 ${bgColor} ${textColor} ${ringColor}`}
      >
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isToday ? 'bg-brand-rose text-white' : ''}`}>
          {d}
        </span>
        <span className="text-[8px] font-black uppercase tracking-wider truncate w-full opacity-80">
          {status.type === 'booked' && 'Booked'}
          {status.type === 'pending' && 'Pending'}
          {status.type === 'blocked' && 'Blocked'}
          {status.type === 'available' && 'Available'}
        </span>
      </button>
    );
  }

  // Next month padding to make full rows
  const totalCells = dayCells.length;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remainingCells; i++) {
    dayCells.push(<div key={`empty-end-${i}`} className="h-16 border-b border-r border-slate-50 dark:border-slate-800 bg-slate-50/20" />);
  }

  const selectedListingTitle = selectedListingId === 'all' 
    ? 'All Properties' 
    : listings.find(l => l._id === selectedListingId)?.title || 'Selected Property';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Calendar Header with Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
        
        {/* Listing filter dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Listing</label>
          <select
            value={selectedListingId}
            onChange={(e) => {
              setSelectedListingId(e.target.value);
              setSelectedBooking(null);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-700 focus:border-brand-rose focus:bg-white focus:outline-none dark:border-slate-850 dark:bg-slate-850 dark:text-slate-100 focus:dark:bg-slate-900"
          >
            <option value="all">All listings ({listings.length})</option>
            {listings.map((l) => (
              <option key={l._id} value={l._id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector navigation */}
        <div className="flex items-center gap-4 self-center sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="rounded-full border border-slate-200 bg-white p-2 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 min-w-32 text-center uppercase tracking-wider">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={handleNextMonth}
            className="rounded-full border border-slate-200 bg-white p-2 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Status Indicators list */}
        <div className="flex flex-wrap items-center gap-3.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-450" />
            <span>Blocked</span>
          </div>
        </div>

      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendar Box */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-7 text-center py-3 bg-slate-50/50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-slate-100 dark:border-slate-800">
            {dayCells}
          </div>
          <div className="p-3 bg-slate-50/30 text-[9px] font-semibold text-slate-450 flex items-center gap-1.5 dark:bg-slate-850/20">
            <Info className="h-3.5 w-3.5" />
            <span>Tip: Clicking on an available day toggles its blocked status for guests. Click a booked day to view guest details.</span>
          </div>
        </div>

        {/* Selected Day/Booking Details Panel */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex-1">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-50 dark:border-slate-800 pb-2.5">
              Reservation details
            </h4>
            
            {selectedBooking ? (
              <div className="flex flex-col gap-5 mt-4.5 animate-in fade-in duration-200">
                {/* Property name */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {selectedBooking.listing?.title || selectedListingTitle}
                  </span>
                </div>

                {/* Guest Details */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-full bg-brand-rose/10 flex items-center justify-center text-brand-rose font-black text-xs">
                    {selectedBooking.user?.username?.substring(0, 2).toUpperCase() || 'GU'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      @{selectedBooking.user?.username || 'Guest'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{selectedBooking.user?.email || 'N/A'}</span>
                  </div>
                </div>

                {/* Date range grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5 bg-slate-50/50 dark:bg-slate-850/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check In</span>
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                      {new Date(selectedBooking.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 bg-slate-50/50 dark:bg-slate-850/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check Out</span>
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                      {new Date(selectedBooking.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Status elements */}
                <div className="flex flex-col gap-3.5 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Status</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedBooking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedBooking.paymentDetails?.status === 'captured' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {selectedBooking.paymentDetails?.status || 'pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-0.5">
                      <span className="text-slate-400 font-bold">₹</span>
                      {selectedBooking.totalPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                <Calendar className="h-10 w-10 text-slate-200 dark:text-slate-700 stroke-[1.5]" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select a reserved cell</span>
                <span className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
                  Click on any colored booked or pending dates on the calendar to load guest stayed summaries.
                </span>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

export default BookingCalendar;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Compass, Search, Globe, Menu, User, LogOut, LogIn, UserPlus, Plus, Heart, Calendar, FileText, Building2, Bell, MessageSquare, Sun, Moon, ShieldAlert, Mic, Camera } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import ImageSearchModal from './ImageSearchModal';

export const Navbar = ({ onSearch }) => {
  const { currUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { language, setLanguage, t } = useLanguage();
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Web Speech API is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak your destination details.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      toast.error(`Voice capture failed: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech transcript captured:", transcript);
      
      let query = transcript.replace(/\.$/g, "").trim();
      const lowerQuery = query.toLowerCase();
      let searchVal = query;

      if (lowerQuery.includes("in ")) {
        const parts = lowerQuery.split("in ");
        if (parts[1]) {
          const cityParts = parts[1].split(" ");
          searchVal = cityParts[0].trim();
        }
      } else if (lowerQuery.includes("near ")) {
        const parts = lowerQuery.split("near ");
        if (parts[1]) {
          const locationParts = parts[1].split(" ");
          searchVal = locationParts[0].trim();
        }
      }

      setSearchQuery(searchVal);
      if (onSearch) {
        onSearch(searchVal);
      }
      toast.success(`Voice Search: "${query}"`);
      navigate('/listings');
    };

    recognition.start();
  };

  // Unread Alerts Bell State Hooks
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchUnreadNotifications = async () => {
    if (!currUser) return;
    try {
      const res = await axios.get('/api/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (currUser) {
      fetchUnreadNotifications();
      const timer = setInterval(fetchUnreadNotifications, 12000);
      return () => clearInterval(timer);
    }
  }, [currUser]);

  const socketRef = React.useRef(null);

  React.useEffect(() => {
    if (currUser && currUser.role === 'admin') {
      const socketUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:8080' 
        : window.location.origin;

      if (!socketRef.current) {
        import('socket.io-client').then(({ io }) => {
          socketRef.current = io(socketUrl);

          socketRef.current.on('adminNotification', (data) => {
            console.log('Realtime admin notification received:', data);
            toast.warning(`⚠️ [Report Received] ${data.message}`, {
              position: 'top-right',
              autoClose: 5000
            });
            fetchUnreadNotifications();
          });
        });
      }
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currUser]);

  React.useEffect(() => {
    const closeNotif = () => setShowNotifications(false);
    if (showNotifications) {
      window.addEventListener('click', closeNotif);
    }
    return () => window.removeEventListener('click', closeNotif);
  }, [showNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Search Autocomplete suggestions states
  const [allListings, setAllListings] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const fetchAllListingsForSearch = async () => {
    try {
      const res = await axios.get('/api/listings');
      setAllListings(res.data);
    } catch (err) {
      console.error('Failed to pre-fetch search queries', err);
    }
  };

  const handleFocus = () => {
    if (allListings.length === 0) {
      fetchAllListingsForSearch();
    }
    setShowSuggestions(true);
  };

  // Calculate matched suggestion values dynamically
  React.useEffect(() => {
    if (!searchQuery.trim() || allListings.length === 0) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const collected = [];

    allListings.forEach((listing) => {
      const title = listing.title || '';
      const city = listing.location || '';
      const country = listing.country || '';
      const category = listing.category || '';

      if (title.toLowerCase().includes(q)) {
        collected.push({ text: title, type: 'property' });
      }
      if (city.toLowerCase().includes(q)) {
        collected.push({ text: city, type: 'location' });
      }
      if (country.toLowerCase().includes(q)) {
        collected.push({ text: country, type: 'country' });
      }
      if (category.toLowerCase().includes(q)) {
        collected.push({ text: category, type: 'type' });
      }
    });

    // Dedup collected items
    const unique = [];
    const seen = new Set();
    collected.forEach((item) => {
      const key = `${item.text.toLowerCase()}-${item.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    setSuggestions(unique.slice(0, 6));
  }, [searchQuery, allListings]);

  const handleSuggestionClick = (value) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
    setShowSuggestions(false);
    navigate('/listings');
  };

  // Close suggestions on outside clicks
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-container-box')) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={i} className="text-brand-rose font-black">{part}</strong>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    const res = await logout();
    if (res.success) {
      toast.success(res.message);
      navigate('/listings');
    } else {
      toast.error(res.error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    navigate('/listings');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    const closeDropdown = () => setDropdownOpen(false);
    if (dropdownOpen) {
      window.addEventListener('click', closeDropdown);
    }
    return () => window.removeEventListener('click', closeDropdown);
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link to="/listings" className="flex items-center gap-2 text-brand-rose transition-transform hover:scale-105 duration-200">
            <Compass className="h-9 w-9 stroke-[2.2]" />
            <span className="hidden text-xl font-bold tracking-tight text-brand-rose sm:block">
              TravelNest
            </span>
          </Link>
        </div>

        {/* Center Search Pill */}
        <div className="flex-1 max-w-md mx-4 md:mx-8 search-container-box relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-24 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-brand-rose focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-rose/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleFocus}
            />
            <div className="absolute left-4 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </div>

            {/* Voice Search Button */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`absolute right-17 p-1 rounded-full text-slate-450 hover:text-brand-rose cursor-pointer border-none bg-transparent ${isListening ? 'text-brand-rose animate-bounce' : ''}`}
              title="Search by Voice"
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* Image Search Button */}
            <button
              type="button"
              onClick={() => setShowImageSearch(true)}
              className="absolute right-11 p-1 rounded-full text-slate-455 hover:text-brand-rose cursor-pointer border-none bg-transparent"
              title="Search by Image"
            >
              <Camera className="h-4 w-4" />
            </button>

            <button
              type="submit"
              className="absolute right-2.5 rounded-full bg-brand-rose p-1.5 text-white transition-colors hover:bg-brand-rose/90 focus:outline-none focus:ring-2 focus:ring-brand-rose/20"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Autocomplete suggestion dropdown overlay list */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-12 left-0 right-0 z-50 rounded-2xl border border-slate-100 bg-white p-2 shadow-lg animate-in fade-in duration-150 flex flex-col gap-0.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(s.text)}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer border-none bg-transparent"
                >
                  <span>{highlightMatch(s.text, searchQuery)}</span>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-slate-50 border border-slate-100/50 px-2 py-0.5 rounded-full tracking-wider">
                    {s.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {currUser && (
            <div className="relative search-container-box" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full p-2 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer border-none bg-transparent"
              >
                <Bell className="h-5 w-5 text-slate-500 hover:text-slate-800 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-brand-rose text-[8px] font-black text-white flex items-center justify-center animate-pulse leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Mini Dropdown notifications card */}
              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-72 origin-top-right rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recent Alerts</span>
                    <Link to="/notifications" onClick={() => setShowNotifications(false)} className="text-[9px] font-bold text-brand-rose hover:underline uppercase tracking-wider text-decoration-none">
                      All history
                    </Link>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                      {notifications.slice(0, 4).map((n) => (
                        <div key={n._id} className="flex flex-col gap-0.5 border-b border-slate-50/50 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] font-extrabold truncate ${n.isRead ? 'text-slate-400' : 'text-slate-800'}`}>{n.title}</span>
                            {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-brand-rose flex-shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 leading-normal truncate">{n.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">No alerts yet</div>
                  )}
                </div>
              )}
            </div>
          )}

          <Link
            to="/listings/new"
            className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:flex"
          >
            <Plus className="h-4 w-4" />
            <span>{t('nestYourHome')}</span>
          </Link>

          {/* Language Switcher Dropdown */}
          <div className="relative flex items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-full border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 focus:outline-none cursor-pointer flex items-center gap-1 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200 outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full p-2.5 border border-slate-200 bg-white hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center text-slate-500"
            title="Toggle Light/Dark Mode"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> : <Moon className="h-4.5 w-4.5 text-slate-400" />}
          </button>

          {/* User Menu Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white p-2.5 transition-shadow hover:shadow-sm focus:outline-none"
            >
              <Menu className="h-4.5 w-4.5 text-slate-500" />
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <User className="h-4.5 w-4.5" />
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150">
                {currUser ? (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-50 mb-1">
                      {t('welcomeUser', { username: currUser.username })}
                    </div>
                    <Link
                      to="/listings/new"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('nestYourHome')}</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Heart className="h-4 w-4 text-slate-500" />
                      <span>{t('myWishlist')}</span>
                    </Link>
                    <Link
                      to="/bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>{t('myBookings')}</span>
                    </Link>
                    <Link
                      to="/payments"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span>{t('paymentHistory')}</span>
                    </Link>
                    <Link
                      to="/host/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span>{t('hostDashboard')}</span>
                    </Link>
                    {currUser && currUser.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        <ShieldAlert className="h-4.5 w-4.5 text-brand-rose" />
                        <span>{t('adminDashboard')}</span>
                      </Link>
                    )}
                    <Link
                      to="/chat"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      <span>{t('myChats')}</span>
                    </Link>
                    <a
                      href="#"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('logout')}</span>
                    </a>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      <UserPlus className="h-4 w-4 text-slate-500" />
                      <span>{t('signup')}</span>
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <LogIn className="h-4 w-4 text-slate-500" />
                      <span>{t('login')}</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      {showImageSearch && (
        <ImageSearchModal onClose={() => setShowImageSearch(false)} />
      )}
    </header>
  );
};
export default Navbar;

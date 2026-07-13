import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sun, Cloud, CloudRain, Wind, Droplets, Sunrise, Sunset, Loader2, Calendar } from 'lucide-react';

export const ListingWeatherCard = ({ lat, lng }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      const res = await axios.get(`/api/services/weather/${lat}/${lng}`);
      if (res.data && res.data.success) {
        setWeather(res.data);
      }
    } catch (err) {
      console.error("Failed to load weather report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lat && lng) {
      fetchWeather();
    }
  }, [lat, lng]);

  const getWeatherIcon = (cond) => {
    const c = cond?.toLowerCase() || '';
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="h-6 w-6 text-blue-500 animate-bounce" />;
    if (c.includes('cloud') || c.includes('mist') || c.includes('fog')) return <Cloud className="h-6 w-6 text-slate-400 animate-pulse" />;
    return <Sun className="h-6 w-6 text-amber-500 animate-spin-slow" />;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-brand-rose" />
        <span className="text-xs font-bold text-slate-400 ml-2">Loading coordinates forecast...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Current weather overview */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/50">
            {getWeatherIcon(weather.condition)}
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm m-0 leading-none">Live Weather</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5 leading-none">
              {weather.condition} • {weather.description}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900 leading-none">{weather.temp}°C</span>
          <span className="text-[10px] text-slate-400 font-bold block mt-1 leading-none">Feels like {weather.feelsLike}°C</span>
        </div>
      </div>

      {/* Core statistics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Wind Speed', val: `${weather.windSpeed} km/h`, icon: Wind, color: 'text-indigo-500 bg-indigo-50' },
          { label: 'Humidity', val: `${weather.humidity}%`, icon: Droplets, color: 'text-blue-500 bg-blue-50' },
          { label: 'Sunrise', val: weather.sunrise, icon: Sunrise, color: 'text-amber-500 bg-amber-50' },
          { label: 'Sunset', val: weather.sunset, icon: Sunset, color: 'text-rose-500 bg-rose-50' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-50 bg-slate-50/20 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className={`p-1 rounded-lg ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <span className="text-xs font-black text-slate-800 leading-none">{item.val}</span>
            </div>
          );
        })}
      </div>

      {/* 5-Day Forecast sliders */}
      <div className="border-t border-slate-50 pt-4.5">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mb-3.5">5-Day Forecast</h5>
        <div className="flex justify-between gap-2.5">
          {weather.forecast.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-50/50 hover:border-slate-100 bg-white transition-all text-center">
              <span className="text-[10px] font-bold text-slate-500">{day.day}</span>
              <div className="my-0.5">{getWeatherIcon(day.condition)}</div>
              <span className="text-[10px] font-black text-slate-800 font-mono">{day.temp}°C</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best time to visit insights */}
      {weather.bestTimeToVisit && (
        <div className="border-t border-slate-50 pt-4 flex items-center gap-2 text-xs font-bold text-brand-rose bg-rose-50/30 px-3 py-2.5 rounded-xl border border-rose-100/50">
          <Calendar className="h-4 w-4" />
          <span>Best season to visit: <strong className="font-extrabold">{weather.bestTimeToVisit}</strong></span>
        </div>
      )}

    </div>
  );
};

export default ListingWeatherCard;

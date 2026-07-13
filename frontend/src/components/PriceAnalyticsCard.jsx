import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, TrendingUp, DollarSign, Percent, BarChart3, Info } from 'lucide-react';

export const PriceAnalyticsCard = ({ listingId, currentPrice }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(null); // { month, price, x, y }

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`/api/analytics/listing/${listingId}`);
      if (res.data && res.data.success) {
        setAnalytics(res.data);
        // Default active node to current month (e.g. July)
        const trends = res.data.monthlyTrends || [];
        const currentMonthIdx = new Date().getMonth();
        if (trends[currentMonthIdx]) {
          setActiveNode(trends[currentMonthIdx]);
        }
      }
    } catch (err) {
      console.error("Failed to load price analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchAnalytics();
    }
  }, [listingId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-center py-10 dark:bg-slate-900 dark:border-slate-800">
        <Loader2 className="h-5 w-5 animate-spin text-brand-rose" />
        <span className="text-xs font-bold text-slate-400 ml-2">Loading price index analysis...</span>
      </div>
    );
  }

  if (!analytics) return null;

  const { stats, monthlyTrends, comparisonListingsCount } = analytics;

  // SVG Chart Layout Calculation Constants
  const width = 500;
  const height = 180;
  const padding = 30;

  // Find min/max in trend prices to scale height
  const trendPrices = monthlyTrends.map(t => t.price);
  const maxTrendPrice = Math.max(...trendPrices) || 10000;
  const minTrendPrice = Math.min(...trendPrices) || 1000;
  const priceRange = maxTrendPrice - minTrendPrice || 1;

  // Compute (x, y) coordinates for all points
  const points = monthlyTrends.map((t, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (monthlyTrends.length - 1);
    // Scale y coordinates inversely (0 is top of SVG)
    const y = height - padding - ((t.price - minTrendPrice) * (height - 2 * padding)) / priceRange;
    return { ...t, x, y, idx };
  });

  // Construct SVG Path line string
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-6 dark:bg-slate-900 dark:border-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-slate-50 dark:border-slate-800 pb-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-brand-rose border border-rose-100/50 dark:border-rose-900/30">
          <TrendingUp className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm m-0 leading-none">Price Smart Analytics</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5 leading-none">
            Market pricing compared to {comparisonListingsCount || 'nearby'} listings in the area
          </span>
        </div>
      </div>

      {/* Core Statistic Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Area Average Price', val: `₹${stats.avgPrice.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
          { label: 'Lowest Price', val: `₹${stats.minPrice.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { label: 'Estimated Savings', val: stats.estimatedSavings > 0 ? `₹${stats.estimatedSavings.toLocaleString('en-IN')}` : 'Best Value Stay', icon: Percent, color: 'text-brand-rose bg-rose-50 dark:bg-rose-950/20' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-4 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/50 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{item.label}</span>
                <div className={`p-1 rounded-lg ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">{item.val}</span>
            </div>
          );
        })}
      </div>

      {/* Interactive Trend Chart visualizer */}
      <div className="border-t border-slate-50 dark:border-slate-800 pt-4.5">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5 m-0">12-Month Price Trend Index</h5>
          {activeNode && (
            <div className="text-[10px] font-black text-brand-rose bg-rose-50 dark:bg-rose-950/30 border border-rose-100/50 dark:border-rose-900/30 px-3 py-1 rounded-full">
              {activeNode.month}: <strong className="font-extrabold text-xs">₹{activeNode.price.toLocaleString('en-IN')}</strong> / night
            </div>
          )}
        </div>

        {/* Scalable SVG visualizer chart */}
        <div className="w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-2xl border border-slate-100/40 dark:border-slate-800/40 p-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
            {/* Draw grid background horizontal lines */}
            {[0, 0.5, 1].map((ratio, index) => {
              const y = padding + ratio * (height - 2 * padding);
              return (
                <line
                  key={index}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  className="stroke-slate-200 dark:stroke-slate-800"
                />
              );
            })}

            {/* Price Line path */}
            <path
              d={linePath}
              fill="none"
              stroke="#fe424d"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Interactive Circles / Hover targets */}
            {points.map((p, idx) => (
              <g key={idx}>
                {/* Visual Circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={activeNode?.month === p.month ? 5.5 : 3.5}
                  className={`transition-all cursor-pointer ${
                    activeNode?.month === p.month 
                      ? 'fill-brand-rose stroke-white stroke-[2]' 
                      : 'fill-slate-400 dark:fill-slate-600 hover:fill-brand-rose'
                  }`}
                  onMouseEnter={() => setActiveNode(p)}
                />
                {/* Large transparent hover target area */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={18}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveNode(p)}
                />
              </g>
            ))}

            {/* Month grid labels */}
            {points.filter((_, idx) => idx % 2 === 0).map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="text-[9px] font-bold fill-slate-400 font-sans"
              >
                {p.month}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Suggested Budget Ranges & Market Insight */}
      <div className="border-t border-slate-50 dark:border-slate-800 pt-4 flex gap-2.5 items-start">
        <Info className="h-4.5 w-4.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 leading-normal dark:text-slate-400">
          <span>
            The suggested budget range for a premium property in this area is 
            <strong className="text-slate-800 dark:text-slate-200"> ₹{stats.suggestedBudgetRange.min.toLocaleString('en-IN')} - ₹{stats.suggestedBudgetRange.max.toLocaleString('en-IN')}</strong> per night.
          </span>
          {stats.estimatedSavings > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-500 font-bold">
              🎉 Booking this stay saves you approximately {stats.percentSavings}% compared to area alternatives!
            </span>
          ) : (
            <span className="text-slate-400">
              This property's price matches the premium segment, offering upscale amenities for the selected location.
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default PriceAnalyticsCard;

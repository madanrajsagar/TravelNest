import React, { useState } from 'react';
import { Star } from 'lucide-react';

const ratingLabels = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent'
};

export const RatingInput = ({ value, onChange }) => {
  const [hoverValue, setHoverValue] = useState(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex flex-col gap-2.5 pl-0.5">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className="p-1 focus:outline-none transition-transform duration-150 hover:scale-115 active:scale-95 cursor-pointer"
          >
            <Star
              className={`h-6 w-6 transition-all duration-150 ${
                star <= activeValue
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 hover:text-amber-300'
              }`}
            />
          </button>
        ))}

        {/* Rating text descriptor label */}
        {activeValue > 0 && (
          <span className="ml-2.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-bold text-slate-600 animate-in fade-in duration-200">
            {ratingLabels[activeValue]}
          </span>
        )}
      </div>
    </div>
  );
};

export default RatingInput;

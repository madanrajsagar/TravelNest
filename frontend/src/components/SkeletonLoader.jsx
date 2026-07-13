import React from 'react';

export const SkeletonLoader = ({ count = 4, type = 'card' }) => {
  if (type === 'details') {
    return (
      <div className="w-full flex flex-col gap-6 animate-pulse p-4">
        {/* Gallery shimmer */}
        <div className="h-[320px] sm:h-[480px] w-full rounded-2xl bg-slate-200" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="h-6 w-1/3 rounded-lg bg-slate-200" />
            <div className="h-10 w-2/3 rounded-lg bg-slate-200" />
            <div className="h-20 w-full rounded-2xl bg-slate-200" />
            <div className="h-40 w-full rounded-2xl bg-slate-200" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-[380px] w-full rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'analytics') {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col gap-4 animate-pulse dark:bg-slate-900 dark:border-slate-800">
        <div className="flex justify-between items-center pb-2">
          <div className="h-5 w-1/3 rounded-lg bg-slate-200" />
          <div className="h-5 w-8 rounded-full bg-slate-200" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 rounded-xl bg-slate-200" />
          <div className="h-16 rounded-xl bg-slate-200" />
          <div className="h-16 rounded-xl bg-slate-200" />
        </div>
        <div className="h-40 rounded-xl bg-slate-200" />
      </div>
    );
  }

  // Default listing cards grid
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] animate-pulse">
          {/* Shimmer Image */}
          <div className="aspect-square w-full rounded-xl bg-slate-200" />
          
          {/* Shimmer text details */}
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-3/5 rounded-md bg-slate-200" />
              <div className="h-4 w-8 rounded-md bg-slate-200" />
            </div>
            <div className="h-3 w-2/5 rounded-md bg-slate-200/80" />
            <div className="h-3 w-1/3 rounded-md bg-slate-200/70" />
            <div className="h-4 w-1/4 rounded-md bg-slate-200 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;

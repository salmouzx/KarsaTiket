'use client';

import React from 'react';

interface LoadingStateProps {
  count?: number;
  type?: 'card' | 'table' | 'detail';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  count = 3,
  type = 'card',
}) => {
  if (type === 'table') {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="p-4 border-b border-slate-100 last:border-none flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/4"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-3.5"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-200 rounded-md w-3/5"></div>
              <div className="h-3.5 bg-slate-100 rounded w-2/5"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          </div>
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <div className="h-4 bg-slate-100 rounded w-28"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-slate-100 rounded-lg w-16"></div>
              <div className="h-8 bg-slate-100 rounded-lg w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

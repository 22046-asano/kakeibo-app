'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthSelectorProps {
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  onResetToday: () => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentDate,
  onChangeMonth,
  onResetToday,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const isCurrentMonth = () => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() + 1 === month;
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200/80 mb-6">
      <button
        onClick={() => onChangeMonth(-1)}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        aria-label="先月へ"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-base font-bold text-slate-800">
          {year}年 {month}月
        </span>
        {!isCurrentMonth() && (
          <button
            onClick={onResetToday}
            className="ml-2 px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            今月
          </button>
        )}
      </div>

      <button
        onClick={() => onChangeMonth(1)}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        aria-label="翌月へ"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

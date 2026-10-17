'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const lastDay = new Date(year, month, 0).getDate();
  const periodStr = `${month}月1日〜${month}月${lastDay}日`;

  return (
    <div className="bg-white rounded-2xl px-3 py-2.5 shadow-sm border border-slate-200/80 mb-3 flex items-center justify-between">
      <button
        onClick={() => onChangeMonth(-1)}
        className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        aria-label="前月"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="text-center flex items-baseline gap-1.5">
          <span className="text-base sm:text-lg font-extrabold text-slate-800 tabular-nums">
            {year}年{month}月
          </span>
          <span className="text-xs text-slate-400 font-medium tabular-nums">
            ({periodStr})
          </span>
        </div>

        {!isCurrentMonth() && (
          <button
            onClick={onResetToday}
            className="px-2 py-0.5 text-[11px] font-extrabold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200/60 transition-colors"
          >
            今月
          </button>
        )}
      </div>

      <button
        onClick={() => onChangeMonth(1)}
        className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        aria-label="翌月"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';

interface MonthSelectorProps {
  currentDate: Date;
  onChangeMonth: (offset: number) => void;
  onResetToday: () => void;
  viewMode?: 'list' | 'calendar';
  onChangeViewMode?: (mode: 'list' | 'calendar') => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentDate,
  onChangeMonth,
  onResetToday,
  viewMode,
  onChangeViewMode,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const isCurrentMonth = () => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() + 1 === month;
  };

  // 月初〜月末の表示文字列
  const lastDay = new Date(year, month, 0).getDate();
  const periodStr = `${month}/1 〜 ${month}/${lastDay}`;

  return (
    <div className="bg-white rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] border border-slate-200/80 mb-4 flex flex-wrap items-center justify-between gap-2">
      {/* 月切り替えコントロール */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onChangeMonth(-1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="前月"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-baseline gap-2 px-1">
          <span className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
            {year}年{month}月
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline tabular-nums">
            ({periodStr})
          </span>
        </div>

        <button
          onClick={() => onChangeMonth(1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="翌月"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {!isCurrentMonth() && (
          <button
            onClick={onResetToday}
            className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            今月へ戻る
          </button>
        )}
      </div>

      {/* リスト / カレンダー表示切替（統合コントロール） */}
      {viewMode && onChangeViewMode && (
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => onChangeViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>明細・グラフ</span>
          </button>
          <button
            onClick={() => onChangeViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>カレンダー</span>
          </button>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useRef } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
} from 'lucide-react';
import { Transaction, CreditCard } from '@/types';

interface CalendarViewProps {
  currentDate: Date;
  transactions: Transaction[];
  cards: CreditCard[];
  selectedDayStr: string | null;
  onSelectDay: (dateStr: string | null) => void;
  onAddTransactionForDate?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  transactions,
  cards,
  selectedDayStr,
  onSelectDay,
  onAddTransactionForDate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastTapRef = useRef<{ dateStr: string; time: number }>({ dateStr: '', time: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // 前月余白
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const y = prevMonthDate.getFullYear();
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(prevMonthDate.getDate()).padStart(2, '0');
    days.push({ dateStr: `${y}-${m}-${dayStr}`, dayNum: d, isCurrentMonth: false });
  }

  // 当月
  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dateStr: dStr, dayNum: d, isCurrentMonth: true });
  }

  // 翌月余白
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const y = nextMonthDate.getFullYear();
    const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(nextMonthDate.getDate()).padStart(2, '0');
    days.push({ dateStr: `${y}-${m}-${dayStr}`, dayNum: d, isCurrentMonth: false });
  }

  // 日別サマリー集計（調整金は日々の通常支出・収入表示から除外）
  const daySummaryMap = transactions.reduce<
    Record<
      string,
      {
        expense: number;
        income: number;
        hasAdjustment: boolean;
        billings: { cardName: string; amount: number; color: string }[];
      }
    >
  >((acc, t) => {
    if (!acc[t.date]) {
      acc[t.date] = { expense: 0, income: 0, hasAdjustment: false, billings: [] };
    }
    if (t.category === '調整金') {
      acc[t.date].hasAdjustment = true;
    } else if (t.type === 'expense') {
      acc[t.date].expense += t.amount;
    } else if (t.type === 'income') {
      acc[t.date].income += t.amount;
    }

    if (t.billing_date && t.category !== '調整金') {
      if (!acc[t.billing_date]) {
        acc[t.billing_date] = { expense: 0, income: 0, hasAdjustment: false, billings: [] };
      }
      const card = cards.find((c) => c.id === t.credit_card_id);
      const cardName = card ? card.name : 'カード引落';
      const cardColor = card?.color || '#2563eb';
      const existing = acc[t.billing_date].billings.find((b) => b.cardName === cardName);
      if (existing) {
        existing.amount += t.amount;
      } else {
        acc[t.billing_date].billings.push({ cardName, amount: t.amount, color: cardColor });
      }
    }

    return acc;
  }, {});

  // シングルクリックで日付選択、ダブルクリック（または素早い2回タップ）でその日の収支入力モーダルを起動
  const handleCellClick = (dateStr: string) => {
    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.dateStr === dateStr && now - lastTapRef.current.time < 350;
    lastTapRef.current = { dateStr, time: now };

    if (isDoubleTap) {
      onSelectDay(dateStr);
      if (onAddTransactionForDate) {
        onAddTransactionForDate(dateStr);
      }
    } else {
      onSelectDay(selectedDayStr === dateStr ? null : dateStr);
    }
  };

  const handleCellDoubleClick = (dateStr: string) => {
    onSelectDay(dateStr);
    if (onAddTransactionForDate) {
      onAddTransactionForDate(dateStr);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-4 select-none">
      {/* 曜日ヘッダー（シンプル家計簿スタイル） */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-orange-50/40 text-center text-[11px] font-extrabold py-2">
        <span className="text-rose-500">日</span>
        <span className="text-slate-600">月</span>
        <span className="text-slate-600">火</span>
        <span className="text-slate-600">水</span>
        <span className="text-slate-600">木</span>
        <span className="text-slate-600">金</span>
        <span className="text-sky-600">土</span>
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/70">
        {days.map(({ dateStr, dayNum, isCurrentMonth }, idx) => {
          const summary = daySummaryMap[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDayStr;

          return (
            <div
              key={dateStr + idx}
              onClick={() => handleCellClick(dateStr)}
              onDoubleClick={() => handleCellDoubleClick(dateStr)}
              title="クリックで明細選択 / ダブルクリックでこの日に記帳"
              className={`min-h-[68px] sm:min-h-[82px] p-1 sm:p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                !isCurrentMonth ? 'bg-slate-50/60 opacity-40' : 'bg-white hover:bg-orange-50/30'
              } ${
                isSelected
                  ? 'ring-2 ring-inset ring-orange-500 bg-orange-50/40 z-10'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] sm:text-xs font-extrabold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full tabular-nums ${
                    isToday
                      ? 'bg-orange-500 text-white shadow-sm'
                      : idx % 7 === 0
                      ? 'text-rose-500'
                      : idx % 7 === 6
                      ? 'text-sky-600'
                      : 'text-slate-700'
                  }`}
                >
                  {dayNum}
                </span>
                {summary?.hasAdjustment && (
                  <span className="text-[8px] px-1 rounded bg-slate-200 text-slate-600 font-bold">
                    調整
                  </span>
                )}
              </div>

              {/* 収支・カード引落表示 */}
              <div className="space-y-0.5 mt-0.5 overflow-hidden tabular-nums">
                {summary?.billings && summary.billings.length > 0 && (
                  <div className="space-y-0.5">
                    {summary.billings.map((b, i) => (
                      <div
                        key={i}
                        className="text-white text-[8px] sm:text-[9px] font-bold px-1 py-0.2 rounded truncate flex items-center gap-0.5"
                        style={{ backgroundColor: b.color }}
                        title={`${b.cardName} 引落: ¥${b.amount.toLocaleString()}`}
                      >
                        <CardIcon className="w-2 h-2 shrink-0" />
                        <span className="truncate">{b.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {summary && summary.income > 0 && (
                  <p className="text-[9px] sm:text-[10px] font-extrabold text-sky-600 truncate text-right leading-tight">
                    +{summary.income.toLocaleString()}
                  </p>
                )}

                {summary && summary.expense > 0 && (
                  <p className="text-[9px] sm:text-[10px] font-extrabold text-rose-500 truncate text-right leading-tight">
                    -{summary.expense.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 日付選択時アクションバー */}
      <div className="px-4 py-2.5 bg-orange-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
        {selectedDayStr ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-orange-900 tabular-nums">
                {selectedDayStr.replace(/-/g, '/')} を選択中
              </span>
              <button
                onClick={() => onSelectDay(null)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
              >
                月間全表示に戻す
              </button>
            </div>
            {onAddTransactionForDate && (
              <button
                onClick={() => onAddTransactionForDate(selectedDayStr)}
                className="flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>この日に記帳</span>
              </button>
            )}
          </>
        ) : (
          <span className="text-[11px] text-slate-500 font-medium">
            💡 日付を<strong>ダブルクリック（スマホは2回連続タップ）</strong>すると、その日の収支入力画面が直接開きます
          </span>
        )}
      </div>
    </div>
  );
};

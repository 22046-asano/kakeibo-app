'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, CreditCard as CardIcon } from 'lucide-react';
import { Transaction, CreditCard } from '@/types';

interface CalendarViewProps {
  currentDate: Date;
  transactions: Transaction[];
  cards: CreditCard[];
  onChangeMonth: (offset: number) => void;
  onResetToday: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  transactions,
  cards,
  onChangeMonth,
  onResetToday,
  onSelectTransaction,
}) => {
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const dateStr = prevMonthDate.toISOString().split('T')[0];
    days.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dateStr: dStr, dayNum: d, isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const dateStr = nextMonthDate.toISOString().split('T')[0];
    days.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const daySummaryMap = transactions.reduce<
    Record<string, { expense: number; income: number; billings: { cardName: string; amount: number }[] }>
  >((acc, t) => {
    if (!acc[t.date]) {
      acc[t.date] = { expense: 0, income: 0, billings: [] };
    }
    if (t.type === 'expense') {
      acc[t.date].expense += t.amount;
    } else if (t.type === 'income') {
      acc[t.date].income += t.amount;
    }

    if (t.billing_date) {
      if (!acc[t.billing_date]) {
        acc[t.billing_date] = { expense: 0, income: 0, billings: [] };
      }
      const card = cards.find((c) => c.id === t.credit_card_id);
      const cardName = card ? card.name : 'カード引落';
      const existing = acc[t.billing_date].billings.find((b) => b.cardName === cardName);
      if (existing) {
        existing.amount += t.amount;
      } else {
        acc[t.billing_date].billings.push({ cardName, amount: t.amount });
      }
    }

    return acc;
  }, {});

  const selectedDayTransactions = selectedDayStr
    ? transactions.filter((t) => t.date === selectedDayStr || t.billing_date === selectedDayStr)
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
        <button
          onClick={() => onChangeMonth(-1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CalIcon className="w-5 h-5 text-blue-600" />
          <span className="text-base sm:text-lg font-bold text-slate-800">
            {year}年 {month + 1}月
          </span>
          <button
            onClick={onResetToday}
            className="ml-2 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            今月
          </button>
        </div>

        <button
          onClick={() => onChangeMonth(1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold py-2">
          <span className="text-rose-500">日</span>
          <span className="text-slate-700">月</span>
          <span className="text-slate-700">火</span>
          <span className="text-slate-700">水</span>
          <span className="text-slate-700">木</span>
          <span className="text-slate-700">金</span>
          <span className="text-sky-500">土</span>
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {days.map(({ dateStr, dayNum, isCurrentMonth }, idx) => {
            const summary = daySummaryMap[dateStr];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDayStr;

            return (
              <div
                key={dateStr + idx}
                onClick={() => setSelectedDayStr(dateStr)}
                className={`min-h-[72px] sm:min-h-[90px] p-1.5 transition-colors cursor-pointer flex flex-col justify-between ${
                  !isCurrentMonth ? 'bg-slate-50/50 opacity-40' : 'bg-white hover:bg-blue-50/30'
                } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/40 z-10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : idx % 7 === 0
                        ? 'text-rose-500'
                        : idx % 7 === 6
                        ? 'text-sky-500'
                        : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                <div className="space-y-0.5 mt-1 overflow-hidden">
                  {summary?.billings && summary.billings.length > 0 && (
                    <div className="space-y-0.5">
                      {summary.billings.map((b, i) => (
                        <div
                          key={i}
                          className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded truncate flex items-center gap-0.5"
                          title={`${b.cardName} 引落: ¥${b.amount.toLocaleString()}`}
                        >
                          <CardIcon className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">¥{b.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {summary && summary.expense > 0 && (
                    <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 truncate text-right">
                      -¥{summary.expense.toLocaleString()}
                    </p>
                  )}

                  {summary && summary.income > 0 && (
                    <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 truncate text-right">
                      +¥{summary.income.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDayStr && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">
              {selectedDayStr} の明細
            </h3>
            <button
              onClick={() => setSelectedDayStr(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              閉じる
            </button>
          </div>

          {selectedDayTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              この日の収支・引き落とし予定はありません
            </p>
          ) : (
            <div className="divide-y divide-slate-100 pt-2">
              {selectedDayTransactions.map((t) => {
                const isBilling = t.billing_date === selectedDayStr;
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTransaction(t)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{t.category}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {t.payment_method}
                        </span>
                        {isBilling && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                            引き落とし日
                          </span>
                        )}
                      </div>
                      {t.memo && <p className="text-[11px] text-slate-400 mt-0.5">{t.memo}</p>}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        t.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

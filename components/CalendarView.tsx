'use client';

import React, { useState } from 'react';
import {
  Calendar as CalIcon,
  CreditCard as CardIcon,
  Edit2,
  Trash2,
  Plus,
  Building2,
} from 'lucide-react';
import { Transaction, CreditCard } from '@/types';

interface CalendarViewProps {
  currentDate: Date;
  transactions: Transaction[];
  cards: CreditCard[];
  onChangeMonth: (offset: number) => void;
  onResetToday: () => void;
  onSelectTransaction: (t: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddTransactionForDate?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  transactions,
  cards,
  onSelectTransaction,
  onDeleteTransaction,
  onAddTransactionForDate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

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

  // 日別サマリー集計
  const daySummaryMap = transactions.reduce<
    Record<
      string,
      {
        expense: number;
        income: number;
        billings: { cardName: string; amount: number; color: string }[];
      }
    >
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

  const selectedDayTransactions = selectedDayStr
    ? transactions.filter((t) => t.date === selectedDayStr || t.billing_date === selectedDayStr)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 左：月間カレンダーグリッド */}
      <div className="lg:col-span-7 bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80 overflow-hidden">
        {/* 凡例バー */}
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="font-bold text-slate-700">日付をタップして明細の確認・追加・編集</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              利用日支出
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              収入
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              カード引落日
            </span>
          </div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-white text-center text-[11px] font-extrabold py-2">
          <span className="text-rose-500">日</span>
          <span className="text-slate-600">月</span>
          <span className="text-slate-600">火</span>
          <span className="text-slate-600">水</span>
          <span className="text-slate-600">木</span>
          <span className="text-slate-600">金</span>
          <span className="text-sky-600">土</span>
        </div>

        {/* 日付セル */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {days.map(({ dateStr, dayNum, isCurrentMonth }, idx) => {
            const summary = daySummaryMap[dateStr];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDayStr;

            return (
              <div
                key={dateStr + idx}
                onClick={() => setSelectedDayStr(dateStr)}
                className={`min-h-[76px] sm:min-h-[92px] p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                  !isCurrentMonth ? 'bg-slate-50/50 opacity-40' : 'bg-white hover:bg-indigo-50/30'
                } ${
                  isSelected
                    ? 'ring-2 ring-inset ring-indigo-600 bg-indigo-50/30 z-10'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full tabular-nums ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : idx % 7 === 0
                        ? 'text-rose-500'
                        : idx % 7 === 6
                        ? 'text-sky-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                <div className="space-y-0.5 mt-1 overflow-hidden tabular-nums">
                  {summary?.billings && summary.billings.length > 0 && (
                    <div className="space-y-0.5">
                      {summary.billings.map((b, i) => (
                        <div
                          key={i}
                          className="text-white text-[9px] font-bold px-1 py-0.5 rounded truncate flex items-center gap-0.5"
                          style={{ backgroundColor: b.color }}
                          title={`${b.cardName} 引落: ¥${b.amount.toLocaleString()}`}
                        >
                          <CardIcon className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">¥{b.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {summary && summary.income > 0 && (
                    <p className="text-[10px] font-extrabold text-emerald-600 truncate text-right">
                      +{summary.income.toLocaleString()}
                    </p>
                  )}

                  {summary && summary.expense > 0 && (
                    <p className="text-[10px] font-extrabold text-rose-600 truncate text-right">
                      -{summary.expense.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右：選択した日付の明細・操作パネル */}
      <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900 tabular-nums">
              {selectedDayStr.replace(/-/g, '/')} の明細
            </h3>
          </div>

          {onAddTransactionForDate && (
            <button
              onClick={() => onAddTransactionForDate(selectedDayStr)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>この日に記帳</span>
            </button>
          )}
        </div>

        {selectedDayTransactions.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <p className="text-xs font-medium text-slate-500">
              この日の収支・引き落とし予定はありません
            </p>
            {onAddTransactionForDate && (
              <button
                onClick={() => onAddTransactionForDate(selectedDayStr)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{selectedDayStr} の収支を追加する</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 pt-2">
            {selectedDayTransactions.map((t) => {
              const isBilling = t.billing_date === selectedDayStr && t.date !== selectedDayStr;
              const card = cards.find((c) => c.id === t.credit_card_id);

              return (
                <div
                  key={t.id + (isBilling ? '-billing' : '-usage')}
                  onClick={() => onSelectTransaction(t)}
                  className="py-3 flex items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900">{t.category}</span>
                      {t.employer_name && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5" />
                          {t.employer_name}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {card ? card.name : t.payment_method}
                      </span>
                      {isBilling && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                          口座引落日 (利用: {t.date.slice(5)})
                        </span>
                      )}
                    </div>
                    {t.memo && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t.memo}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-extrabold tabular-nums ${
                        isBilling
                          ? 'text-blue-600'
                          : t.type === 'expense'
                          ? 'text-slate-900'
                          : 'text-emerald-600'
                      }`}
                    >
                      {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                    </span>

                    <div
                      className="flex items-center gap-1 border-l border-slate-100 pl-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelectTransaction(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteTransaction && (
                        <button
                          onClick={() => {
                            if (confirm('この明細を削除してもよろしいですか？')) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

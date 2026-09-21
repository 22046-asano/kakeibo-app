'use client';

import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react';
import { Transaction } from '@/types';

interface SummaryCardsProps {
  transactions: Transaction[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ transactions }) => {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = income - expense;

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
      {/* 支出 */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-rose-600 mb-1">
          <ArrowDownCircle className="w-4 h-4" />
          <span className="text-xs font-medium text-slate-500">今月の支出</span>
        </div>
        <p className="text-sm sm:text-xl font-bold text-slate-900 truncate">
          ¥{expense.toLocaleString()}
        </p>
      </div>

      {/* 収入 */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
          <ArrowUpCircle className="w-4 h-4" />
          <span className="text-xs font-medium text-slate-500">今月の収入</span>
        </div>
        <p className="text-sm sm:text-xl font-bold text-slate-900 truncate">
          ¥{income.toLocaleString()}
        </p>
      </div>

      {/* 収支残高 */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-blue-600 mb-1">
          <Scale className="w-4 h-4" />
          <span className="text-xs font-medium text-slate-500">収支バランス</span>
        </div>
        <p
          className={`text-sm sm:text-xl font-bold truncate ${
            balance >= 0 ? 'text-blue-600' : 'text-rose-600'
          }`}
        >
          {balance >= 0 ? `+¥${balance.toLocaleString()}` : `-¥${Math.abs(balance).toLocaleString()}`}
        </p>
      </div>
    </div>
  );
};

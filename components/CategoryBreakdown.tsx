'use client';

import React from 'react';
import { PieChart } from 'lucide-react';
import { Transaction } from '@/types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  '大学': 'bg-purple-600',
  '食費': 'bg-amber-500',
  '日用品': 'bg-emerald-500',
  '交通費': 'bg-sky-500',
  '趣味・娯楽': 'bg-violet-500',
  '水道・光熱費': 'bg-yellow-500',
  '通信費': 'bg-blue-500',
  '住居費': 'bg-indigo-500',
  '医療・健康': 'bg-rose-500',
  '衣服・美容': 'bg-pink-500',
  'その他': 'bg-slate-400',
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ transactions }) => {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = expenseTransactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-4 h-4 text-slate-700" />
        <h2 className="text-sm font-bold text-slate-800">カテゴリ別支出内訳</h2>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">
          今月の支出データはまだありません
        </p>
      ) : (
        <div className="space-y-3">
          {sortedCategories.map(({ category, amount, percentage }) => {
            const colorClass = CATEGORY_COLORS[category] || 'bg-slate-400';
            return (
              <div key={category} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                    <span className="font-medium text-slate-700">
                      {category === '大学' && '🎓 '}
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">¥{amount.toLocaleString()}</span>
                    <span className="text-slate-400 text-[11px] w-10 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

'use client';

import React from 'react';
import { PieChart } from 'lucide-react';
import { Transaction } from '@/types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
}

export const CATEGORY_HEX_COLORS: Record<string, string> = {
  '大学': '#7c3aed',
  'クレカ': '#2563eb',
  '食費': '#f59e0b',
  '日用品': '#10b981',
  '交通費': '#0ea5e9',
  '趣味・娯楽': '#8b5cf6',
  '水道・光熱費': '#eab308',
  '通信費': '#3b82f6',
  '住居費': '#4f46e5',
  '医療・健康': '#f43f5e',
  '衣服・美容': '#ec4899',
  'その他': '#64748b',
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  selectedCategory = null,
  onSelectCategory,
}) => {
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
      color: CATEGORY_HEX_COLORS[category] || '#64748b',
    }))
    .sort((a, b) => b.amount - a.amount);

  // SVGドーナツチャート用のセグメント計算
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">カテゴリ別支出内訳</h2>
        </div>
        {selectedCategory && onSelectCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            絞り込み解除
          </button>
        )}
      </div>

      {sortedCategories.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-xs">今月の支出データはまだありません</p>
        </div>
      ) : (
        <div>
          {/* ドーナツチャート (Zaim / マネーフォワード スタイル) */}
          <div className="relative w-44 h-44 mx-auto my-2 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="16"
              />
              {sortedCategories.map((item) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += item.percentage;

                return (
                  <circle
                    key={item.category}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={selectedCategory === item.category ? '19' : '15'}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 cursor-pointer hover:opacity-85"
                    onClick={() =>
                      onSelectCategory &&
                      onSelectCategory(selectedCategory === item.category ? null : item.category)
                    }
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <span className="text-[10px] font-bold text-slate-400">
                {selectedCategory ? selectedCategory : '支出合計'}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                ¥
                {(selectedCategory
                  ? categoryTotals[selectedCategory] || 0
                  : totalExpense
                ).toLocaleString()}
              </span>
            </div>
          </div>

          {onSelectCategory && (
            <p className="text-[11px] text-center text-slate-400 mb-4">
              カテゴリをタップすると右側の明細を絞り込めます
            </p>
          )}

          {/* カテゴリ別ランキングリスト */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {sortedCategories.map(({ category, amount, percentage, color }) => {
              const isSelected = selectedCategory === category;
              return (
                <div
                  key={category}
                  onClick={() =>
                    onSelectCategory && onSelectCategory(isSelected ? null : category)
                  }
                  className={`p-2 rounded-xl transition-all ${
                    onSelectCategory ? 'cursor-pointer hover:bg-slate-50' : ''
                  } ${isSelected ? 'bg-indigo-50/70 ring-1 ring-indigo-200' : ''}`}
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-slate-800">{category}</span>
                    </div>
                    <div className="flex items-center gap-2.5 tabular-nums">
                      <span className="font-extrabold text-slate-900">
                        ¥{amount.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-[11px] w-11 text-right font-semibold">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

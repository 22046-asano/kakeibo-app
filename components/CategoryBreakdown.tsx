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
  '食費': '#f97316',
  '大学': '#8b5cf6',
  'クレカ': '#2563eb',
  '日用品': '#10b981',
  '交通費': '#0ea5e9',
  '趣味・娯楽': '#ec4899',
  '水道・光熱費': '#eab308',
  '通信費': '#3b82f6',
  '住居費': '#6366f1',
  '医療・健康': '#14b8a6',
  '衣服・美容': '#f43f5e',
  'その他': '#94a3b8',
  '調整金': '#64748b',
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  selectedCategory = null,
  onSelectCategory,
}) => {
  // 調整金は通常の支出グラフから除外する
  const expenseTransactions = transactions.filter(
    (t) => t.type === 'expense' && t.category !== '調整金'
  );
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
      color: CATEGORY_HEX_COLORS[category] || '#94a3b8',
    }))
    .sort((a, b) => b.amount - a.amount);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-extrabold text-slate-800">カテゴリー別支出グラフ</h2>
        </div>
        {selectedCategory && onSelectCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-bold text-orange-600 hover:underline"
          >
            すべて表示に戻す
          </button>
        )}
      </div>

      {sortedCategories.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-xs">この月の支出データはまだありません</p>
        </div>
      ) : (
        <div>
          {/* シンプル家計簿風 円グラフ */}
          <div className="relative w-44 h-44 mx-auto my-2 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#f8fafc"
                strokeWidth="18"
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
                    strokeWidth={selectedCategory === item.category ? '21' : '17'}
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
              <span className="text-sm sm:text-base font-extrabold text-slate-800 tabular-nums mt-0.5">
                ¥
                {(selectedCategory
                  ? categoryTotals[selectedCategory] || 0
                  : totalExpense
                ).toLocaleString()}
              </span>
            </div>
          </div>

          {/* カテゴリ別リスト */}
          <div className="divide-y divide-slate-100 mt-4 border-t border-slate-100">
            {sortedCategories.map(({ category, amount, percentage, color }) => {
              const isSelected = selectedCategory === category;
              return (
                <div
                  key={category}
                  onClick={() =>
                    onSelectCategory && onSelectCategory(isSelected ? null : category)
                  }
                  className={`py-2.5 px-2 transition-all flex items-center justify-between ${
                    onSelectCategory ? 'cursor-pointer hover:bg-orange-50/40' : ''
                  } ${isSelected ? 'bg-orange-50/80 rounded-xl font-bold' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      ¥{amount.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-xs w-12 text-right font-semibold">
                      {percentage.toFixed(1)}%
                    </span>
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

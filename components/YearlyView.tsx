'use client';

import React, { useState } from 'react';
import { Briefcase, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, GraduationCap } from 'lucide-react';
import { Transaction } from '@/types';

interface YearlyViewProps {
  transactions: Transaction[];
}

export const YearlyView: React.FC<YearlyViewProps> = ({ transactions }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const yearTransactions = transactions.filter((t) => t.date.startsWith(`${selectedYear}-`));

  const partTimeTransactions = yearTransactions.filter(
    (t) => t.type === 'income' && t.category === 'バイト代'
  );

  const totalPartTimeIncome = partTimeTransactions.reduce((sum, t) => sum + t.amount, 0);

  const monthlyPartTime = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthStr = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
    const amount = partTimeTransactions
      .filter((t) => t.date.startsWith(monthStr))
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: monthNum, amount };
  });

  const totalYearIncome = yearTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalYearExpense = yearTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalYearBalance = totalYearIncome - totalYearExpense;

  const totalUniversityExpense = yearTransactions
    .filter((t) => t.type === 'expense' && t.category === '大学')
    .reduce((sum, t) => sum + t.amount, 0);

  const LIMIT_103 = 1030000;
  const LIMIT_130 = 1300000;

  const percent103 = Math.min((totalPartTimeIncome / LIMIT_103) * 100, 100);
  const remaining103 = Math.max(LIMIT_103 - totalPartTimeIncome, 0);

  const percent130 = Math.min((totalPartTimeIncome / LIMIT_130) * 100, 100);
  const remaining130 = Math.max(LIMIT_130 - totalPartTimeIncome, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
        <button
          onClick={() => setSelectedYear((y) => y - 1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xl font-bold text-slate-900">{selectedYear}年 年間集計</span>
          <p className="text-xs text-slate-500">バイト代年収シミュレーション &amp; 年間収支</p>
        </div>

        <button
          onClick={() => setSelectedYear((y) => y + 1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/15">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-200" />
            <span className="text-sm font-semibold text-blue-100">年間バイト代 累計収入</span>
          </div>
          <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
            {partTimeTransactions.length} 回の給与
          </span>
        </div>

        <div className="my-3">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ¥{totalPartTimeIncome.toLocaleString()}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-white/15 space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>税制上の扶養ライン（103万円の壁）</span>
              <span>{percent103.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totalPartTimeIncome > LIMIT_103 ? 'bg-rose-400' : 'bg-emerald-300'
                }`}
                style={{ width: `${percent103}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-100 mt-1">
              {totalPartTimeIncome >= LIMIT_103 ? (
                <span className="text-rose-200 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 103万円を超過しています
                </span>
              ) : (
                `103万円まで あと ¥${remaining103.toLocaleString()}`
              )}
            </p>
          </div>

          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>社会保険上の扶養ライン（130万円の壁）</span>
              <span>{percent130.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totalPartTimeIncome > LIMIT_103 ? 'bg-rose-400' : 'bg-amber-300'
                }`}
                style={{ width: `${percent130}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-100 mt-1">
              {totalPartTimeIncome >= LIMIT_130 ? (
                <span className="text-rose-200 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 130万円を超過しています
                </span>
              ) : (
                `130万円まで あと ¥${remaining130.toLocaleString()}`
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-medium text-slate-500 mb-1">年間総収入</p>
          <p className="text-xl font-bold text-emerald-600">¥{totalYearIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-medium text-slate-500 mb-1">年間総支出</p>
          <p className="text-xl font-bold text-slate-900">¥{totalYearExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <p className="text-xs font-medium text-slate-500 mb-1">年間収支差額（貯金額）</p>
          <p
            className={`text-xl font-bold ${
              totalYearBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
            }`}
          >
            {totalYearBalance >= 0 ? '+' : ''}¥{totalYearBalance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">大学関連の年間支出</h3>
            <p className="text-xs text-slate-400">教科書・研究費・サークル・学費など</p>
          </div>
        </div>
        <p className="text-lg font-bold text-slate-900">¥{totalUniversityExpense.toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>{selectedYear}年 各月のバイト代推移</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {monthlyPartTime.map(({ month, amount }) => (
            <div
              key={month}
              className={`p-3 rounded-xl border transition-all ${
                amount > 0
                  ? 'bg-blue-50/40 border-blue-200/80'
                  : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <span className="text-xs font-semibold text-slate-600">{month}月</span>
              <p
                className={`text-sm sm:text-base font-bold mt-0.5 ${
                  amount > 0 ? 'text-blue-700' : 'text-slate-400'
                }`}
              >
                ¥{amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

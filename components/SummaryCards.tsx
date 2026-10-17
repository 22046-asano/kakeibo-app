'use client';

import React from 'react';
import { ArrowDownRight, ArrowUpRight, CreditCard, Wallet } from 'lucide-react';
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

  const cardExpense = transactions
    .filter((t) => t.type === 'expense' && t.payment_method === 'クレジットカード')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const cashOtherExpense = expense - cardExpense;
  const balance = income - expense;

  // 収入に対する支出割合バー
  const spendRatio = income > 0 ? Math.min((expense / income) * 100, 100) : expense > 0 ? 100 : 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80 mb-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* 左：当月収支バランス（メインヒーロー） */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wide">
              当月の収支バランス（収入 − 支出）
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              カード引落月基準
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${
                balance >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {balance >= 0 ? `+¥${balance.toLocaleString()}` : `-¥${Math.abs(balance).toLocaleString()}`}
            </span>
          </div>

          {/* キャッシュフローゲージ */}
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>収入に対する支出率</span>
              <span className="font-bold tabular-nums">
                {income > 0 ? `${((expense / income) * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  balance < 0 ? 'bg-rose-500' : spendRatio > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${spendRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* 右：収入・支出・内訳詳細 */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 収入合計 */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-bold">今月の収入</span>
            </div>
            <p className="text-base sm:text-lg font-extrabold text-emerald-700 tabular-nums mt-1">
              ¥{income.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600/80 mt-0.5">銀行口座振込</p>
          </div>

          {/* 支出合計 */}
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-rose-700 mb-1">
              <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <span className="text-xs font-bold">今月の支出計</span>
            </div>
            <p className="text-base sm:text-lg font-extrabold text-rose-600 tabular-nums mt-1">
              ¥{expense.toLocaleString()}
            </p>
            <p className="text-[10px] text-rose-500/80 mt-0.5 tabular-nums">
              現金・QR等: ¥{cashOtherExpense.toLocaleString()}
            </p>
          </div>

          {/* うち今月カード引落額 */}
          <div className="col-span-2 sm:col-span-1 bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 flex sm:block items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-blue-700 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-xs font-bold">当月カード引落</span>
              </div>
              <p className="text-base sm:text-lg font-extrabold text-blue-700 tabular-nums mt-1">
                ¥{cardExpense.toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-blue-600/80 sm:mt-0.5">
              当月口座引落分
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Landmark, CreditCard, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { Transaction } from '@/types';

interface SummaryCardsProps {
  monthlyTransactions: Transaction[];
  allTransactions: Transaction[];
  onOpenBankBalanceModal: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  monthlyTransactions,
  allTransactions,
  onOpenBankBalanceModal,
}) => {
  // 1. 当月の通常収支（調整金を除外し、純粋な当月の収入・支出を計算）
  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === 'income' && t.category !== '調整金')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === 'expense' && t.category !== '調整金')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  // 2. 現時点の銀行預金残高（これまでの全収入・調整金 − これまでの現金支出・引落済カード支出）
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.slice(0, 7);

  const settledIncome = allTransactions
    .filter((t) => t.type === 'income' && t.date <= todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const settledExpense = allTransactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      if (t.payment_method === 'クレジットカード' && t.billing_date) {
        return t.billing_date <= todayStr;
      }
      return t.date <= todayStr;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBankBalance = settledIncome - settledExpense;

  // 3. 今後のカード引き落とし予定額（未引落分）
  const upcomingCardTxs = allTransactions.filter(
    (t) =>
      t.type === 'expense' &&
      t.payment_method === 'クレジットカード' &&
      t.billing_date &&
      t.billing_date > todayStr
  );

  const totalUpcomingCard = upcomingCardTxs.reduce((sum, t) => sum + t.amount, 0);
  const thisMonthUpcomingCard = upcomingCardTxs
    .filter((t) => t.billing_date && t.billing_date.startsWith(currentYearMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  // 今後の引き落とし後の予想預金残高
  const projectedBalanceAfterCard = currentBankBalance - totalUpcomingCard;

  return (
    <div className="space-y-3 mb-4">
      {/* 上段：シンプル家計簿スタイル 3列収支バー（収入 | 支出 | 合計） */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 grid grid-cols-3 divide-x divide-slate-100 py-3 px-2 text-center">
        <div className="px-1">
          <p className="text-[11px] font-bold text-slate-400">収入</p>
          <p className="text-sm sm:text-lg font-extrabold text-sky-600 tabular-nums mt-0.5 truncate">
            ¥{monthlyIncome.toLocaleString()}
          </p>
        </div>

        <div className="px-1">
          <p className="text-[11px] font-bold text-slate-400">支出 (引落月基準)</p>
          <p className="text-sm sm:text-lg font-extrabold text-rose-500 tabular-nums mt-0.5 truncate">
            ¥{monthlyExpense.toLocaleString()}
          </p>
        </div>

        <div className="px-1">
          <p className="text-[11px] font-bold text-slate-400">今月の収支</p>
          <p
            className={`text-sm sm:text-lg font-extrabold tabular-nums mt-0.5 truncate ${
              monthlyBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {monthlyBalance >= 0
              ? `+¥${monthlyBalance.toLocaleString()}`
              : `-¥${Math.abs(monthlyBalance).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* 下段：銀行預金残高 ＆ 今後のカード引落シミュレーターバー */}
      <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-white rounded-2xl p-3.5 sm:px-5 border border-orange-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* 現在の預金残高 */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-orange-500" />
                <span>現在の銀行預金残高</span>
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
                ¥{currentBankBalance.toLocaleString()}
              </p>
            </div>

            {/* 今後のカード引き落とし予定 */}
            <div className="border-l border-orange-200/70 pl-4">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>今後のカード引落予定</span>
              </span>
              <p className="text-sm sm:text-base font-extrabold text-rose-600 tabular-nums">
                -¥{totalUpcomingCard.toLocaleString()}
                {thisMonthUpcomingCard > 0 && (
                  <span className="text-[10px] text-slate-500 font-semibold ml-1">
                    (うち今月: ¥{thisMonthUpcomingCard.toLocaleString()})
                  </span>
                )}
              </p>
            </div>

            {/* 引き落とし後の予想預金残高 */}
            <div className="border-l border-orange-200/70 pl-4">
              <span className="text-[11px] font-bold text-slate-500">
                引落後の予想預金残高
              </span>
              <p
                className={`text-base sm:text-lg font-extrabold tabular-nums flex items-center gap-1 ${
                  projectedBalanceAfterCard >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {projectedBalanceAfterCard < 0 && (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>¥{projectedBalanceAfterCard.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* 預金残高の入力・つじつま合わせボタン */}
          <button
            onClick={onOpenBankBalanceModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold rounded-xl shadow-sm shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>預金残高を入力・補正</span>
          </button>
        </div>
      </div>
    </div>
  );
};

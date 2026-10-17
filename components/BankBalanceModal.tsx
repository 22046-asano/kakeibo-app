'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  X,
  Check,
  ArrowRight,
  CreditCard as CardIcon,
  Calendar,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Transaction, TransactionInsert, CreditCard } from '@/types';

interface BankBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  cards: CreditCard[];
  onAddAdjustment: (data: TransactionInsert) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

/**
 * 1ヶ月前の日付（YYYY-MM-DD）を算出するヘルパー
 */
function getOneMonthAgoDateStr(baseDateStr: string): string {
  const parts = baseDateStr.split('-');
  if (parts.length !== 3) return baseDateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const targetMonthDate = new Date(y, m - 1, 1);
  const maxDay = new Date(
    targetMonthDate.getFullYear(),
    targetMonthDate.getMonth() + 1,
    0
  ).getDate();
  const finalDate = new Date(
    targetMonthDate.getFullYear(),
    targetMonthDate.getMonth(),
    Math.min(d, maxDay)
  );
  const fy = finalDate.getFullYear();
  const fm = String(finalDate.getMonth() + 1).padStart(2, '0');
  const fd = String(finalDate.getDate()).padStart(2, '0');
  return `${fy}-${fm}-${fd}`;
}

export const BankBalanceModal: React.FC<BankBalanceModalProps> = ({
  isOpen,
  onClose,
  transactions,
  cards,
  onAddAdjustment,
  onDeleteTransaction,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [actualBankBalanceInput, setActualBankBalanceInput] = useState<string>('');
  const [referenceDateStr, setReferenceDateStr] = useState<string>(todayStr);
  const [adjustmentDateStr, setAdjustmentDateStr] = useState<string>(
    getOneMonthAgoDateStr(todayStr)
  );
  const [adjustmentMemo, setAdjustmentMemo] = useState<string>(
    '預金残高つじつま合わせ（自動調整）'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 基準日変更時に1ヶ月前の日付を自動セット
  const handleReferenceDateChange = (newRefDate: string) => {
    setReferenceDateStr(newRefDate);
    setAdjustmentDateStr(getOneMonthAgoDateStr(newRefDate));
  };

  // 基準日（referenceDateStr）時点で既に決済・入出金が完了している収支の合計（現在のアプリ計算残高）
  // ・収入（調整金含む）：date <= referenceDateStr
  // ・現金/QR/口座支出（調整金含む）：date <= referenceDateStr
  // ・クレカ支出：billing_date <= referenceDateStr（すでに口座から引き落とされた分）
  const settledIncome = transactions
    .filter((t) => t.type === 'income' && t.date <= referenceDateStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const settledExpense = transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      if (t.payment_method === 'クレジットカード' && t.billing_date) {
        return t.billing_date <= referenceDateStr;
      }
      return t.date <= referenceDateStr;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const currentCalculatedBalance = settledIncome - settledExpense;

  // 今後（referenceDateStr より後）に引き落とされる予定のクレジットカード支出
  const upcomingCardTransactions = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      t.payment_method === 'クレジットカード' &&
      t.billing_date &&
      t.billing_date > referenceDateStr
  );

  const totalUpcomingCardWithdrawal = upcomingCardTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // 今月中に引き落とされる未引落カード分
  const currentYearMonth = referenceDateStr.slice(0, 7);
  const thisMonthUpcomingCard = upcomingCardTransactions
    .filter((t) => t.billing_date && t.billing_date.startsWith(currentYearMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  // 来月以降に引き落とされるカード分
  const futureMonthsUpcomingCard = totalUpcomingCardWithdrawal - thisMonthUpcomingCard;

  useEffect(() => {
    if (isOpen) {
      setReferenceDateStr(todayStr);
      setAdjustmentDateStr(getOneMonthAgoDateStr(todayStr));
      setActualBankBalanceInput(String(Math.max(currentCalculatedBalance, 0)));
      setAdjustmentMemo('預金残高つじつま合わせ（自動調整）');
    }
  }, [isOpen, todayStr, currentCalculatedBalance]);

  if (!isOpen) return null;

  const targetBalance = parseInt(actualBankBalanceInput || '0', 10);
  const isValidTarget = !isNaN(targetBalance);
  const diffAmount = isValidTarget ? targetBalance - currentCalculatedBalance : 0;

  // 調整後の予想残高（今後の引き落とし差し引き後）
  const balanceAfterThisMonthCard = (isValidTarget ? targetBalance : currentCalculatedBalance) - thisMonthUpcomingCard;
  const balanceAfterAllCards = (isValidTarget ? targetBalance : currentCalculatedBalance) - totalUpcomingCardWithdrawal;

  // 過去の調整金履歴
  const pastAdjustments = transactions.filter((t) => t.category === '調整金');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTarget) {
      alert('有効な預金残高を入力してください');
      return;
    }
    if (diffAmount === 0) {
      alert('現在のアプリ計算残高と一致しているため、調整データの追加は不要です。');
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddAdjustment({
        date: adjustmentDateStr,
        type: diffAmount > 0 ? 'income' : 'expense',
        category: '調整金',
        amount: Math.abs(diffAmount),
        payment_method: '銀行口座',
        credit_card_id: null,
        billing_date: null,
        employer_id: null,
        employer_name: null,
        memo: adjustmentMemo.trim() || '預金残高つじつま合わせ（自動調整）',
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('調整金の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                銀行預金残高の入力・自動つじつま合わせ
              </h3>
              <p className="text-[11px] text-slate-500">
                現在の口座残高に合わせて、過去日付で「調整金」を自動入力します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* 1. 実際の銀行預金残高の入力 */}
          <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4">
            <label className="block text-xs font-extrabold text-orange-950 mb-1.5">
              現在の実際の銀行預金残高を入力してください
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 font-extrabold text-xl">
                ¥
              </span>
              <input
                type="number"
                inputMode="numeric"
                required
                value={actualBankBalanceInput}
                onChange={(e) => setActualBankBalanceInput(e.target.value)}
                placeholder="150000"
                className="w-full pl-9 pr-4 py-3 bg-white border-2 border-orange-300 rounded-xl text-2xl font-extrabold text-slate-900 tabular-nums focus:outline-none focus:border-orange-500"
              />
            </div>
            <p className="text-[11px] text-orange-800/80 mt-2">
              ※収入や支出の記帳漏れがあっても、ここで実際の口座残高を入力すると差額が「調整金」として自動補正されます（年間のバイト代や通常の月間収入・支出には影響しません）。
            </p>
          </div>

          {/* 2. 自動計算される調整金プレビュー */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">現在のアプリ上の計算残高:</span>
              <span className="font-bold text-slate-700 tabular-nums">
                ¥{currentCalculatedBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">入力した実際の預金残高:</span>
              <span className="font-extrabold text-slate-900 tabular-nums">
                ¥{(isValidTarget ? targetBalance : 0).toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-slate-800 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                <span>自動入力される調整金額:</span>
              </span>
              <span
                className={`text-sm font-extrabold tabular-nums px-2.5 py-0.5 rounded-lg ${
                  diffAmount > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : diffAmount < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {diffAmount > 0
                  ? `+¥${diffAmount.toLocaleString()} (プラス調整)`
                  : diffAmount < 0
                  ? `-¥${Math.abs(diffAmount).toLocaleString()} (マイナス調整)`
                  : '±¥0 (ズレなし)'}
              </span>
            </div>
          </div>

          {/* 3. 今後のカード引き落とし金額との残高シミュレーション */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-blue-950 mb-1">
              <CardIcon className="w-4 h-4 text-blue-600" />
              <span>入力した預金残高 × 今後のカード引き落とし計算</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>今月これから引き落とされるカード予定額:</span>
              <span className="font-bold text-rose-600 tabular-nums">
                -¥{thisMonthUpcomingCard.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>来月以降に引き落とされるカード予定額:</span>
              <span className="font-bold text-rose-600 tabular-nums">
                -¥{futureMonthsUpcomingCard.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-blue-200/60 flex justify-between items-center">
              <span className="font-extrabold text-blue-950">
                今月のカード引き落とし後の予想預金残高:
              </span>
              <span
                className={`text-sm font-extrabold tabular-nums ${
                  balanceAfterThisMonthCard >= 0 ? 'text-blue-700' : 'text-rose-600'
                }`}
              >
                ¥{balanceAfterThisMonthCard.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-extrabold text-blue-950">
                全カード引き落とし後の実質預金残高:
              </span>
              <span
                className={`text-base font-extrabold tabular-nums ${
                  balanceAfterAllCards >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                ¥{balanceAfterAllCards.toLocaleString()}
              </span>
            </div>

            {balanceAfterAllCards < 0 && (
              <div className="mt-2 p-2 bg-rose-100 text-rose-800 rounded-xl font-bold flex items-center gap-1.5 text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  今後のカード引き落としに対して ¥
                  {Math.abs(balanceAfterAllCards).toLocaleString()} 不足しています！
                </span>
              </div>
            )}
          </div>

          {/* 4. 調整金の計上日（デフォルト：1ヶ月前）とメモ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>調整金の自動入力日（1ヶ月前）</span>
              </label>
              <input
                type="date"
                required
                value={adjustmentDateStr}
                onChange={(e) => setAdjustmentDateStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 tabular-nums"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                ※当月の収支と混ざらないよう1ヶ月前の日付が自動セットされます
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                調整メモ
              </label>
              <input
                type="text"
                value={adjustmentMemo}
                onChange={(e) => setAdjustmentMemo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          {/* 実行ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
            >
              閉じる
            </button>
            <button
              type="submit"
              disabled={isSubmitting || diffAmount === 0}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? '補正中...'
                  : diffAmount === 0
                  ? '現在残高と一致済'
                  : '預金残高につじつまを合わせる'}
              </span>
            </button>
          </div>
        </form>

        {/* 過去の調整金履歴（削除・リセット可能） */}
        {pastAdjustments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-700 mb-2">
              過去の残高調整（調整金）履歴
            </h4>
            <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto bg-slate-50 rounded-xl px-3 border border-slate-200/60">
              {pastAdjustments.map((adj) => (
                <div
                  key={adj.id}
                  className="py-2 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-700 tabular-nums mr-2">
                      {adj.date}
                    </span>
                    <span className="text-slate-500">{adj.memo || '残高調整'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-extrabold tabular-nums ${
                        adj.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {adj.type === 'income' ? '+' : '-'}¥{adj.amount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('この調整金データを削除しますか？')) {
                          onDeleteTransaction(adj.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

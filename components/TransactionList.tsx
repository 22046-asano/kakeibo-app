'use client';

import React from 'react';
import { ReceiptText, Trash2, Edit2, CreditCard as CardIcon } from 'lucide-react';
import { Transaction, CreditCard } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  cards?: CreditCard[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  cards = [],
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-800">今月の収支明細</h2>
        </div>
        <span className="text-xs text-slate-400">{transactions.length} 件</span>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-sm">今月に計上されるデータはありません</p>
          <p className="text-xs mt-1">「＋ 収支を記録」ボタンから入力してみましょう</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.map((t) => {
            const card = cards.find((c) => c.id === t.credit_card_id);
            const isCard = t.payment_method === 'クレジットカード';

            return (
              <div
                key={t.id}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      t.type === 'expense'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {t.category.slice(0, 2)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm truncate">
                        {t.category}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal flex items-center gap-1">
                        {isCard && <CardIcon className="w-2.5 h-2.5 text-blue-600" />}
                        <span>{card ? card.name : t.payment_method}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                      <span>利用日: {t.date}</span>
                      {isCard && t.billing_date && (
                        <span className="text-blue-600 font-medium">
                          (引落日: {t.billing_date.slice(5)})
                        </span>
                      )}
                      {t.memo && <span className="truncate max-w-[140px] sm:max-w-[200px]">・{t.memo}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span
                    className={`text-sm sm:text-base font-bold ${
                      t.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'
                    }`}
                  >
                    {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="編集"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('この明細を削除してもよろしいですか？')) {
                          onDelete(t.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

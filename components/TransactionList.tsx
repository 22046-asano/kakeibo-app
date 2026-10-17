'use client';

import React, { useState, useMemo } from 'react';
import {
  ReceiptText,
  Trash2,
  Edit2,
  CreditCard as CardIcon,
  Building2,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { Transaction, CreditCard } from '@/types';
import { CATEGORY_HEX_COLORS } from './CategoryBreakdown';

interface TransactionListProps {
  transactions: Transaction[];
  cards?: CreditCard[];
  selectedCategory?: string | null;
  onClearCategory?: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenCreate?: () => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateHeader(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m - 1, d);
  const w = WEEKDAYS[dateObj.getDay()] || '';
  return `${m}月${d}日 (${w})`;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  cards = [],
  selectedCategory = null,
  onClearCategory,
  onEdit,
  onDelete,
  onOpenCreate,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // フィルタリング処理
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const cardName = cards.find((c) => c.id === t.credit_card_id)?.name || '';
        const matchCategory = t.category.toLowerCase().includes(q);
        const matchMemo = (t.memo || '').toLowerCase().includes(q);
        const matchEmployer = (t.employer_name || '').toLowerCase().includes(q);
        const matchCard = cardName.toLowerCase().includes(q);
        const matchMethod = t.payment_method.toLowerCase().includes(q);
        if (!matchCategory && !matchMemo && !matchEmployer && !matchCard && !matchMethod) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, filterType, selectedCategory, searchQuery, cards]);

  // 日付（計上日または利用日）ごとにグルーピング
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      const key = t.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80">
      {/* ヘッダー＆フィルターバー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">入出金明細タイムライン</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
              {filteredTransactions.length}件
            </span>
          </div>
        </div>

        {/* 種別フィルタピル */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              支出
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              収入
            </button>
          </div>
        </div>
      </div>

      {/* 検索＆カテゴリ絞り込みバッジ */}
      <div className="mt-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="メモ・カテゴリ・カード名・バイト先で検索..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
        {selectedCategory && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200">
            <Filter className="w-3 h-3" />
            <span>{selectedCategory}</span>
            {onClearCategory && (
              <button
                onClick={onClearCategory}
                className="ml-1 text-indigo-400 hover:text-indigo-700 font-extrabold"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* 明細リスト本体（日付グルーピング） */}
      {groupedByDate.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-sm font-semibold text-slate-600">該当する明細データがありません</p>
          <p className="text-xs mt-1 text-slate-400">
            明細をタップすると後からいつでも内容や金額を変更できます
          </p>
          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>収支を記帳する</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateStr, items]) => {
            const dayExpense = items
              .filter((i) => i.type === 'expense')
              .reduce((s, i) => s + i.amount, 0);
            const dayIncome = items
              .filter((i) => i.type === 'income')
              .reduce((s, i) => s + i.amount, 0);

            return (
              <div key={dateStr} className="border border-slate-100 rounded-2xl overflow-hidden">
                {/* 日付ヘッダー（Zaim / マネーフォワード風） */}
                <div className="bg-slate-50/90 px-3.5 py-2 flex items-center justify-between border-b border-slate-100 text-xs">
                  <span className="font-extrabold text-slate-700">{formatDateHeader(dateStr)}</span>
                  <div className="flex items-center gap-3 tabular-nums font-bold">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600">+¥{dayIncome.toLocaleString()}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-slate-700">-¥{dayExpense.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* その日のトランザクション一覧 */}
                <div className="divide-y divide-slate-100 bg-white">
                  {items.map((t) => {
                    const card = cards.find((c) => c.id === t.credit_card_id);
                    const isCard = t.payment_method === 'クレジットカード';
                    const badgeColor =
                      t.type === 'expense'
                        ? CATEGORY_HEX_COLORS[t.category] || '#64748b'
                        : '#059669';

                    return (
                      <div
                        key={t.id}
                        onClick={() => onEdit(t)}
                        className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/90 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* カテゴリカラーアイコン */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: badgeColor }}
                          >
                            {t.category.slice(0, 2)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">
                                {t.category}
                              </span>

                              {/* バイト先バッジ */}
                              {t.employer_name && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 flex items-center gap-1">
                                  <Building2 className="w-2.5 h-2.5" />
                                  <span>{t.employer_name}</span>
                                </span>
                              )}

                              {/* 決済手段バッジ */}
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold flex items-center gap-1">
                                {isCard && <CardIcon className="w-2.5 h-2.5 text-blue-600" />}
                                <span>{card ? card.name : t.payment_method}</span>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                              {isCard && t.billing_date && (
                                <span className="text-blue-600 font-bold tabular-nums">
                                  引落予定: {t.billing_date.replace('-', '/').slice(5)}
                                </span>
                              )}
                              {t.memo ? (
                                <span className="text-slate-600 font-medium truncate max-w-[160px] sm:max-w-[260px]">
                                  {t.memo}
                                </span>
                              ) : (
                                <span>タップして編集</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 右側：金額＆常時表示の編集・削除ボタン */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm sm:text-base font-extrabold tabular-nums ${
                              t.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'
                            }`}
                          >
                            {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                          </span>

                          <div
                            className="flex items-center gap-1 border-l border-slate-100 pl-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onEdit(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="この明細を編集"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('この明細を削除してもよろしいですか？')) {
                                  onDelete(t.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="この明細を削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

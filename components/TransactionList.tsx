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
  SlidersHorizontal,
} from 'lucide-react';
import { Transaction, CreditCard } from '@/types';
import { CATEGORY_HEX_COLORS } from './CategoryBreakdown';

interface TransactionListProps {
  transactions: Transaction[];
  cards?: CreditCard[];
  selectedCategory?: string | null;
  selectedDayStr?: string | null;
  onClearCategory?: () => void;
  onClearDay?: () => void;
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
  selectedDayStr = null,
  onClearCategory,
  onClearDay,
  onEdit,
  onDelete,
  onOpenCreate,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedDayStr && t.date !== selectedDayStr && t.billing_date !== selectedDayStr) {
        return false;
      }
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
  }, [transactions, selectedDayStr, filterType, selectedCategory, searchQuery, cards]);

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
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
      {/* ヘッダー＆フィルターバー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-extrabold text-slate-800">
            {selectedDayStr ? `${selectedDayStr.replace(/-/g, '/')} の明細` : '入出金明細リスト'}
          </h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 tabular-nums">
            {filteredTransactions.length}件
          </span>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
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
              filterType === 'income' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            収入
          </button>
        </div>
      </div>

      {/* 検索＆絞り込み解除チップ */}
      <div className="mt-3 mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="メモ・カテゴリー・カード名で検索..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
          />
        </div>

        {selectedDayStr && onClearDay && (
          <button
            onClick={onClearDay}
            className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold border border-orange-200"
          >
            <span>日付指定: {selectedDayStr.slice(5)}</span>
            <span className="font-extrabold ml-1">×</span>
          </button>
        )}

        {selectedCategory && onClearCategory && (
          <button
            onClick={onClearCategory}
            className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold border border-orange-200"
          >
            <Filter className="w-3 h-3" />
            <span>{selectedCategory}</span>
            <span className="font-extrabold ml-1">×</span>
          </button>
        )}
      </div>

      {/* 明細一覧本体（シンプル家計簿風 日付見出し＋リスト） */}
      {groupedByDate.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <p className="text-xs font-bold text-slate-500">該当する明細データがありません</p>
          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-sm hover:bg-orange-600 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>収支を入力する</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedByDate.map(([dateStr, items]) => {
            const dayExpense = items
              .filter((i) => i.type === 'expense' && i.category !== '調整金')
              .reduce((s, i) => s + i.amount, 0);
            const dayIncome = items
              .filter((i) => i.type === 'income' && i.category !== '調整金')
              .reduce((s, i) => s + i.amount, 0);

            return (
              <div key={dateStr} className="border border-slate-200/70 rounded-xl overflow-hidden">
                {/* 日付ヘッダー */}
                <div className="bg-orange-50/50 px-3 py-1.5 flex items-center justify-between border-b border-slate-100 text-xs">
                  <span className="font-extrabold text-slate-700">{formatDateHeader(dateStr)}</span>
                  <div className="flex items-center gap-3 tabular-nums font-bold">
                    {dayIncome > 0 && (
                      <span className="text-sky-600">+¥{dayIncome.toLocaleString()}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-500">-¥{dayExpense.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* その日の明細行 */}
                <div className="divide-y divide-slate-100 bg-white">
                  {items.map((t) => {
                    const card = cards.find((c) => c.id === t.credit_card_id);
                    const isCard = t.payment_method === 'クレジットカード';
                    const isAdjustment = t.category === '調整金';
                    const badgeColor = isAdjustment
                      ? '#64748b'
                      : t.type === 'expense'
                      ? CATEGORY_HEX_COLORS[t.category] || '#f97316'
                      : '#0284c7';

                    return (
                      <div
                        key={t.id}
                        onClick={() => onEdit(t)}
                        className="p-3 flex items-center justify-between gap-2.5 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs text-white shrink-0"
                            style={{ backgroundColor: badgeColor }}
                          >
                            {isAdjustment ? (
                              <SlidersHorizontal className="w-4 h-4" />
                            ) : (
                              t.category.slice(0, 2)
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                                {isAdjustment ? '預金残高の調整金' : t.category}
                              </span>

                              {t.employer_name && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200/60 flex items-center gap-0.5">
                                  <Building2 className="w-2.5 h-2.5" />
                                  <span>{t.employer_name}</span>
                                </span>
                              )}

                              {!isAdjustment && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold flex items-center gap-1">
                                  {isCard && <CardIcon className="w-2.5 h-2.5 text-blue-600" />}
                                  <span>{card ? card.name : t.payment_method}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                              {isCard && t.billing_date && (
                                <span className="text-blue-600 font-bold tabular-nums">
                                  引落日: {t.billing_date.replace('-', '/').slice(5)}
                                </span>
                              )}
                              {t.memo && (
                                <span className="text-slate-500 font-medium truncate max-w-[160px] sm:max-w-[260px]">
                                  {t.memo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm sm:text-base font-extrabold tabular-nums ${
                              isAdjustment
                                ? 'text-slate-600'
                                : t.type === 'expense'
                                ? 'text-rose-500'
                                : 'text-sky-600'
                            }`}
                          >
                            {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                          </span>

                          <div
                            className="flex items-center gap-0.5 border-l border-slate-100 pl-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onEdit(t)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

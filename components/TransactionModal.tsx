'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard as CardIcon } from 'lucide-react';
import {
  Transaction,
  TransactionInsert,
  TransactionType,
  PaymentMethod,
  CreditCard,
} from '@/types';
import { calculateBillingDate } from '@/lib/creditCardUtils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionInsert, id?: string) => Promise<void>;
  editingTransaction?: Transaction | null;
  cards: CreditCard[];
}

const EXPENSE_CATEGORIES = [
  '大学',
  '食費',
  '日用品',
  '交通費',
  '趣味・娯楽',
  '水道・光熱費',
  '通信費',
  '住居費',
  '医療・健康',
  '衣服・美容',
  'その他',
];

const INCOME_CATEGORIES = [
  'バイト代',
  '給与',
  '臨時収入',
  'お小遣い',
  '事業所得',
  'その他',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'クレジットカード',
  '現金',
  '電子マネー/QR',
  '銀行口座',
  'その他',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction,
  cards,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('食費');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('クレジットカード');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.payment_method);
      setSelectedCardId(editingTransaction.credit_card_id || (cards[0]?.id || ''));
      setMemo(editingTransaction.memo || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setType('expense');
      setDate(today);
      setAmount('');
      setCategory('食費');
      setPaymentMethod('クレジットカード');
      setSelectedCardId(cards[0]?.id || '');
      setMemo('');
    }
  }, [editingTransaction, isOpen, cards]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  // クレジットカード引き落とし予定日の自動計算
  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const calculatedBillingDate =
    type === 'expense' && paymentMethod === 'クレジットカード' && selectedCard && date
      ? calculateBillingDate(date, selectedCard)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('有効な金額を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(
        {
          date,
          type,
          category,
          amount: numAmount,
          payment_method: paymentMethod,
          credit_card_id: paymentMethod === 'クレジットカード' ? selectedCardId || null : null,
          billing_date: calculatedBillingDate,
          memo,
        },
        editingTransaction?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">
            {editingTransaction ? '収支を編集' : '収支を記録'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* 種別トグル */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              収入
            </button>
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">金額 (円)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ¥
              </span>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 日付 (利用日) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">利用日 / 発生日</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">カテゴリ</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {currentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all truncate ${
                    category === cat
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === '大学' && '🎓 '}
                  {cat === 'バイト代' && '💼 '}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 支払方法 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">支払・受取方法</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* クレジットカード選択 & 引き落とし日自動算出表示 */}
          {type === 'expense' && paymentMethod === 'クレジットカード' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 space-y-2.5">
              <label className="block text-xs font-bold text-blue-900">
                決済クレジットカードの選択
              </label>

              {cards.length === 0 ? (
                <p className="text-xs text-blue-700">
                  ※クレジットカードがまだ未登録です。「カード管理」タブからカードを登録すると、引き落とし日が自動計算されます。
                </p>
              ) : (
                <>
                  <select
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name} (
                        {card.closing_day === 0 ? '月末' : `${card.closing_day}日`}締 /{' '}
                        {card.payment_day}日払)
                      </option>
                    ))}
                  </select>

                  {calculatedBillingDate && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-800 bg-white/80 px-2.5 py-1.5 rounded-lg border border-blue-100">
                      <CardIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        自動計算された引き落とし予定日:{' '}
                        <strong className="text-blue-900 font-bold">{calculatedBillingDate}</strong>
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* メモ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">メモ (任意)</label>
            <input
              type="text"
              placeholder="店名や品目のメモ"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* 保存ボタン */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isSubmitting ? '保存中...' : '保存する'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

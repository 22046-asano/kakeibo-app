'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  CreditCard as CardIcon,
  Building2,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  Transaction,
  TransactionInsert,
  TransactionType,
  PaymentMethod,
  CreditCard,
  Employer,
} from '@/types';
import { calculateBillingDate } from '@/lib/creditCardUtils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionInsert, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  editingTransaction?: Transaction | null;
  initialDate?: string | null;
  cards: CreditCard[];
  employers?: Employer[];
}

const EXPENSE_CATEGORIES = [
  '食費',
  '日用品',
  '大学',
  'クレカ',
  '交通費',
  '趣味・娯楽',
  '衣服・美容',
  '医療・健康',
  '水道・光熱費',
  '通信費',
  '住居費',
  'その他',
];

const INCOME_CATEGORIES = [
  'バイト代',
  '臨時収入',
  'お小遣い',
  '事業所得',
  'その他',
];

const EXPENSE_PAYMENT_METHODS: PaymentMethod[] = [
  'クレジットカード',
  '現金',
  '電子マネー/QR',
  '銀行口座',
  'その他',
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  editingTransaction,
  initialDate,
  cards,
  employers = [],
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('食費');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('クレジットカード');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [customBillingDate, setCustomBillingDate] = useState<string>('');
  const [isManualBillingDate, setIsManualBillingDate] = useState<boolean>(false);

  const [selectedEmployerId, setSelectedEmployerId] = useState<string>('');
  const [customEmployerName, setCustomEmployerName] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setPaymentMethod(
        editingTransaction.type === 'income' ? '銀行口座' : editingTransaction.payment_method
      );
      const cardId = editingTransaction.credit_card_id || cards[0]?.id || '';
      setSelectedCardId(cardId);

      const cardObj = cards.find((c) => c.id === cardId);
      const autoDate =
        cardObj && editingTransaction.date
          ? calculateBillingDate(editingTransaction.date, cardObj)
          : '';
      if (
        editingTransaction.billing_date &&
        editingTransaction.billing_date !== autoDate
      ) {
        setIsManualBillingDate(true);
        setCustomBillingDate(editingTransaction.billing_date);
      } else {
        setIsManualBillingDate(false);
        setCustomBillingDate(editingTransaction.billing_date || autoDate);
      }

      if (editingTransaction.employer_id) {
        setSelectedEmployerId(editingTransaction.employer_id);
        setCustomEmployerName(editingTransaction.employer_name || '');
      } else if (editingTransaction.employer_name) {
        setSelectedEmployerId('custom');
        setCustomEmployerName(editingTransaction.employer_name);
      } else {
        setSelectedEmployerId(employers[0]?.id || 'custom');
        setCustomEmployerName('');
      }
      setMemo(editingTransaction.memo || '');
    } else {
      const today = initialDate || new Date().toISOString().split('T')[0];
      setType('expense');
      setDate(today);
      setAmount('');
      setCategory('食費');
      setPaymentMethod('クレジットカード');
      setSelectedCardId(cards[0]?.id || '');
      setIsManualBillingDate(false);
      setCustomBillingDate('');
      setSelectedEmployerId(employers[0]?.id || 'custom');
      setCustomEmployerName('');
      setMemo('');
    }
  }, [editingTransaction, initialDate, isOpen, cards, employers]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (category === '調整金') return;
    if (newType === 'expense') {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        setCategory('食費');
      }
      setPaymentMethod('クレジットカード');
    } else {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory('バイト代');
      }
      setPaymentMethod('銀行口座');
    }
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const autoCalculatedBillingDate =
    type === 'expense' && paymentMethod === 'クレジットカード' && selectedCard && date
      ? calculateBillingDate(date, selectedCard)
      : null;

  const effectiveBillingDate =
    type === 'expense' && paymentMethod === 'クレジットカード'
      ? isManualBillingDate && customBillingDate
        ? customBillingDate
        : autoCalculatedBillingDate
      : null;

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseInt(amount || '0', 10);
    const base = isNaN(current) ? 0 : current;
    setAmount(String(base + addVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('有効な金額を入力してください');
      return;
    }

    const selectedEmp = employers.find((emp) => emp.id === selectedEmployerId);
    const resolvedEmployerId =
      type === 'income' && category === 'バイト代' && selectedEmployerId !== 'custom'
        ? selectedEmployerId || null
        : null;
    const resolvedEmployerName =
      type === 'income' && category === 'バイト代'
        ? selectedEmployerId === 'custom'
          ? customEmployerName.trim() || null
          : selectedEmp?.name || null
        : null;

    try {
      setIsSubmitting(true);
      await onSubmit(
        {
          date,
          type,
          category,
          amount: numAmount,
          payment_method: type === 'income' || category === '調整金' ? '銀行口座' : paymentMethod,
          credit_card_id:
            type === 'expense' && paymentMethod === 'クレジットカード' && category !== '調整金'
              ? selectedCardId || null
              : null,
          billing_date: category === '調整金' ? null : effectiveBillingDate,
          employer_id: resolvedEmployerId,
          employer_name: resolvedEmployerName,
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

  const currentCategories =
    category === '調整金'
      ? ['調整金', ...(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)]
      : type === 'expense'
      ? EXPENSE_CATEGORIES
      : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* シンプル家計簿風 上部バー（支出 / 収入 セグメント） */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex bg-orange-50 p-1 rounded-xl border border-orange-200/70 w-56">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                type === 'expense'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-orange-700 hover:bg-orange-100/50'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                type === 'income'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-orange-700 hover:bg-orange-100/50'
              }`}
            >
              収入
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* シンプル家計簿風 行フォーム（日付・金額・メモ） */}
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
            {/* 日付行 */}
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <label className="text-xs font-extrabold text-slate-600 w-20 shrink-0">
                日付
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 text-right bg-transparent text-sm font-extrabold text-slate-800 tabular-nums focus:outline-none"
              />
            </div>

            {/* 金額行 */}
            <div className="px-3.5 py-3 bg-orange-50/30">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-600 w-20 shrink-0">
                  金額
                </label>
                <div className="flex-1 flex items-center justify-end gap-1">
                  <span className="text-orange-500 font-extrabold text-lg">¥</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-right bg-transparent text-2xl font-extrabold text-slate-900 tabular-nums focus:outline-none"
                  />
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="ml-1 text-xs font-bold text-slate-400 hover:text-rose-500 px-1.5 py-0.5 rounded bg-slate-100"
                    >
                      クリア
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end flex-wrap gap-1.5 mt-2">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddAmount(val)}
                    className="px-2 py-0.5 bg-white hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 rounded-lg text-[11px] font-bold tabular-nums transition-colors"
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* メモ行 */}
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <label className="text-xs font-extrabold text-slate-600 w-20 shrink-0">
                メモ
              </label>
              <input
                type="text"
                placeholder="品目・お店の名前など（任意）"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="flex-1 text-right bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
              />
            </div>

            {/* 支払・受取方法行 */}
            {category !== '調整金' && (
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <label className="text-xs font-extrabold text-slate-600 w-24 shrink-0">
                  {type === 'expense' ? '支払方法' : '受取方法'}
                </label>
                {type === 'expense' ? (
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="text-right bg-transparent text-sm font-bold text-orange-600 focus:outline-none"
                  >
                    {EXPENSE_PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                    銀行口座振込
                  </span>
                )}
              </div>
            )}
          </div>

          {/* カテゴリーグリッド（シンプル家計簿スタイル） */}
          <div>
            <label className="block text-xs font-extrabold text-slate-600 mb-2">
              カテゴリー
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {currentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2.5 px-2 text-xs font-extrabold rounded-xl border transition-all truncate ${
                    category === cat
                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-orange-50/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* バイト代の場合: バイト先選択 */}
          {type === 'income' && category === 'バイト代' && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-3.5 space-y-2">
              <label className="block text-xs font-extrabold text-sky-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>バイト先の選択</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {employers.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedEmployerId(emp.id)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-left truncate ${
                      selectedEmployerId === emp.id
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {emp.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedEmployerId('custom')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-left truncate ${
                    selectedEmployerId === 'custom'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ＋ 直接入力・その他
                </button>
              </div>

              {selectedEmployerId === 'custom' && (
                <input
                  type="text"
                  value={customEmployerName}
                  onChange={(e) => setCustomEmployerName(e.target.value)}
                  placeholder="バイト先名を入力（例: 単発バイト、○○塾など）"
                  className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                />
              )}
            </div>
          )}

          {/* クレジットカード選択 & 引き落とし日 */}
          {type === 'expense' && paymentMethod === 'クレジットカード' && category !== '調整金' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 space-y-2.5">
              <label className="block text-xs font-extrabold text-blue-900">
                利用カード ＆ 口座引き落とし日
              </label>

              {cards.length === 0 ? (
                <p className="text-xs text-blue-700">
                  ※「カード・設定」タブからカードを登録すると選択できます。
                </p>
              ) : (
                <>
                  <select
                    value={selectedCardId}
                    onChange={(e) => {
                      setSelectedCardId(e.target.value);
                      setIsManualBillingDate(false);
                    }}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name} (
                        {card.closing_day === 0 ? '月末' : `${card.closing_day}日`}締 /{' '}
                        {card.payment_day === 0 ? '月末' : `${card.payment_day}日`}払)
                      </option>
                    ))}
                  </select>

                  <div className="bg-white/90 px-3 py-2 rounded-xl border border-blue-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-800 font-semibold flex items-center gap-1">
                        <CardIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>引き落とし予定日（変更可）:</span>
                      </span>
                      {isManualBillingDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualBillingDate(false);
                            setCustomBillingDate(autoCalculatedBillingDate || '');
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>自動計算に戻す</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="date"
                      value={effectiveBillingDate || ''}
                      onChange={(e) => {
                        setIsManualBillingDate(true);
                        setCustomBillingDate(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 tabular-nums"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* 保存・削除ボタン（シンプル家計簿風 オレンジボタン） */}
          <div className="pt-2 flex items-center gap-2.5">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('この明細を削除してもよろしいですか？')) {
                    await onDelete(editingTransaction.id);
                    onClose();
                  }
                }}
                className="px-4 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-colors text-xs sm:text-sm shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>削除</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              <Check className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? '保存中...'
                  : editingTransaction
                  ? '変更を保存する'
                  : `${type === 'expense' ? '支出' : '収入'}を入力する`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

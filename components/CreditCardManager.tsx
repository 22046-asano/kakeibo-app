'use client';

import React, { useState } from 'react';
import { CreditCard as CardIcon, Plus, Trash2, Edit2, X } from 'lucide-react';
import { CreditCard, CardTemplate, Transaction } from '@/types';
import { CARD_TEMPLATES } from '@/lib/creditCardUtils';

interface CreditCardManagerProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onAddCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  onUpdateCard: (
    id: string,
    card: Omit<CreditCard, 'id'>,
    recalculateExisting?: boolean
  ) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
  onEditTransaction?: (t: Transaction) => void;
}

const COLOR_SWATCHES = [
  '#dc2626',
  '#16a34a',
  '#2563eb',
  '#4f46e5',
  '#ea580c',
  '#0284c7',
  '#059669',
  '#9333ea',
  '#db2777',
  '#0f172a',
];

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  cards,
  transactions,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onEditTransaction,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(CARD_TEMPLATES[0]);
  const [customName, setCustomName] = useState('');
  const [customClosingDay, setCustomClosingDay] = useState(0);
  const [customPaymentOffset, setCustomPaymentOffset] = useState(1);
  const [customPaymentDay, setCustomPaymentDay] = useState(27);
  const [customHolidayRule, setCustomHolidayRule] = useState<
    'next_business_day' | 'prev_business_day' | 'none'
  >('next_business_day');
  const [customColor, setCustomColor] = useState('#2563eb');
  const [recalcTransactions, setRecalcTransactions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectTemplate = (template: CardTemplate) => {
    setSelectedTemplate(template);
    if (!editingCardId || !customName.trim()) {
      setCustomName(template.name);
    }
    setCustomClosingDay(template.closing_day);
    setCustomPaymentOffset(template.payment_month_offset);
    setCustomPaymentDay(template.payment_day);
    setCustomHolidayRule(template.holiday_rule);
    setCustomColor(template.color);
  };

  const handleOpenAddModal = () => {
    setEditingCardId(null);
    const tmpl = CARD_TEMPLATES[0];
    setSelectedTemplate(tmpl);
    setCustomName(tmpl.name);
    setCustomClosingDay(tmpl.closing_day);
    setCustomPaymentOffset(tmpl.payment_month_offset);
    setCustomPaymentDay(tmpl.payment_day);
    setCustomHolidayRule(tmpl.holiday_rule);
    setCustomColor(tmpl.color);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (card: CreditCard) => {
    setEditingCardId(card.id);
    setSelectedTemplate(null);
    setCustomName(card.name);
    setCustomClosingDay(card.closing_day);
    setCustomPaymentOffset(card.payment_month_offset);
    setCustomPaymentDay(card.payment_day);
    setCustomHolidayRule(card.holiday_rule);
    setCustomColor(card.color || '#2563eb');
    setRecalcTransactions(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      alert('カード名を入力してください');
      return;
    }
    try {
      setIsSubmitting(true);
      const cardData = {
        name: customName.trim(),
        closing_day: customClosingDay,
        payment_month_offset: customPaymentOffset,
        payment_day: customPaymentDay,
        holiday_rule: customHolidayRule,
        color: customColor,
      };

      if (editingCardId) {
        await onUpdateCard(editingCardId, cardData, recalcTransactions);
      } else {
        await onAddCard(cardData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('カード情報の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const getCardBillingAmount = (cardId: string, monthPrefix: string) => {
    return transactions
      .filter(
        (t) =>
          t.credit_card_id === cardId &&
          t.billing_date &&
          t.billing_date.startsWith(monthPrefix)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-indigo-600" />
            <span>クレジットカード管理・ルール設定</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            登録後もカードの名称・締め日・支払日・祝日ルール・カラーをいつでも編集できます
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>カードを追加</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 text-slate-400">
          <CardIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-600">登録されたクレジットカードはありません</p>
          <p className="text-xs mt-1 text-slate-400">
            「カードを追加」から楽天カードや三井住友カードなどのテンプレートを選んで登録できます
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const thisMonthAmount = getCardBillingAmount(card.id, currentMonthStr);
            const nextMonthAmount = getCardBillingAmount(card.id, nextMonthStr);

            return (
              <div
                key={card.id}
                onClick={() => handleOpenEditModal(card)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: card.color || '#2563eb' }}
                      >
                        <CardIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {card.name}
                        </h3>
                        <p className="text-[10px] text-slate-400">タップしてルール・名前を編集</p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenEditModal(card)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl flex items-center gap-1 transition-colors"
                        title="編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>編集</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`「${card.name}」を削除しますか？`)) {
                            onDeleteCard(card.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-600 space-y-1.5 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">締め日:</span>
                      <span className="font-bold text-slate-800">
                        {card.closing_day === 0 ? '毎月末日' : `毎月${card.closing_day}日`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">引き落とし日:</span>
                      <span className="font-bold text-slate-800">
                        {card.payment_month_offset === 0
                          ? '当月'
                          : card.payment_month_offset === 1
                          ? '翌月'
                          : '翌々月'}
                        {card.payment_day === 0 ? '末日' : `${card.payment_day}日`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">土日祝の扱い:</span>
                      <span className="font-bold text-slate-800">
                        {card.holiday_rule === 'next_business_day'
                          ? '翌営業日に振替'
                          : card.holiday_rule === 'prev_business_day'
                          ? '前営業日に振替'
                          : '振替なし'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 tabular-nums">
                  <div className="bg-blue-50/60 rounded-2xl p-3">
                    <p className="text-[11px] font-bold text-blue-700">今月の引落予定</p>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                      ¥{thisMonthAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-indigo-50/60 rounded-2xl p-3">
                    <p className="text-[11px] font-bold text-indigo-700">来月の引落予定</p>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                      ¥{nextMonthAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 登録・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingCardId ? 'クレジットカードの編集・ルール変更' : 'クレジットカードの登録'}
                </h3>
                <p className="text-xs text-slate-400">
                  テンプレートの適用や締め日・支払日・カラーのカスタマイズが可能です
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* テンプレート選択（新規時も編集時も利用可能） */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  カード会社テンプレートからルールをセット（任意）
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                  {CARD_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`text-left p-2 rounded-xl text-xs transition-all border ${
                        selectedTemplate?.name === tmpl.name
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-bold truncate">{tmpl.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">カード表示名</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="例: 楽天カード"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">締め日</label>
                  <select
                    value={customClosingDay}
                    onChange={(e) => setCustomClosingDay(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value={0}>月末締め</option>
                    {[...Array(30)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        毎月 {i + 1} 日締め
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">引き落とし日</label>
                  <div className="flex gap-1.5">
                    <select
                      value={customPaymentOffset}
                      onChange={(e) => setCustomPaymentOffset(parseInt(e.target.value, 10))}
                      className="w-1/2 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value={0}>当月</option>
                      <option value={1}>翌月</option>
                      <option value={2}>翌々月</option>
                    </select>
                    <select
                      value={customPaymentDay}
                      onChange={(e) => setCustomPaymentDay(parseInt(e.target.value, 10))}
                      className="w-1/2 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value={0}>末日</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}日
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  引き落とし日が土日祝日の場合
                </label>
                <select
                  value={customHolidayRule}
                  onChange={(e) => setCustomHolidayRule(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="next_business_day">翌営業日に引き落とし（標準）</option>
                  <option value="prev_business_day">前営業日に引き落とし</option>
                  <option value="none">日付通り（振替なし）</option>
                </select>
              </div>

              {/* テーマカラー選択 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  カードの識別カラー
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => setCustomColor(sw)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        customColor === sw ? 'scale-110 ring-2 ring-offset-2 ring-slate-900' : ''
                      }`}
                      style={{ backgroundColor: sw }}
                    />
                  ))}
                </div>
              </div>

              {/* 編集時：既存トランザクションの引き落とし日再計算オプション */}
              {editingCardId && (
                <label className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recalcTransactions}
                    onChange={(e) => setRecalcTransactions(e.target.checked)}
                    className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div className="text-xs">
                    <p className="font-extrabold text-blue-900">
                      このカードで登録済みの明細の引き落とし予定日も新ルールで再計算する
                    </p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      締め日や支払日を変更した場合、過去の明細の引落日も一括で最新ルールに更新されます
                    </p>
                  </div>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : editingCardId ? '変更を保存' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

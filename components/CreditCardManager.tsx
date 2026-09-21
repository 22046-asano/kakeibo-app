'use client';

import React, { useState } from 'react';
import { CreditCard as CardIcon, Plus, Trash2 } from 'lucide-react';
import { CreditCard, CardTemplate, Transaction } from '@/types';
import { CARD_TEMPLATES } from '@/lib/creditCardUtils';

interface CreditCardManagerProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onAddCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  cards,
  transactions,
  onAddCard,
  onDeleteCard,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(CARD_TEMPLATES[0]);
  const [customName, setCustomName] = useState('');
  const [customClosingDay, setCustomClosingDay] = useState(0);
  const [customPaymentOffset, setCustomPaymentOffset] = useState(1);
  const [customPaymentDay, setCustomPaymentDay] = useState(27);
  const [customHolidayRule, setCustomHolidayRule] = useState<'next_business_day' | 'prev_business_day' | 'none'>('next_business_day');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectTemplate = (template: CardTemplate) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setCustomClosingDay(template.closing_day);
    setCustomPaymentOffset(template.payment_month_offset);
    setCustomPaymentDay(template.payment_day);
    setCustomHolidayRule(template.holiday_rule);
  };

  const handleOpenModal = () => {
    handleSelectTemplate(CARD_TEMPLATES[0]);
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
      await onAddCard({
        name: customName,
        closing_day: customClosingDay,
        payment_month_offset: customPaymentOffset,
        payment_day: customPaymentDay,
        holiday_rule: customHolidayRule,
        color: selectedTemplate?.color || '#2563eb',
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('カードの登録に失敗しました');
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
      .filter((t) => t.credit_card_id === cardId && t.billing_date && t.billing_date.startsWith(monthPrefix))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-blue-600" />
            <span>クレジットカード管理 &amp; 引き落とし予定</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            カード会社のルール（締め日・支払日・祝日振替）を設定し、支払予定日ごとに自動集計します。
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>カードを登録</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 text-slate-400">
          <CardIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">クレジットカードがまだ登録されていません</p>
          <p className="text-xs mt-1 text-slate-400">
            「カードを登録」から楽天カードや三井住友カードなどのテンプレートを選んで登録してください。
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
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: card.color || '#2563eb' }}
                      >
                        <CardIcon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">{card.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`「${card.name}」を削除しますか？`)) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">締め日:</span>
                      <span className="font-medium">
                        {card.closing_day === 0 ? '毎月末日' : `毎月${card.closing_day}日`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">引き落とし日:</span>
                      <span className="font-medium">
                        {card.payment_month_offset === 0
                          ? '当月'
                          : card.payment_month_offset === 1
                          ? '翌月'
                          : '翌々月'}
                        {card.payment_day === 0 ? '末日' : `${card.payment_day}日`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">土日祝の扱い:</span>
                      <span className="font-medium">
                        {card.holiday_rule === 'next_business_day'
                          ? '翌営業日に振替'
                          : card.holiday_rule === 'prev_business_day'
                          ? '前営業日に振替'
                          : '振替なし'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="bg-blue-50/60 rounded-xl p-2.5">
                    <p className="text-[11px] font-medium text-blue-700">今月の引落予定</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      ¥{thisMonthAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-indigo-50/60 rounded-xl p-2.5">
                    <p className="text-[11px] font-medium text-indigo-700">来月の引落予定</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      ¥{nextMonthAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">クレジットカードの登録</h3>
            <p className="text-xs text-slate-500 mb-4">
              カード会社ごとのテンプレートを選ぶと、締め日や支払日ルールが自動セットされます。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  カード会社テンプレート
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {CARD_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`text-left p-2 rounded-lg text-xs transition-all border ${
                        selectedTemplate?.name === tmpl.name
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-semibold truncate">{tmpl.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">カード表示名</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="例: 楽天カード"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">締め日</label>
                  <select
                    value={customClosingDay}
                    onChange={(e) => setCustomClosingDay(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value={0}>月末締め</option>
                    {[...Array(30)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        毎月 {i + 1} 日
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">引き落とし日</label>
                  <div className="flex gap-1.5">
                    <select
                      value={customPaymentOffset}
                      onChange={(e) => setCustomPaymentOffset(parseInt(e.target.value, 10))}
                      className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      <option value={0}>当月</option>
                      <option value={1}>翌月</option>
                      <option value={2}>翌々月</option>
                    </select>
                    <select
                      value={customPaymentDay}
                      onChange={(e) => setCustomPaymentDay(parseInt(e.target.value, 10))}
                      className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  引き落とし日が土日祝日の場合
                </label>
                <select
                  value={customHolidayRule}
                  onChange={(e) => setCustomHolidayRule(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="next_business_day">翌営業日に引き落とし（標準）</option>
                  <option value="prev_business_day">前営業日に引き落とし</option>
                  <option value="none">日付通り（振替なし）</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '登録中...' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

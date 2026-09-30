'use client';

import React, { useState } from 'react';
import { 
  BadgePercent, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Users, 
  Building, 
  Heart, 
  Home, 
  GraduationCap, 
  ArrowRight, 
  Coins, 
  HandCoins 
} from 'lucide-react';
import { ExpectedIncome, Reimbursement, ReimbursementTarget, Employer, TransactionInsert } from '@/types';

interface AdvancePaymentTrackerProps {
  expectedIncomes: ExpectedIncome[];
  reimbursements: Reimbursement[];
  employers: Employer[];
  onAddExpectedIncome: (data: Omit<ExpectedIncome, 'id'>) => Promise<void>;
  onToggleConfirmIncome: (id: string, isConfirmed: boolean) => Promise<void>;
  onDeleteExpectedIncome: (id: string) => Promise<void>;
  onRegisterIncomeToTransaction?: (income: ExpectedIncome) => Promise<void>;
  onAddReimbursement: (data: Omit<Reimbursement, 'id'>) => Promise<void>;
  onToggleSettleReimbursement: (id: string, isSettled: boolean) => Promise<void>;
  onDeleteReimbursement: (id: string) => Promise<void>;
}

export const AdvancePaymentTracker: React.FC<AdvancePaymentTrackerProps> = ({
  expectedIncomes,
  reimbursements,
  employers,
  onAddExpectedIncome,
  onToggleConfirmIncome,
  onDeleteExpectedIncome,
  onRegisterIncomeToTransaction,
  onAddReimbursement,
  onToggleSettleReimbursement,
  onDeleteReimbursement,
}) => {
  const [subTab, setSubTab] = useState<'income' | 'reimbursement'>('income');

  // モーダル管理
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);

  // 振込予定フォーム
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [customEmployerName, setCustomEmployerName] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [expectedPayDate, setExpectedPayDate] = useState('');
  const [workPeriod, setWorkPeriod] = useState('');
  const [incomeMemo, setIncomeMemo] = useState('');

  // 立替金フォーム
  const [target, setTarget] = useState<ReimbursementTarget>('友達');
  const [personOrPurpose, setPersonOrPurpose] = useState('');
  const [reimburseAmount, setReimburseAmount] = useState('');
  const [reimburseDate, setReimburseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [reimburseMemo, setReimburseMemo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 集計
  const unconfirmedIncomes = expectedIncomes.filter((i) => !i.is_confirmed);
  const totalUnconfirmedIncome = unconfirmedIncomes.reduce((sum, i) => sum + i.expected_amount, 0);

  const unsettledReimbursements = reimbursements.filter((r) => !r.is_settled);
  const totalUnsettledReimbursement = unsettledReimbursements.reduce((sum, r) => sum + r.amount, 0);

  // 立替のカテゴリ別集計
  const targetIcons: Record<ReimbursementTarget, any> = {
    '友達': Users,
    '大学': GraduationCap,
    '会社': Building,
    '彼女': Heart,
    '家族': Home,
  };

  const targetColors: Record<ReimbursementTarget, string> = {
    '友達': 'bg-sky-50 text-sky-700 border-sky-200',
    '大学': 'bg-purple-50 text-purple-700 border-purple-200',
    '会社': 'bg-blue-50 text-blue-700 border-blue-200',
    '彼女': 'bg-pink-50 text-pink-700 border-pink-200',
    '家族': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const handleOpenIncomeModal = () => {
    setSelectedEmployerId(employers[0]?.id || '');
    setCustomEmployerName(employers[0]?.name || '');
    setExpectedAmount('');
    setExpectedPayDate('');
    setWorkPeriod('');
    setIncomeMemo('');
    setIsIncomeModalOpen(true);
  };

  const handleOpenReimburseModal = () => {
    setTarget('友達');
    setPersonOrPurpose('');
    setReimburseAmount('');
    setReimburseDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setReimburseMemo('');
    setIsReimburseModalOpen(true);
  };

  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(expectedAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      alert('有効な金額を入力してください');
      return;
    }
    const emp = employers.find((e) => e.id === selectedEmployerId);
    const empName = emp ? emp.name : (customEmployerName.trim() || 'バイト先');

    try {
      setIsSubmitting(true);
      await onAddExpectedIncome({
        employer_id: emp ? emp.id : null,
        employer_name: empName,
        expected_amount: amt,
        expected_pay_date: expectedPayDate || new Date().toISOString().split('T')[0],
        work_period: workPeriod,
        memo: incomeMemo,
        is_confirmed: false,
      });
      setIsIncomeModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('振込予定の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(reimburseAmount, 10);
    if (isNaN(amt) || amt <= 0 || !personOrPurpose.trim()) {
      alert('金額と対象・用途を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddReimbursement({
        target,
        person_or_purpose: personOrPurpose,
        amount: amt,
        date: reimburseDate,
        due_date: dueDate || undefined,
        is_settled: false,
        memo: reimburseMemo,
      });
      setIsReimburseModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('立替金の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 上部ヘッダー & サブタブ切り替え */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-indigo-600" />
              <span>振込予定 ＆ 立替金管理</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ※実際の収支計算とは完全に独立した管理スペースです。口座振込の照合や立替金の回収を管理できます。
            </p>
          </div>
        </div>

        {/* サブタブ */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setSubTab('income')}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              subTab === 'income'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>バイト代振込予定チェック</span>
            {unconfirmedIncomes.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px]">
                {unconfirmedIncomes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('reimbursement')}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              subTab === 'reimbursement'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            <span>立替金・請求予定</span>
            {unsettledReimbursements.length > 0 && (
              <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full text-[10px]">
                {unsettledReimbursements.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1. バイト代振込予定チェック */}
      {subTab === 'income' && (
        <div className="space-y-4">
          {/* サマリーカード */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/15 flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-200 font-medium">現在 振込待ちの合計金額</p>
              <p className="text-2xl sm:text-3xl font-extrabold mt-1">
                ¥{totalUnconfirmedIncome.toLocaleString()}
              </p>
              <p className="text-[11px] text-indigo-100 mt-1">
                口座に入金されたら「確認」を押して金額を照合できます
              </p>
            </div>
            <button
              onClick={handleOpenIncomeModal}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>予定を追加</span>
            </button>
          </div>

          {/* 振込予定リスト */}
          {expectedIncomes.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 text-slate-400">
              <Coins className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">振込予定はまだありません</p>
              <p className="text-xs mt-1 text-slate-400">
                「予定を追加」から今月働いた時間や見込み金額を記録しておきましょう。
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 divide-y divide-slate-100">
              {expectedIncomes.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.employer_name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.is_confirmed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}
                      >
                        {item.is_confirmed ? '振込確認済' : '未振込 (入金待ち)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>振込予定日: {item.expected_pay_date}</span>
                      {item.work_period && <span>・勤務: {item.work_period}</span>}
                      {item.memo && <span className="text-slate-400">・{item.memo}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0">
                    <span className="text-base sm:text-lg font-extrabold text-indigo-700">
                      ¥{item.expected_amount.toLocaleString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!item.is_confirmed ? (
                        <button
                          onClick={async () => {
                            if (confirm(`「${item.employer_name}」の ¥${item.expected_amount.toLocaleString()} の入金を確認しましたか？
実際の家計簿（収入）にも自動登録しますか？`)) {
                              await onToggleConfirmIncome(item.id, true);
                              if (onRegisterIncomeToTransaction) {
                                await onRegisterIncomeToTransaction(item);
                              }
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>振込を確認</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleConfirmIncome(item.id, false)}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
                        >
                          未確認に戻す
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm('この予定を削除しますか？')) {
                            onDeleteExpectedIncome(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. 立替金・請求予定 */}
      {subTab === 'reimbursement' && (
        <div className="space-y-4">
          {/* サマリーカード */}
          <div className="bg-gradient-to-br from-rose-600 to-pink-700 rounded-3xl p-5 text-white shadow-lg shadow-rose-500/15 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-200 font-medium">現在 自分が立て替えている未回収合計</p>
              <p className="text-2xl sm:text-3xl font-extrabold mt-1">
                ¥{totalUnsettledReimbursement.toLocaleString()}
              </p>
              <p className="text-[11px] text-rose-100 mt-1">
                友達・大学・会社・彼女・家族への請求漏れを防ぎます
              </p>
            </div>
            <button
              onClick={handleOpenReimburseModal}
              className="bg-white text-rose-700 hover:bg-rose-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>立替を記録</span>
            </button>
          </div>

          {/* 立替リスト */}
          {reimbursements.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 text-slate-400">
              <HandCoins className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">立替金の記録はありません</p>
              <p className="text-xs mt-1 text-slate-400">
                友達との食事や大学の備品購入などを立て替えた際に記録しておきましょう。
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 divide-y divide-slate-100">
              {reimbursements.map((r) => {
                const Icon = targetIcons[r.target] || Users;
                const colorClass = targetColors[r.target] || 'bg-slate-50 text-slate-700 border-slate-200';

                return (
                  <div
                    key={r.id}
                    className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${colorClass}`}>
                          <Icon className="w-3 h-3" />
                          <span>{r.target}</span>
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{r.person_or_purpose}</span>
                        {r.is_settled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">
                            精算済
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>立替日: {r.date}</span>
                        {r.due_date && <span>・回収予定: {r.due_date}</span>}
                        {r.memo && <span className="text-slate-400">・{r.memo}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0">
                      <span className={`text-base sm:text-lg font-extrabold ${r.is_settled ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                        ¥{r.amount.toLocaleString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleSettleReimbursement(r.id, !r.is_settled)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            r.is_settled
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{r.is_settled ? '未精算に戻す' : '精算完了'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('この立替記録を削除しますか？')) {
                              onDeleteReimbursement(r.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 振込予定登録モーダル */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">振込予定の登録</h3>
            <p className="text-xs text-slate-500 mb-4">
              今後振り込まれる予定のバイト代・給与を記録します。
            </p>

            <form onSubmit={handleSubmitIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">バイト先</label>
                {employers.length > 0 ? (
                  <select
                    value={selectedEmployerId}
                    onChange={(e) => setSelectedEmployerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {employers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="例: ○○塾"
                    value={customEmployerName}
                    onChange={(e) => setCustomEmployerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">予定金額 (円)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                  <input
                    type="number"
                    required
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">振込予定日</label>
                <input
                  type="date"
                  required
                  value={expectedPayDate}
                  onChange={(e) => setExpectedPayDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">勤務期間・時間メモ (任意)</label>
                <input
                  type="text"
                  placeholder="例: 9月分 40時間、コマ数20回 など"
                  value={workPeriod}
                  onChange={(e) => setWorkPeriod(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">備考 (任意)</label>
                <input
                  type="text"
                  placeholder="交通費込み、など"
                  value={incomeMemo}
                  onChange={(e) => setIncomeMemo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '登録中...' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 立替金登録モーダル */}
      {isReimburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">立替金の登録</h3>
            <p className="text-xs text-slate-500 mb-4">
              友達・大学・会社・彼女・家族に後から請求する立替分を記録します。
            </p>

            <form onSubmit={handleSubmitReimbursement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">立替対象区分</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['友達', '大学', '会社', '彼女', '家族'] as ReimbursementTarget[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTarget(t)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        target === t
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">相手の名前・用途</label>
                <input
                  type="text"
                  required
                  placeholder="例: ○○くん飲み会代、研究室の備品、旅行宿代 など"
                  value={personOrPurpose}
                  onChange={(e) => setPersonOrPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">立替金額 (円)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                  <input
                    type="number"
                    required
                    value={reimburseAmount}
                    onChange={(e) => setReimburseAmount(e.target.value)}
                    placeholder="3000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">立替日</label>
                  <input
                    type="date"
                    required
                    value={reimburseDate}
                    onChange={(e) => setReimburseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">回収予定日 (任意)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">メモ (任意)</label>
                <input
                  type="text"
                  placeholder="PayPay送金待ち、領収書提出済み など"
                  value={reimburseMemo}
                  onChange={(e) => setReimburseMemo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReimburseModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
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

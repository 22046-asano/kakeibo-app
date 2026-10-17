'use client';

import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Users,
  Building,
  Heart,
  Home,
  GraduationCap,
  Coins,
  HandCoins,
  X,
  Check,
} from 'lucide-react';
import {
  ExpectedIncome,
  Reimbursement,
  ReimbursementTarget,
  Employer,
} from '@/types';

interface AdvancePaymentTrackerProps {
  expectedIncomes: ExpectedIncome[];
  reimbursements: Reimbursement[];
  employers: Employer[];
  onAddExpectedIncome: (data: Omit<ExpectedIncome, 'id'>) => Promise<void>;
  onUpdateExpectedIncome: (id: string, data: Omit<ExpectedIncome, 'id'>) => Promise<void>;
  onToggleConfirmIncome: (id: string, isConfirmed: boolean) => Promise<void>;
  onDeleteExpectedIncome: (id: string) => Promise<void>;
  onRegisterIncomeToTransaction?: (income: ExpectedIncome) => Promise<void>;
  onAddReimbursement: (data: Omit<Reimbursement, 'id'>) => Promise<void>;
  onUpdateReimbursement: (id: string, data: Omit<Reimbursement, 'id'>) => Promise<void>;
  onToggleSettleReimbursement: (id: string, isSettled: boolean) => Promise<void>;
  onDeleteReimbursement: (id: string) => Promise<void>;
}

const TARGET_LIST: ReimbursementTarget[] = ['友達', '大学', '会社', '彼女', '家族'];

export const AdvancePaymentTracker: React.FC<AdvancePaymentTrackerProps> = ({
  expectedIncomes,
  reimbursements,
  employers,
  onAddExpectedIncome,
  onUpdateExpectedIncome,
  onToggleConfirmIncome,
  onDeleteExpectedIncome,
  onRegisterIncomeToTransaction,
  onAddReimbursement,
  onUpdateReimbursement,
  onToggleSettleReimbursement,
  onDeleteReimbursement,
}) => {
  const [subTab, setSubTab] = useState<'income' | 'reimbursement'>('reimbursement');

  // フィルタ管理
  const [reimburseFilterTarget, setReimburseFilterTarget] = useState<ReimbursementTarget | 'ALL'>('ALL');
  const [reimburseStatusFilter, setReimburseStatusFilter] = useState<'all' | 'unsettled' | 'settled'>('all');
  const [incomeStatusFilter, setIncomeStatusFilter] = useState<'all' | 'unconfirmed' | 'confirmed'>('all');

  // モーダル管理（新規・編集兼用）
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);

  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [editingReimburseId, setEditingReimburseId] = useState<string | null>(null);

  // 振込確認＆家計簿反映モーダル
  const [confirmingIncome, setConfirmingIncome] = useState<ExpectedIncome | null>(null);
  const [confirmActualAmount, setConfirmActualAmount] = useState<string>('');
  const [confirmActualDate, setConfirmActualDate] = useState<string>('');
  const [autoRegisterToBudget, setAutoRegisterToBudget] = useState<boolean>(true);

  // 振込予定フォームステート
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [customEmployerName, setCustomEmployerName] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [expectedPayDate, setExpectedPayDate] = useState('');
  const [workPeriod, setWorkPeriod] = useState('');
  const [incomeMemo, setIncomeMemo] = useState('');
  const [incomeIsConfirmed, setIncomeIsConfirmed] = useState(false);

  // 立替金フォームステート
  const [target, setTarget] = useState<ReimbursementTarget>('友達');
  const [personOrPurpose, setPersonOrPurpose] = useState('');
  const [reimburseAmount, setReimburseAmount] = useState('');
  const [reimburseDate, setReimburseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [reimburseMemo, setReimburseMemo] = useState('');
  const [reimburseIsSettled, setReimburseIsSettled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 集計
  const unconfirmedIncomes = expectedIncomes.filter((i) => !i.is_confirmed);
  const totalUnconfirmedIncome = unconfirmedIncomes.reduce((sum, i) => sum + i.expected_amount, 0);

  const unsettledReimbursements = reimbursements.filter((r) => !r.is_settled);
  const totalUnsettledReimbursement = unsettledReimbursements.reduce((sum, r) => sum + r.amount, 0);

  // 区分ごとの未回収合計
  const unsettledByTarget = TARGET_LIST.reduce<Record<ReimbursementTarget, number>>(
    (acc, t) => {
      acc[t] = unsettledReimbursements
        .filter((r) => r.target === t)
        .reduce((sum, r) => sum + r.amount, 0);
      return acc;
    },
    { '友達': 0, '大学': 0, '会社': 0, '彼女': 0, '家族': 0 }
  );

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

  // --- 振込予定モーダル操作（新規 ＆ 編集） ---
  const handleOpenAddIncome = () => {
    setEditingIncomeId(null);
    setSelectedEmployerId(employers[0]?.id || 'custom');
    setCustomEmployerName('');
    setExpectedAmount('');
    setExpectedPayDate(new Date().toISOString().split('T')[0]);
    setWorkPeriod('');
    setIncomeMemo('');
    setIncomeIsConfirmed(false);
    setIsIncomeModalOpen(true);
  };

  const handleOpenEditIncome = (item: ExpectedIncome) => {
    setEditingIncomeId(item.id);
    if (item.employer_id && employers.some((e) => e.id === item.employer_id)) {
      setSelectedEmployerId(item.employer_id);
      setCustomEmployerName(item.employer_name);
    } else {
      setSelectedEmployerId('custom');
      setCustomEmployerName(item.employer_name);
    }
    setExpectedAmount(item.expected_amount.toString());
    setExpectedPayDate(item.expected_pay_date);
    setWorkPeriod(item.work_period || '');
    setIncomeMemo(item.memo || '');
    setIncomeIsConfirmed(item.is_confirmed);
    setIsIncomeModalOpen(true);
  };

  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(expectedAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      alert('有効な金額を入力してください');
      return;
    }
    const emp = employers.find((e) => e.id === selectedEmployerId);
    const empName =
      selectedEmployerId === 'custom'
        ? customEmployerName.trim() || 'バイト先'
        : emp?.name || 'バイト先';

    const payload: Omit<ExpectedIncome, 'id'> = {
      employer_id: selectedEmployerId === 'custom' ? null : emp?.id || null,
      employer_name: empName,
      expected_amount: amt,
      expected_pay_date: expectedPayDate || new Date().toISOString().split('T')[0],
      work_period: workPeriod,
      memo: incomeMemo,
      is_confirmed: incomeIsConfirmed,
    };

    try {
      setIsSubmitting(true);
      if (editingIncomeId) {
        await onUpdateExpectedIncome(editingIncomeId, payload);
      } else {
        await onAddExpectedIncome(payload);
      }
      setIsIncomeModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('振込予定の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 振込確認＆金額調整ダイアログ ---
  const handleOpenConfirmDialog = (item: ExpectedIncome) => {
    setConfirmingIncome(item);
    setConfirmActualAmount(item.expected_amount.toString());
    setConfirmActualDate(item.expected_pay_date);
    setAutoRegisterToBudget(true);
  };

  const handleExecuteConfirmIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingIncome) return;
    const finalAmt = parseInt(confirmActualAmount, 10);
    if (isNaN(finalAmt) || finalAmt <= 0) {
      alert('有効な金額を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedItem: Omit<ExpectedIncome, 'id'> = {
        employer_id: confirmingIncome.employer_id,
        employer_name: confirmingIncome.employer_name,
        expected_amount: finalAmt,
        expected_pay_date: confirmActualDate || confirmingIncome.expected_pay_date,
        work_period: confirmingIncome.work_period,
        memo: confirmingIncome.memo,
        is_confirmed: true,
      };
      await onUpdateExpectedIncome(confirmingIncome.id, updatedItem);

      if (autoRegisterToBudget && onRegisterIncomeToTransaction) {
        await onRegisterIncomeToTransaction({
          ...updatedItem,
          id: confirmingIncome.id,
        });
      }
      setConfirmingIncome(null);
    } catch (err) {
      console.error(err);
      alert('振込確認の処理に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 立替金モーダル操作（新規 ＆ 編集） ---
  const handleOpenAddReimburse = () => {
    setEditingReimburseId(null);
    setTarget('友達');
    setPersonOrPurpose('');
    setReimburseAmount('');
    setReimburseDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setReimburseMemo('');
    setReimburseIsSettled(false);
    setIsReimburseModalOpen(true);
  };

  const handleOpenEditReimburse = (r: Reimbursement) => {
    setEditingReimburseId(r.id);
    setTarget(r.target);
    setPersonOrPurpose(r.person_or_purpose);
    setReimburseAmount(r.amount.toString());
    setReimburseDate(r.date);
    setDueDate(r.due_date || '');
    setReimburseMemo(r.memo || '');
    setReimburseIsSettled(r.is_settled);
    setIsReimburseModalOpen(true);
  };

  const handleSubmitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(reimburseAmount, 10);
    if (isNaN(amt) || amt <= 0 || !personOrPurpose.trim()) {
      alert('金額と対象・用途を入力してください');
      return;
    }

    const payload: Omit<Reimbursement, 'id'> = {
      target,
      person_or_purpose: personOrPurpose.trim(),
      amount: amt,
      date: reimburseDate,
      due_date: dueDate || undefined,
      is_settled: reimburseIsSettled,
      memo: reimburseMemo,
    };

    try {
      setIsSubmitting(true);
      if (editingReimburseId) {
        await onUpdateReimbursement(editingReimburseId, payload);
      } else {
        await onAddReimbursement(payload);
      }
      setIsReimburseModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('立替金の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // フィルタ済みリスト
  const filteredExpectedIncomes = expectedIncomes.filter((i) => {
    if (incomeStatusFilter === 'unconfirmed') return !i.is_confirmed;
    if (incomeStatusFilter === 'confirmed') return i.is_confirmed;
    return true;
  });

  const filteredReimbursements = reimbursements.filter((r) => {
    if (reimburseFilterTarget !== 'ALL' && r.target !== reimburseFilterTarget) return false;
    if (reimburseStatusFilter === 'unsettled' && r.is_settled) return false;
    if (reimburseStatusFilter === 'settled' && !r.is_settled) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* サブタブ切り替えバー */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-indigo-600" />
              <span>立替金・請求予定 ＆ バイト代振込予定</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              すべての登録データは後からいつでも金額・内容・日付を編集できます（家計簿の収支計算とは独立）
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setSubTab('reimbursement')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              subTab === 'reimbursement'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            <span>立替金・請求予定</span>
            {unsettledReimbursements.length > 0 && (
              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] tabular-nums">
                未回収 {unsettledReimbursements.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('income')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              subTab === 'income'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>バイト代振込予定</span>
            {unconfirmedIncomes.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] tabular-nums">
                未振込 {unconfirmedIncomes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. 立替金・請求予定セクション（全項目編集可能） */}
      {/* ========================================================= */}
      {subTab === 'reimbursement' && (
        <div className="space-y-4">
          {/* ヒーローサマリー ＆ 5区分別残高 */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400">
                  現在立て替えている未回収・請求予定の合計
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums mt-1">
                  ¥{totalUnsettledReimbursement.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleOpenAddReimburse}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>立替・請求を追加</span>
              </button>
            </div>

            {/* 5区分（友達・大学・会社・彼女・家族）別クイックフィルタ＆残高 */}
            <div className="pt-4">
              <p className="text-[11px] font-bold text-slate-400 mb-2.5">
                区分別 未回収額（タップで絞り込み）
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <button
                  onClick={() => setReimburseFilterTarget('ALL')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reimburseFilterTarget === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[11px] font-bold opacity-80">すべて表示</p>
                  <p className="text-xs sm:text-sm font-extrabold tabular-nums mt-0.5">
                    ¥{totalUnsettledReimbursement.toLocaleString()}
                  </p>
                </button>

                {TARGET_LIST.map((t) => {
                  const Icon = targetIcons[t];
                  const isSelected = reimburseFilterTarget === t;
                  const amt = unsettledByTarget[t];
                  return (
                    <button
                      key={t}
                      onClick={() =>
                        setReimburseFilterTarget(isSelected ? 'ALL' : t)
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <Icon className="w-3 h-3 shrink-0" />
                        <span>{t}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-extrabold tabular-nums mt-0.5">
                        ¥{amt.toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ステータス絞り込み＆一覧 */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  立替・請求リスト
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
                  {filteredReimbursements.length}件
                </span>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setReimburseStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    reimburseStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setReimburseStatusFilter('unsettled')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    reimburseStatusFilter === 'unsettled'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  未回収のみ
                </button>
                <button
                  onClick={() => setReimburseStatusFilter('settled')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    reimburseStatusFilter === 'settled'
                      ? 'bg-white text-slate-700 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  精算済
                </button>
              </div>
            </div>

            {filteredReimbursements.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <HandCoins className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">該当する立替記録はありません</p>
                <p className="text-xs mt-1 text-slate-400">
                  登録した立替金額や内容は、後からいつでも「編集」ボタンまたは行タップで変更できます
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2">
                {filteredReimbursements.map((r) => {
                  const Icon = targetIcons[r.target] || Users;
                  const colorClass =
                    targetColors[r.target] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleOpenEditReimburse(r)}
                      className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/90 px-2.5 rounded-2xl transition-colors cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border flex items-center gap-1 ${colorClass}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{r.target}</span>
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {r.person_or_purpose}
                          </span>
                          {r.is_settled ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">
                              精算済
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-600 border border-rose-200/60">
                              未回収
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 tabular-nums">
                          <span>立替日: {r.date}</span>
                          {r.due_date && (
                            <span className="text-indigo-600 font-semibold">
                              請求・回収予定: {r.due_date}
                            </span>
                          )}
                          {r.memo && <span className="text-slate-600">・{r.memo}</span>}
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`text-base sm:text-lg font-extrabold tabular-nums ${
                            r.is_settled ? 'text-slate-400 line-through' : 'text-rose-600'
                          }`}
                        >
                          ¥{r.amount.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditReimburse(r)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1 transition-colors"
                            title="金額・内容を編集"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>編集</span>
                          </button>

                          <button
                            onClick={() => onToggleSettleReimbursement(r.id, !r.is_settled)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                              r.is_settled
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{r.is_settled ? '未回収に戻す' : '精算完了'}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('この立替記録を削除しますか？')) {
                                onDeleteReimbursement(r.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
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
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. バイト代振込予定セクション（全項目編集＆照合対応） */}
      {/* ========================================================= */}
      {subTab === 'income' && (
        <div className="space-y-4">
          {/* サマリーカード */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400">
                今後振り込まれる予定の未確認合計額
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tabular-nums mt-1">
                ¥{totalUnconfirmedIncome.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                登録後の予定金額変更や、実際の振込額との照合・家計簿への反映が可能です
              </p>
            </div>
            <button
              onClick={handleOpenAddIncome}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 shrink-0 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>振込予定を追加</span>
            </button>
          </div>

          {/* 振込予定リスト */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">バイト代振込予定一覧</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
                  {filteredExpectedIncomes.length}件
                </span>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setIncomeStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    incomeStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setIncomeStatusFilter('unconfirmed')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    incomeStatusFilter === 'unconfirmed'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  入金待ち
                </button>
                <button
                  onClick={() => setIncomeStatusFilter('confirmed')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    incomeStatusFilter === 'confirmed'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  確認済
                </button>
              </div>
            </div>

            {filteredExpectedIncomes.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Coins className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">該当する振込予定はありません</p>
                <p className="text-xs mt-1 text-slate-400">
                  「振込予定を追加」から勤務時間や見込み給与額を記録しておきましょう
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2">
                {filteredExpectedIncomes.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenEditIncome(item)}
                    className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/90 px-2.5 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {item.employer_name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            item.is_confirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          }`}
                        >
                          {item.is_confirmed ? '振込確認済' : '入金待ち'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 tabular-nums">
                        <span className="font-semibold text-slate-700">
                          振込予定日: {item.expected_pay_date}
                        </span>
                        {item.work_period && <span>勤務: {item.work_period}</span>}
                        {item.memo && <span className="text-slate-500">・{item.memo}</span>}
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-base sm:text-lg font-extrabold text-indigo-600 tabular-nums">
                        ¥{item.expected_amount.toLocaleString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditIncome(item)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="予定金額・内容を編集"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>編集</span>
                        </button>

                        {!item.is_confirmed ? (
                          <button
                            onClick={() => handleOpenConfirmDialog(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>振込を確認</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleConfirmIncome(item.id, false)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                          >
                            未確認に戻す
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm('この振込予定を削除しますか？')) {
                              onDeleteExpectedIncome(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
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
        </div>
      )}

      {/* ========================================================= */}
      {/* 振込予定 登録・編集モーダル */}
      {/* ========================================================= */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingIncomeId ? '振込予定の編集・変更' : '振込予定の登録'}
                </h3>
                <p className="text-xs text-slate-400">
                  予定金額や振込日、勤務メモをいつでも変更できます
                </p>
              </div>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIncome} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">バイト先</label>
                {employers.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {employers.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployerId(emp.id);
                          setCustomEmployerName(emp.name);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold border text-left truncate transition-all ${
                          selectedEmployerId === emp.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {emp.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedEmployerId('custom')}
                      className={`p-2 rounded-xl text-xs font-bold border text-left truncate transition-all ${
                        selectedEmployerId === 'custom'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ＋ 直接入力・その他
                    </button>
                  </div>
                )}

                {(selectedEmployerId === 'custom' || employers.length === 0) && (
                  <input
                    type="text"
                    required
                    placeholder="バイト先名を入力（例: ○○塾、単発バイト）"
                    value={customEmployerName}
                    onChange={(e) => setCustomEmployerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">予定金額 (円)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ¥
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">振込予定日</label>
                <input
                  type="date"
                  required
                  value={expectedPayDate}
                  onChange={(e) => setExpectedPayDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  勤務期間・時間メモ (任意)
                </label>
                <input
                  type="text"
                  placeholder="例: 10月分 40時間、コマ数20回 など"
                  value={workPeriod}
                  onChange={(e) => setWorkPeriod(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">備考 (任意)</label>
                <input
                  type="text"
                  placeholder="交通費込み、深夜手当含む など"
                  value={incomeMemo}
                  onChange={(e) => setIncomeMemo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {editingIncomeId && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incomeIsConfirmed}
                      onChange={(e) => setIncomeIsConfirmed(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>振込確認済としてマークする</span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : editingIncomeId ? '変更を保存' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 振込確認 ＆ 金額照合ダイアログ */}
      {/* ========================================================= */}
      {confirmingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
              振込金額の照合・確認
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              実際の振込額が予定額と異なる場合は、ここで金額を修正してから確定できます。
            </p>

            <form onSubmit={handleExecuteConfirmIncome} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-slate-400 font-bold">対象バイト先:</span>{' '}
                <strong className="text-slate-900 font-extrabold">
                  {confirmingIncome.employer_name}
                </strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  実際の振込金額 (円)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ¥
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={confirmActualAmount}
                    onChange={(e) => setConfirmActualAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">実際の振込日</label>
                <input
                  type="date"
                  required
                  value={confirmActualDate}
                  onChange={(e) => setConfirmActualDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tabular-nums"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRegisterToBudget}
                  onChange={(e) => setAutoRegisterToBudget(e.target.checked)}
                  className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div className="text-xs">
                  <p className="font-extrabold text-emerald-900">
                    家計簿の「収入（バイト代）」にも自動記帳する
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    チェックを入れると、月別収支および年間バイト代集計に即座に加算されます
                  </p>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingIncome(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>確定する</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 立替金 登録・編集モーダル */}
      {/* ========================================================= */}
      {isReimburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingReimburseId ? '立替金・請求予定の編集' : '立替金・請求予定の登録'}
                </h3>
                <p className="text-xs text-slate-400">
                  金額・相手の名前・日付などすべての項目を変更できます
                </p>
              </div>
              <button
                onClick={() => setIsReimburseModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReimbursement} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  立替対象区分
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {TARGET_LIST.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTarget(t)}
                      className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                        target === t
                          ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  相手の名前・用途
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: ○○くん飲み会代、研究室の備品、旅行宿代 など"
                  value={personOrPurpose}
                  onChange={(e) => setPersonOrPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  立替・請求金額 (円)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ¥
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={reimburseAmount}
                    onChange={(e) => setReimburseAmount(e.target.value)}
                    placeholder="3000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">立替日</label>
                  <input
                    type="date"
                    required
                    value={reimburseDate}
                    onChange={(e) => setReimburseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    回収予定日 (任意)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">メモ (任意)</label>
                <input
                  type="text"
                  placeholder="PayPay送金待ち、領収書提出済み など"
                  value={reimburseMemo}
                  onChange={(e) => setReimburseMemo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {editingReimburseId && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reimburseIsSettled}
                      onChange={(e) => setReimburseIsSettled(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>精算完了（回収済）としてマークする</span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReimburseModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : editingReimburseId ? '変更を保存' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

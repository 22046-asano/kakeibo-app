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
  ArrowUpRight,
  ArrowDownRight,
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
const PAYABLE_PREFIX = '[PAYABLE]::';

function isPayableRecord(r: Reimbursement): boolean {
  return r.person_or_purpose.startsWith(PAYABLE_PREFIX);
}

function getCleanPurpose(r: Reimbursement): string {
  return r.person_or_purpose.startsWith(PAYABLE_PREFIX)
    ? r.person_or_purpose.slice(PAYABLE_PREFIX.length)
    : r.person_or_purpose;
}

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
  const [subTab, setSubTab] = useState<'receivable' | 'payable' | 'income'>('receivable');

  // フィルタ管理
  const [reimburseFilterTarget, setReimburseFilterTarget] = useState<ReimbursementTarget | 'ALL'>('ALL');
  const [reimburseStatusFilter, setReimburseStatusFilter] = useState<'all' | 'unsettled' | 'settled'>('all');
  const [incomeStatusFilter, setIncomeStatusFilter] = useState<'all' | 'unconfirmed' | 'confirmed'>('all');

  // モーダル管理（新規・編集兼用）
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);

  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [editingReimburseId, setEditingReimburseId] = useState<string | null>(null);
  const [modalDirection, setModalDirection] = useState<'receivable' | 'payable'>('receivable');

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

  // 立替金・支払予定フォームステート
  const [target, setTarget] = useState<ReimbursementTarget>('友達');
  const [personOrPurpose, setPersonOrPurpose] = useState('');
  const [reimburseAmount, setReimburseAmount] = useState('');
  const [reimburseDate, setReimburseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [reimburseMemo, setReimburseMemo] = useState('');
  const [reimburseIsSettled, setReimburseIsSettled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 振込予定の集計
  const unconfirmedIncomes = expectedIncomes.filter((i) => !i.is_confirmed);
  const totalUnconfirmedIncome = unconfirmedIncomes.reduce((sum, i) => sum + i.expected_amount, 0);

  // 2. 立替金（もらう予定）と 支払予定（自分が払う予定）の分離集計
  const receivableList = reimbursements.filter((r) => !isPayableRecord(r));
  const payableList = reimbursements.filter((r) => isPayableRecord(r));

  const unsettledReceivables = receivableList.filter((r) => !r.is_settled);
  const totalUnsettledReceivable = unsettledReceivables.reduce((sum, r) => sum + r.amount, 0);

  const unsettledPayables = payableList.filter((r) => !r.is_settled);
  const totalUnsettledPayable = unsettledPayables.reduce((sum, r) => sum + r.amount, 0);

  const netReimburseBalance = totalUnsettledReceivable - totalUnsettledPayable;

  // 現在開いているタブ（receivable または payable）に応じた対象リスト
  const activeDirectionList = subTab === 'payable' ? payableList : receivableList;
  const activeUnsettledList = subTab === 'payable' ? unsettledPayables : unsettledReceivables;
  const activeTotalUnsettled =
    subTab === 'payable' ? totalUnsettledPayable : totalUnsettledReceivable;

  // 区分ごとの未精算合計
  const unsettledByTarget = TARGET_LIST.reduce<Record<ReimbursementTarget, number>>(
    (acc, t) => {
      acc[t] = activeUnsettledList
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

  // --- 振込予定モーダル操作 ---
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

  // --- 立替金・支払予定モーダル操作（新規 ＆ 編集） ---
  const handleOpenAddReimburse = (dir: 'receivable' | 'payable') => {
    setEditingReimburseId(null);
    setModalDirection(dir);
    setTarget(reimburseFilterTarget !== 'ALL' ? reimburseFilterTarget : '友達');
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
    setModalDirection(isPayableRecord(r) ? 'payable' : 'receivable');
    setTarget(r.target);
    setPersonOrPurpose(getCleanPurpose(r));
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
    const cleanText = personOrPurpose.trim();
    if (isNaN(amt) || amt <= 0 || !cleanText) {
      alert('金額と相手・用途を入力してください');
      return;
    }

    const encodedPurpose =
      modalDirection === 'payable' ? `${PAYABLE_PREFIX}${cleanText}` : cleanText;

    const payload: Omit<Reimbursement, 'id'> = {
      target,
      person_or_purpose: encodedPurpose,
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
      alert('データの保存に失敗しました');
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

  const filteredReimbursements = activeDirectionList.filter((r) => {
    if (reimburseFilterTarget !== 'ALL' && r.target !== reimburseFilterTarget) return false;
    if (reimburseStatusFilter === 'unsettled' && r.is_settled) return false;
    if (reimburseStatusFilter === 'settled' && !r.is_settled) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* 上部：3サブタブ切り替え ＆ 立替・未払バランスサマリー */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-orange-500" />
              <span>立替金（もらう）・支払予定（払う）・バイト代振込予定</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              すべての項目は登録後にいつでも編集・変更できます（家計簿の収支計算とは独立）
            </p>
          </div>

          {/* もらう予定 vs 払う予定の差額ミニバッジ */}
          <div className="flex items-center gap-3 bg-orange-50/60 px-3.5 py-2 rounded-2xl border border-orange-200/60 text-xs tabular-nums shrink-0">
            <div>
              <span className="text-slate-500 font-bold">もらう: </span>
              <strong className="text-emerald-600 font-extrabold">
                +¥{totalUnsettledReceivable.toLocaleString()}
              </strong>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span className="text-slate-500 font-bold">払う: </span>
              <strong className="text-rose-600 font-extrabold">
                -¥{totalUnsettledPayable.toLocaleString()}
              </strong>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span className="text-slate-500 font-bold">差引: </span>
              <strong
                className={`font-extrabold ${
                  netReimburseBalance >= 0 ? 'text-sky-600' : 'text-rose-600'
                }`}
              >
                {netReimburseBalance >= 0 ? '+' : ''}¥{netReimburseBalance.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* 3つのサブタブ */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setSubTab('receivable')}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'receivable'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span className="truncate">立替・請求 (もらう)</span>
            {unsettledReceivables.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums shrink-0">
                {unsettledReceivables.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('payable')}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'payable'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 shrink-0" />
            <span className="truncate">支払・返済 (払う)</span>
            {unsettledPayables.length > 0 && (
              <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums shrink-0">
                {unsettledPayables.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('income')}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'income'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span className="truncate">バイト代振込予定</span>
            {unconfirmedIncomes.length > 0 && (
              <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums shrink-0">
                {unconfirmedIncomes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1 & 2. 立替金（もらう） または 支払予定（自分が払う）セクション */}
      {/* ========================================================= */}
      {(subTab === 'receivable' || subTab === 'payable') && (
        <div className="space-y-4">
          {/* ヒーローサマリー ＆ 5区分別残高 */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400">
                  {subTab === 'receivable'
                    ? '現在自分が立て替えていて、相手から回収する未回収合計'
                    : '現在自分が誰かに払わなくてはいけない未払・返済予定の合計'}
                </span>
                <p
                  className={`text-2xl sm:text-3xl font-extrabold tabular-nums mt-1 ${
                    subTab === 'receivable' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ¥{activeTotalUnsettled.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleOpenAddReimburse(subTab)}
                className={`${
                  subTab === 'receivable'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                } text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0`}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {subTab === 'receivable'
                    ? '立替・請求（もらう）を追加'
                    : '支払・返済（払う）を追加'}
                </span>
              </button>
            </div>

            {/* 5区分（友達・大学・会社・彼女・家族）別クイックフィルタ＆残高 */}
            <div className="pt-4">
              <p className="text-[11px] font-bold text-slate-400 mb-2.5">
                相手区分別 {subTab === 'receivable' ? '未回収額' : '未払額'}（タップで絞り込み）
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <button
                  onClick={() => setReimburseFilterTarget('ALL')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reimburseFilterTarget === 'ALL'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[11px] font-bold opacity-80">すべて表示</p>
                  <p className="text-xs sm:text-sm font-extrabold tabular-nums mt-0.5">
                    ¥{activeTotalUnsettled.toLocaleString()}
                  </p>
                </button>

                {TARGET_LIST.map((t) => {
                  const Icon = targetIcons[t];
                  const isSelected = reimburseFilterTarget === t;
                  const amt = unsettledByTarget[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setReimburseFilterTarget(isSelected ? 'ALL' : t)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? subTab === 'receivable'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-rose-600 text-white border-rose-600 shadow-sm'
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
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-800">
                  {subTab === 'receivable'
                    ? '立替・請求リスト（相手からもらうお金）'
                    : '支払・返済リスト（自分が払うお金）'}
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
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {subTab === 'receivable' ? '未回収のみ' : '未払のみ'}
                </button>
                <button
                  onClick={() => setReimburseStatusFilter('settled')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    reimburseStatusFilter === 'settled'
                      ? 'bg-white text-slate-700 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {subTab === 'receivable' ? '回収済' : '支払済'}
                </button>
              </div>
            </div>

            {filteredReimbursements.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <HandCoins className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">
                  {subTab === 'receivable'
                    ? '該当する立替記録はありません'
                    : '該当する支払・返済予定はありません'}
                </p>
                <p className="text-xs mt-1 text-slate-400">
                  {subTab === 'receivable'
                    ? '立て替えた金額を登録しておくと、回収漏れを防げます'
                    : '友達や大学・家族などに払わなくてはいけない金額を記録しておけます'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2">
                {filteredReimbursements.map((r) => {
                  const Icon = targetIcons[r.target] || Users;
                  const colorClass =
                    targetColors[r.target] || 'bg-slate-50 text-slate-700 border-slate-200';
                  const cleanPurpose = getCleanPurpose(r);
                  const isPayable = isPayableRecord(r);

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleOpenEditReimburse(r)}
                      className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-orange-50/30 px-2.5 rounded-2xl transition-colors cursor-pointer"
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
                            {cleanPurpose}
                          </span>
                          {r.is_settled ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">
                              {isPayable ? '支払済' : '回収済'}
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                isPayable
                                  ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              }`}
                            >
                              {isPayable ? '未払（要支払）' : '未回収（請求中）'}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 tabular-nums">
                          <span>発生日: {r.date}</span>
                          {r.due_date && (
                            <span className="text-orange-600 font-bold">
                              {isPayable ? '支払期限' : '回収予定'}: {r.due_date}
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
                            r.is_settled
                              ? 'text-slate-400 line-through'
                              : isPayable
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {isPayable ? '-' : '+'}¥{r.amount.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditReimburse(r)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 text-xs font-bold flex items-center gap-1 transition-colors"
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
                                : isPayable
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {r.is_settled
                                ? isPayable
                                  ? '未払に戻す'
                                  : '未回収に戻す'
                                : isPayable
                                ? '支払完了'
                                : '回収完了'}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('この記録を削除しますか？')) {
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
      {/* 3. バイト代振込予定セクション */}
      {/* ========================================================= */}
      {subTab === 'income' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400">
                今後振り込まれる予定の未確認合計額
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-orange-600 tabular-nums mt-1">
                ¥{totalUnconfirmedIncome.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                登録後の予定金額変更や、実際の振込額との照合・家計簿への反映が可能です
              </p>
            </div>
            <button
              onClick={handleOpenAddIncome}
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 shrink-0 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>振込予定を追加</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-800">バイト代振込予定一覧</h3>
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
                      ? 'bg-white text-orange-600 shadow-sm'
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
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2">
                {filteredExpectedIncomes.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenEditIncome(item)}
                    className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-orange-50/30 px-2.5 rounded-2xl transition-colors cursor-pointer"
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
                      <span className="text-base sm:text-lg font-extrabold text-orange-600 tabular-nums">
                        ¥{item.expected_amount.toLocaleString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditIncome(item)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 text-xs font-bold flex items-center gap-1 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-sm">
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
                            ? 'bg-orange-500 text-white border-orange-500'
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
                          ? 'bg-orange-500 text-white border-orange-500'
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
                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4"
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
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
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
      {/* 立替金（もらう） ＆ 支払予定（払う） 登録・編集モーダル */}
      {/* ========================================================= */}
      {isReimburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingReimburseId
                    ? '立替・支払予定の編集'
                    : modalDirection === 'receivable'
                    ? '立替・請求予定（もらう）の登録'
                    : '支払・返済予定（払う）の登録'}
                </h3>
                <p className="text-xs text-slate-400">
                  種別（もらう／払う）・金額・相手・日付などすべて変更可能です
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
              {/* もらう（立替） / 払う（支払予定） 切替トグル */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setModalDirection('receivable')}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                    modalDirection === 'receivable'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  立替・請求（もらう）
                </button>
                <button
                  type="button"
                  onClick={() => setModalDirection('payable')}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                    modalDirection === 'payable'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  支払・返済（自分が払う）
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  相手の区分
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {TARGET_LIST.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTarget(t)}
                      className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                        target === t
                          ? modalDirection === 'receivable'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-rose-600 border-rose-600 text-white shadow-sm'
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
                  {modalDirection === 'receivable'
                    ? '相手の名前・立て替えた用途'
                    : '支払う相手の名前・支払う内容'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    modalDirection === 'receivable'
                      ? '例: ○○くん飲み会代、研究室の備品 など'
                      : '例: ○○くんに割り勘代を払う、サークル集金、親に返済 など'
                  }
                  value={personOrPurpose}
                  onChange={(e) => setPersonOrPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalDirection === 'receivable' ? '請求金額 (円)' : '支払わなくてはいけない金額 (円)'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">発生日</label>
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
                    {modalDirection === 'receivable' ? '回収予定日 (任意)' : '支払期限・予定日 (任意)'}
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
                  placeholder="PayPayで送る、次回会った時に渡す など"
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
                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4"
                    />
                    <span>
                      {modalDirection === 'receivable'
                        ? '回収完了（精算済）としてマークする'
                        : '支払完了（精算済）としてマークする'}
                    </span>
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
                  className={`flex-1 py-3 text-white font-extrabold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 ${
                    modalDirection === 'receivable'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
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

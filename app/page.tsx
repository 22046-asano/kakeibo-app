'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  Transaction,
  TransactionInsert,
  CreditCard,
  Employer,
  ExpectedIncome,
  Reimbursement,
} from '@/types';
import { calculateBillingDate } from '@/lib/creditCardUtils';
import { Header, NavTab } from '@/components/Header';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCards } from '@/components/SummaryCards';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { CalendarView } from '@/components/CalendarView';
import { YearlyView } from '@/components/YearlyView';
import { CreditCardManager } from '@/components/CreditCardManager';
import { EmployerManager } from '@/components/EmployerManager';
import { AdvancePaymentTracker } from '@/components/AdvancePaymentTracker';
import { AuthGate } from '@/components/AuthGate';

// クレジットカード決済は引き落とし月、その他は利用日基準
const getEffectiveDate = (t: Transaction): string => {
  if (t.type === 'expense' && t.payment_method === 'クレジットカード' && t.billing_date) {
    return t.billing_date;
  }
  return t.date;
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dashboardViewMode, setDashboardViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // データステート
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [expectedIncomes, setExpectedIncomes] = useState<ExpectedIncome[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialModalDate, setInitialModalDate] = useState<string | null>(null);

  // 認証状態の監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 月の日付範囲（月初〜月末）
  const getMonthDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const mStr = String(month + 1).padStart(2, '0');
    const startDate = `${year}-${mStr}-01`;
    const endDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  };

  // 1. クレジットカード取得
  const fetchCards = useCallback(async () => {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      setCards(data as CreditCard[]);
    }
  }, []);

  // 2. バイト先取得
  const fetchEmployers = useCallback(async () => {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      setEmployers(data as Employer[]);
    }
  }, []);

  // 3. 振込予定取得
  const fetchExpectedIncomes = useCallback(async () => {
    const { data, error } = await supabase
      .from('expected_incomes')
      .select('*')
      .order('expected_pay_date', { ascending: true });
    if (!error && data) {
      setExpectedIncomes(data as ExpectedIncome[]);
    }
  }, []);

  // 4. 立替金取得
  const fetchReimbursements = useCallback(async () => {
    const { data, error } = await supabase
      .from('reimbursements')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) {
      setReimbursements(data as Reimbursement[]);
    }
  }, []);

  // 5. 取引データ取得
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAllTransactions(data as Transaction[]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    if (!session) return;
    // ログイン前に作成されていた既存データがあれば自分のアカウントに自動紐付け
    await supabase.rpc('claim_unowned_records').then(() => {});
    await Promise.all([
      fetchCards(),
      fetchEmployers(),
      fetchExpectedIncomes(),
      fetchReimbursements(),
      fetchTransactions(),
    ]);
  }, [
    session,
    fetchCards,
    fetchEmployers,
    fetchExpectedIncomes,
    fetchReimbursements,
    fetchTransactions,
  ]);

  useEffect(() => {
    if (session) {
      refreshAllData();
    } else {
      setAllTransactions([]);
      setCards([]);
      setEmployers([]);
      setExpectedIncomes([]);
      setReimbursements([]);
    }
  }, [session, refreshAllData]);

  // Realtime 監視（ログイン中のみ）
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('kakeibo-realtime-v6')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards' }, () => fetchCards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employers' }, () => fetchEmployers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expected_incomes' }, () => fetchExpectedIncomes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reimbursements' }, () => fetchReimbursements())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchTransactions, fetchCards, fetchEmployers, fetchExpectedIncomes, fetchReimbursements]);

  // ログアウト処理
  const handleSignOut = async () => {
    if (confirm('ログアウトしますか？')) {
      await supabase.auth.signOut();
    }
  };

  // 表示中の月の取引（カード決済は引き落とし月、現金等は利用月）
  const { startDate, endDate } = getMonthDateRange(currentDate);
  const monthlyTransactions = allTransactions.filter((t) => {
    const effectiveDate = getEffectiveDate(t);
    return effectiveDate >= startDate && effectiveDate <= endDate;
  });

  const handleChangeMonth = (offset: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
    setSelectedCategory(null);
  };

  const handleResetToday = () => {
    setCurrentDate(new Date());
    setSelectedCategory(null);
  };

  // --- 収支登録・更新・削除 ---
  const handleSubmitTransaction = async (data: TransactionInsert, id?: string) => {
    if (id) {
      const { error } = await supabase.from('transactions').update(data).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('transactions').insert([data]);
      if (error) throw error;
    }
    await fetchTransactions();
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      await fetchTransactions();
    }
  };

  // --- クレジットカード CRUD & 既存明細の引落日再計算 ---
  const handleAddCard = async (newCard: Omit<CreditCard, 'id'>) => {
    const { error } = await supabase.from('credit_cards').insert([newCard]);
    if (error) throw error;
    await fetchCards();
  };

  const handleUpdateCard = async (
    id: string,
    cardData: Omit<CreditCard, 'id'>,
    recalculateExisting: boolean = true
  ) => {
    const { error } = await supabase.from('credit_cards').update(cardData).eq('id', id);
    if (error) throw error;
    const updatedCardObj: CreditCard = { ...cardData, id };
    await fetchCards();

    if (recalculateExisting) {
      const targetTxs = allTransactions.filter((t) => t.credit_card_id === id);
      for (const tx of targetTxs) {
        const newBillingDate = calculateBillingDate(tx.date, updatedCardObj);
        if (newBillingDate !== tx.billing_date) {
          await supabase
            .from('transactions')
            .update({ billing_date: newBillingDate })
            .eq('id', tx.id);
        }
      }
      await fetchTransactions();
    }
  };

  const handleDeleteCard = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (!error) {
      await fetchCards();
    }
  };

  // --- バイト先 CRUD & 名称同期 ---
  const handleAddEmployer = async (emp: Omit<Employer, 'id'>) => {
    const { error } = await supabase.from('employers').insert([emp]);
    if (error) throw error;
    await fetchEmployers();
  };

  const handleUpdateEmployer = async (id: string, emp: Omit<Employer, 'id'>) => {
    const { error } = await supabase.from('employers').update(emp).eq('id', id);
    if (error) throw error;
    await fetchEmployers();

    await supabase
      .from('transactions')
      .update({ employer_name: emp.name })
      .eq('employer_id', id);
    await supabase
      .from('expected_incomes')
      .update({ employer_name: emp.name })
      .eq('employer_id', id);

    await fetchTransactions();
    await fetchExpectedIncomes();
  };

  const handleDeleteEmployer = async (id: string) => {
    const { error } = await supabase.from('employers').delete().eq('id', id);
    if (!error) {
      await fetchEmployers();
    }
  };

  // --- 振込予定 CRUD ---
  const handleAddExpectedIncome = async (item: Omit<ExpectedIncome, 'id'>) => {
    const { error } = await supabase.from('expected_incomes').insert([item]);
    if (error) throw error;
    await fetchExpectedIncomes();
  };

  const handleUpdateExpectedIncome = async (id: string, item: Omit<ExpectedIncome, 'id'>) => {
    const { error } = await supabase.from('expected_incomes').update(item).eq('id', id);
    if (error) throw error;
    await fetchExpectedIncomes();
  };

  const handleToggleConfirmIncome = async (id: string, isConfirmed: boolean) => {
    const { error } = await supabase
      .from('expected_incomes')
      .update({ is_confirmed: isConfirmed })
      .eq('id', id);
    if (!error) {
      await fetchExpectedIncomes();
    }
  };

  const handleDeleteExpectedIncome = async (id: string) => {
    const { error } = await supabase.from('expected_incomes').delete().eq('id', id);
    if (!error) {
      await fetchExpectedIncomes();
    }
  };

  const handleRegisterIncomeToTransaction = async (income: ExpectedIncome) => {
    await handleSubmitTransaction({
      date: income.expected_pay_date,
      type: 'income',
      category: 'バイト代',
      amount: income.expected_amount,
      payment_method: '銀行口座',
      employer_id: income.employer_id,
      employer_name: income.employer_name,
      memo: income.memo || (income.work_period ? `勤務: ${income.work_period}` : ''),
    });
  };

  // --- 立替金 CRUD ---
  const handleAddReimbursement = async (item: Omit<Reimbursement, 'id'>) => {
    const { error } = await supabase.from('reimbursements').insert([item]);
    if (error) throw error;
    await fetchReimbursements();
  };

  const handleUpdateReimbursement = async (id: string, item: Omit<Reimbursement, 'id'>) => {
    const { error } = await supabase.from('reimbursements').update(item).eq('id', id);
    if (error) throw error;
    await fetchReimbursements();
  };

  const handleToggleSettleReimbursement = async (id: string, isSettled: boolean) => {
    const { error } = await supabase
      .from('reimbursements')
      .update({ is_settled: isSettled })
      .eq('id', id);
    if (!error) {
      await fetchReimbursements();
    }
  };

  const handleDeleteReimbursement = async (id: string) => {
    const { error } = await supabase.from('reimbursements').delete().eq('id', id);
    if (!error) {
      await fetchReimbursements();
    }
  };

  // モーダルオープン制御
  const handleOpenCreateModal = (dateStr?: string) => {
    setEditingTransaction(null);
    setInitialModalDate(dateStr || null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setInitialModalDate(null);
    setIsModalOpen(true);
  };

  // 認証チェック中ローディング表示
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">セキュリティ認証を確認中...</p>
        </div>
      </div>
    );
  }

  // 未ログイン時はログイン・アカウント登録画面を表示（データは一切取得・表示しない）
  if (!session) {
    return <AuthGate onAuthenticated={() => {}} />;
  }

  const pendingTrackerCount =
    reimbursements.filter((r) => !r.is_settled).length +
    expectedIncomes.filter((i) => !i.is_confirmed).length;

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isSynced={true}
        onRefresh={refreshAllData}
        onOpenCreateModal={() => handleOpenCreateModal()}
        unconfirmedCount={pendingTrackerCount}
        userEmail={session.user.email}
        onSignOut={handleSignOut}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* 1. 家計簿ダッシュボード */}
        {activeTab === 'dashboard' && (
          <div>
            <MonthSelector
              currentDate={currentDate}
              onChangeMonth={handleChangeMonth}
              onResetToday={handleResetToday}
              viewMode={dashboardViewMode}
              onChangeViewMode={setDashboardViewMode}
            />

            <SummaryCards transactions={monthlyTransactions} />

            {dashboardViewMode === 'list' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-5">
                  <CategoryBreakdown
                    transactions={monthlyTransactions}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                </div>
                <div className="lg:col-span-7">
                  <TransactionList
                    transactions={monthlyTransactions}
                    cards={cards}
                    selectedCategory={selectedCategory}
                    onClearCategory={() => setSelectedCategory(null)}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteTransaction}
                    onOpenCreate={() => handleOpenCreateModal()}
                  />
                </div>
              </div>
            ) : (
              <CalendarView
                currentDate={currentDate}
                transactions={allTransactions}
                cards={cards}
                onChangeMonth={handleChangeMonth}
                onResetToday={handleResetToday}
                onSelectTransaction={handleOpenEditModal}
                onDeleteTransaction={handleDeleteTransaction}
                onAddTransactionForDate={(d) => handleOpenCreateModal(d)}
              />
            )}
          </div>
        )}

        {/* 2. 振込予定 ＆ 立替金管理タブ */}
        {activeTab === 'tracker' && (
          <AdvancePaymentTracker
            expectedIncomes={expectedIncomes}
            reimbursements={reimbursements}
            employers={employers}
            onAddExpectedIncome={handleAddExpectedIncome}
            onUpdateExpectedIncome={handleUpdateExpectedIncome}
            onToggleConfirmIncome={handleToggleConfirmIncome}
            onDeleteExpectedIncome={handleDeleteExpectedIncome}
            onRegisterIncomeToTransaction={handleRegisterIncomeToTransaction}
            onAddReimbursement={handleAddReimbursement}
            onUpdateReimbursement={handleUpdateReimbursement}
            onToggleSettleReimbursement={handleToggleSettleReimbursement}
            onDeleteReimbursement={handleDeleteReimbursement}
          />
        )}

        {/* 3. 年間・バイト代タブ */}
        {activeTab === 'yearly' && (
          <YearlyView
            transactions={allTransactions}
            employers={employers}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* 4. カード・バイト先設定タブ */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <CreditCardManager
              cards={cards}
              transactions={allTransactions}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onEditTransaction={handleOpenEditModal}
            />

            <EmployerManager
              employers={employers}
              onAddEmployer={handleAddEmployer}
              onUpdateEmployer={handleUpdateEmployer}
              onDeleteEmployer={handleDeleteEmployer}
            />
          </div>
        )}
      </main>

      {/* PC・タブレット用 フローティング記帳ボタン */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <button
          onClick={() => handleOpenCreateModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold px-6 py-4 rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5px]" />
          <span>収支を記帳</span>
        </button>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitTransaction}
        onDelete={handleDeleteTransaction}
        editingTransaction={editingTransaction}
        initialDate={initialModalDate}
        cards={cards}
        employers={employers}
      />
    </div>
  );
}

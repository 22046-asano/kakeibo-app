'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, List, Calendar as CalendarIcon, Sliders, Building2, CreditCard as CardIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  Transaction, 
  TransactionInsert, 
  CreditCard, 
  Employer, 
  ExpectedIncome, 
  Reimbursement 
} from '@/types';
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

// クレジットカード決済は引き落とし月、その他は利用日基準
const getEffectiveDate = (t: Transaction): string => {
  if (t.type === 'expense' && t.payment_method === 'クレジットカード' && t.billing_date) {
    return t.billing_date;
  }
  return t.date;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dashboardViewMode, setDashboardViewMode] = useState<'list' | 'calendar'>('list');

  // データステート
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [expectedIncomes, setExpectedIncomes] = useState<ExpectedIncome[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 月の日付範囲（月初〜月末）
  const getMonthDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  // 1. クレジットカード取得
  const fetchCards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Cards fetch fallback:', error.message);
        const local = localStorage.getItem('kakeibo_cards');
        if (local) {
          setCards(JSON.parse(local));
        } else {
          const initialCards: CreditCard[] = [
            {
              id: 'card-rakuten',
              name: '楽天カード',
              closing_day: 0,
              payment_month_offset: 1,
              payment_day: 27,
              holiday_rule: 'next_business_day',
              color: '#dc2626',
            },
            {
              id: 'card-smbc',
              name: '三井住友カード(10日払)',
              closing_day: 15,
              payment_month_offset: 1,
              payment_day: 10,
              holiday_rule: 'next_business_day',
              color: '#16a34a',
            },
          ];
          setCards(initialCards);
          localStorage.setItem('kakeibo_cards', JSON.stringify(initialCards));
        }
      } else if (data) {
        setCards(data as CreditCard[]);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 2. バイト先取得
  const fetchEmployers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Employers fetch fallback:', error.message);
        const local = localStorage.getItem('kakeibo_employers');
        if (local) {
          setEmployers(JSON.parse(local));
        } else {
          const initialEmp: Employer[] = [
            { id: 'emp-1', name: '個別指導塾', hourly_wage: 1500, payday_memo: '毎月25日振込', color: '#4f46e5' },
            { id: 'emp-2', name: 'カフェ', hourly_wage: 1150, payday_memo: '毎月10日振込', color: '#0891b2' },
          ];
          setEmployers(initialEmp);
          localStorage.setItem('kakeibo_employers', JSON.stringify(initialEmp));
        }
      } else if (data) {
        setEmployers(data as Employer[]);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 3. 振込予定取得
  const fetchExpectedIncomes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('expected_incomes')
        .select('*')
        .order('expected_pay_date', { ascending: true });

      if (error) {
        console.warn('Expected incomes fallback:', error.message);
        const local = localStorage.getItem('kakeibo_expected_incomes');
        if (local) setExpectedIncomes(JSON.parse(local));
      } else if (data) {
        setExpectedIncomes(data as ExpectedIncome[]);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 4. 立替金取得
  const fetchReimbursements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reimbursements')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('Reimbursements fallback:', error.message);
        const local = localStorage.getItem('kakeibo_reimbursements');
        if (local) setReimbursements(JSON.parse(local));
      } else if (data) {
        setReimbursements(data as Reimbursement[]);
      }
    } catch (err) {
      console.error(err);
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

      if (error) {
        console.warn('Transactions fallback:', error.message);
        const localData = localStorage.getItem('kakeibo_fallback_data');
        if (localData) {
          setAllTransactions(JSON.parse(localData));
        }
      } else if (data) {
        setAllTransactions(data as Transaction[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 全体データロード
  const refreshAllData = useCallback(() => {
    fetchCards();
    fetchEmployers();
    fetchExpectedIncomes();
    fetchReimbursements();
    fetchTransactions();
  }, [fetchCards, fetchEmployers, fetchExpectedIncomes, fetchReimbursements, fetchTransactions]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Realtime 監視
  useEffect(() => {
    const channel = supabase
      .channel('kakeibo-realtime-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards' }, () => fetchCards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employers' }, () => fetchEmployers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expected_incomes' }, () => fetchExpectedIncomes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reimbursements' }, () => fetchReimbursements())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, fetchCards, fetchEmployers, fetchExpectedIncomes, fetchReimbursements]);

  // 表示中の月の取引（カードは引き落とし月、現金等は利用月）
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
  };

  const handleResetToday = () => {
    setCurrentDate(new Date());
  };

  // 収支登録・更新
  const handleSubmitTransaction = async (data: TransactionInsert, id?: string) => {
    if (id) {
      const { error } = await supabase.from('transactions').update(data).eq('id', id);
      if (error) {
        const local = localStorage.getItem('kakeibo_fallback_data');
        const list: Transaction[] = local ? JSON.parse(local) : [];
        const updated = list.map((t) => (t.id === id ? { ...t, ...data } : t));
        localStorage.setItem('kakeibo_fallback_data', JSON.stringify(updated));
      }
    } else {
      const { error } = await supabase.from('transactions').insert([data]);
      if (error) {
        const local = localStorage.getItem('kakeibo_fallback_data');
        const list: Transaction[] = local ? JSON.parse(local) : [];
        const newRecord: Transaction = {
          ...data,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('kakeibo_fallback_data', JSON.stringify([newRecord, ...list]));
      }
    }
    await fetchTransactions();
  };

  // 収支削除
  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_fallback_data');
      if (local) {
        const list: Transaction[] = JSON.parse(local);
        const filtered = list.filter((t) => t.id !== id);
        localStorage.setItem('kakeibo_fallback_data', JSON.stringify(filtered));
      }
    }
    await fetchTransactions();
  };

  // クレジットカード CRUD
  const handleAddCard = async (newCard: Omit<CreditCard, 'id'>) => {
    const { error } = await supabase.from('credit_cards').insert([newCard]);
    if (error) {
      const local = localStorage.getItem('kakeibo_cards');
      const list: CreditCard[] = local ? JSON.parse(local) : cards;
      const created: CreditCard = { ...newCard, id: `card-${Date.now()}` };
      localStorage.setItem('kakeibo_cards', JSON.stringify([...list, created]));
      setCards([...list, created]);
    } else {
      await fetchCards();
    }
  };

  const handleUpdateCard = async (id: string, cardData: Omit<CreditCard, 'id'>) => {
    const { error } = await supabase.from('credit_cards').update(cardData).eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_cards');
      const list: CreditCard[] = local ? JSON.parse(local) : cards;
      const updated = list.map((c) => (c.id === id ? { ...c, ...cardData } : c));
      localStorage.setItem('kakeibo_cards', JSON.stringify(updated));
      setCards(updated);
    } else {
      await fetchCards();
    }
  };

  const handleDeleteCard = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_cards');
      if (local) {
        const list: CreditCard[] = JSON.parse(local);
        const filtered = list.filter((c) => c.id !== id);
        localStorage.setItem('kakeibo_cards', JSON.stringify(filtered));
        setCards(filtered);
      }
    } else {
      await fetchCards();
    }
  };

  // バイト先 CRUD
  const handleAddEmployer = async (emp: Omit<Employer, 'id'>) => {
    const { error } = await supabase.from('employers').insert([emp]);
    if (error) {
      const local = localStorage.getItem('kakeibo_employers');
      const list: Employer[] = local ? JSON.parse(local) : employers;
      const created: Employer = { ...emp, id: `emp-${Date.now()}` };
      localStorage.setItem('kakeibo_employers', JSON.stringify([...list, created]));
      setEmployers([...list, created]);
    } else {
      await fetchEmployers();
    }
  };

  const handleUpdateEmployer = async (id: string, emp: Omit<Employer, 'id'>) => {
    const { error } = await supabase.from('employers').update(emp).eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_employers');
      const list: Employer[] = local ? JSON.parse(local) : employers;
      const updated = list.map((e) => (e.id === id ? { ...e, ...emp } : e));
      localStorage.setItem('kakeibo_employers', JSON.stringify(updated));
      setEmployers(updated);
    } else {
      await fetchEmployers();
    }
  };

  const handleDeleteEmployer = async (id: string) => {
    const { error } = await supabase.from('employers').delete().eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_employers');
      if (local) {
        const list: Employer[] = JSON.parse(local);
        const filtered = list.filter((e) => e.id !== id);
        localStorage.setItem('kakeibo_employers', JSON.stringify(filtered));
        setEmployers(filtered);
      }
    } else {
      await fetchEmployers();
    }
  };

  // 振込予定 CRUD & 家計簿反映
  const handleAddExpectedIncome = async (item: Omit<ExpectedIncome, 'id'>) => {
    const { error } = await supabase.from('expected_incomes').insert([item]);
    if (error) {
      const local = localStorage.getItem('kakeibo_expected_incomes');
      const list: ExpectedIncome[] = local ? JSON.parse(local) : expectedIncomes;
      const created: ExpectedIncome = { ...item, id: `inc-${Date.now()}` };
      localStorage.setItem('kakeibo_expected_incomes', JSON.stringify([...list, created]));
      setExpectedIncomes([...list, created]);
    } else {
      await fetchExpectedIncomes();
    }
  };

  const handleToggleConfirmIncome = async (id: string, isConfirmed: boolean) => {
    const { error } = await supabase.from('expected_incomes').update({ is_confirmed: isConfirmed }).eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_expected_incomes');
      const list: ExpectedIncome[] = local ? JSON.parse(local) : expectedIncomes;
      const updated = list.map((i) => (i.id === id ? { ...i, is_confirmed: isConfirmed } : i));
      localStorage.setItem('kakeibo_expected_incomes', JSON.stringify(updated));
      setExpectedIncomes(updated);
    } else {
      await fetchExpectedIncomes();
    }
  };

  const handleDeleteExpectedIncome = async (id: string) => {
    const { error } = await supabase.from('expected_incomes').delete().eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_expected_incomes');
      if (local) {
        const list: ExpectedIncome[] = JSON.parse(local);
        const filtered = list.filter((i) => i.id !== id);
        localStorage.setItem('kakeibo_expected_incomes', JSON.stringify(filtered));
        setExpectedIncomes(filtered);
      }
    } else {
      await fetchExpectedIncomes();
    }
  };

  // 振込予定から家計簿収入へのワンタップ登録
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

  // 立替金 CRUD
  const handleAddReimbursement = async (item: Omit<Reimbursement, 'id'>) => {
    const { error } = await supabase.from('reimbursements').insert([item]);
    if (error) {
      const local = localStorage.getItem('kakeibo_reimbursements');
      const list: Reimbursement[] = local ? JSON.parse(local) : reimbursements;
      const created: Reimbursement = { ...item, id: `reimb-${Date.now()}` };
      localStorage.setItem('kakeibo_reimbursements', JSON.stringify([...list, created]));
      setReimbursements([...list, created]);
    } else {
      await fetchReimbursements();
    }
  };

  const handleToggleSettleReimbursement = async (id: string, isSettled: boolean) => {
    const { error } = await supabase.from('reimbursements').update({ is_settled: isSettled }).eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_reimbursements');
      const list: Reimbursement[] = local ? JSON.parse(local) : reimbursements;
      const updated = list.map((r) => (r.id === id ? { ...r, is_settled: isSettled } : r));
      localStorage.setItem('kakeibo_reimbursements', JSON.stringify(updated));
      setReimbursements(updated);
    } else {
      await fetchReimbursements();
    }
  };

  const handleDeleteReimbursement = async (id: string) => {
    const { error } = await supabase.from('reimbursements').delete().eq('id', id);
    if (error) {
      const local = localStorage.getItem('kakeibo_reimbursements');
      if (local) {
        const list: Reimbursement[] = JSON.parse(local);
        const filtered = list.filter((r) => r.id !== id);
        localStorage.setItem('kakeibo_reimbursements', JSON.stringify(filtered));
        setReimbursements(filtered);
      }
    } else {
      await fetchReimbursements();
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isSynced={true}
        onRefresh={refreshAllData}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        {/* 1. 月別収支 ＆ カレンダー統合ダッシュボード */}
        {activeTab === 'dashboard' && (
          <div>
            <MonthSelector
              currentDate={currentDate}
              onChangeMonth={handleChangeMonth}
              onResetToday={handleResetToday}
            />

            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl px-4 py-2.5 mb-5 flex items-center justify-between text-xs text-blue-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="font-medium">
                  支出集計基準: <strong>カード引き落とし月基準</strong>
                </span>
              </div>
              <span className="text-[11px] text-blue-600 hidden sm:inline">
                ※カード決済分は実際の引落月、現金等は利用月で集計されます
              </span>
            </div>

            <SummaryCards transactions={monthlyTransactions} />

            {/* 表示モード切り替えスイッチ (明細リスト ⇔ カレンダー表示) */}
            <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-700 ml-2">表示形式</span>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setDashboardViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dashboardViewMode === 'list'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>明細リスト</span>
                </button>
                <button
                  onClick={() => setDashboardViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dashboardViewMode === 'calendar'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>カレンダー</span>
                </button>
              </div>
            </div>

            {dashboardViewMode === 'list' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 order-2 lg:order-1">
                  <CategoryBreakdown transactions={monthlyTransactions} />
                </div>
                <div className="lg:col-span-7 order-1 lg:order-2">
                  <TransactionList
                    transactions={monthlyTransactions}
                    cards={cards}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteTransaction}
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
            onToggleConfirmIncome={handleToggleConfirmIncome}
            onDeleteExpectedIncome={handleDeleteExpectedIncome}
            onRegisterIncomeToTransaction={handleRegisterIncomeToTransaction}
            onAddReimbursement={handleAddReimbursement}
            onToggleSettleReimbursement={handleToggleSettleReimbursement}
            onDeleteReimbursement={handleDeleteReimbursement}
          />
        )}

        {/* 3. 年間・バイト代タブ */}
        {activeTab === 'yearly' && (
          <YearlyView 
            transactions={allTransactions} 
            employers={employers}
          />
        )}

        {/* 4. 設定タブ（カード管理・編集 ＆ バイト先マスタ管理） */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <CreditCardManager
              cards={cards}
              transactions={allTransactions}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
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

      {/* フローティング追加ボタン */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3.5 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          <span>収支を記録</span>
        </button>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitTransaction}
        editingTransaction={editingTransaction}
        cards={cards}
        employers={employers}
      />
    </div>
  );
}
